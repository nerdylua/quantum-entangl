import asyncio
import uuid
import time

from app.server import sio
from app.ws import rooms as room_state
from app.ws.key_distribution import perform_key_exchange
from app.qkd.engine import resolve_protocol


@sio.event
async def connect(sid, environ):
    print(f"Client connected: {sid}")


@sio.event
async def disconnect(sid):
    nickname = room_state.remove_user(sid)
    if nickname:
        print(f"User disconnected: {nickname}")
        await sio.emit("user_offline", {"nickname": nickname})

        # Remove user from all rooms and notify remaining members
        for room_id, room in list(room_state.rooms.items()):
            if nickname in room.members:
                room.members.remove(nickname)
                await sio.emit(
                    "member_left",
                    {"roomId": room_id, "nickname": nickname, "members": room.members},
                    room=room_id,
                )
                # Clean up empty rooms
                if len(room.members) == 0:
                    del room_state.rooms[room_id]


@sio.event
async def register(sid, data):
    nickname = data.get("nickname", "").strip()
    public_key = data.get("publicKey", "")

    if not nickname:
        await sio.emit("error", {"message": "Nickname is required"}, to=sid)
        return

    existing = room_state.get_user_by_nickname(nickname)
    if existing and existing.sid != sid:
        await sio.emit("error", {"message": "Nickname already taken"}, to=sid)
        return

    # Generate avatar for user
    avatar_initials, avatar_color = room_state.generate_avatar(nickname)
    room_state.add_user(sid, nickname, public_key, avatar_initials, avatar_color)
    online = room_state.get_online_nicknames()

    await sio.emit("registered", {"success": True, "onlineUsers": online}, to=sid)
    await sio.emit(
        "user_online",
        {
            "nickname": nickname,
            "avatarInitials": avatar_initials,
            "avatarColor": avatar_color,
            "status": "online",
        },
        skip_sid=sid,
    )
    print(f"User registered: {nickname}")


@sio.event
async def create_room(sid, data):
    room_name = data.get("roomName", "New Room")
    members = data.get("members", [])
    protocol = data.get("protocol", "bell_state")

    creator = room_state.get_user_by_sid(sid)
    if not creator:
        await sio.emit("error", {"message": "Not registered"}, to=sid)
        return

    if creator.nickname not in members:
        members.insert(0, creator.nickname)

    # Filter out offline members — they can't join the Socket.IO room or receive keys
    members = [m for m in members if room_state.get_user_by_nickname(m)]

    if len(members) < 2:
        await sio.emit("error", {"message": "Not enough online members to create a room"}, to=sid)
        return

    # Resolve protocol: auto-select GHZ for 3+ parties
    resolved = resolve_protocol(protocol, len(members))

    room_id = str(uuid.uuid4())[:8]
    room = room_state.create_room(room_id, room_name, members, resolved)

    # Add all members to the Socket.IO room
    for member_nick in members:
        member = room_state.get_user_by_nickname(member_nick)
        if member:
            await sio.enter_room(member.sid, room_id)

    await sio.emit(
        "room_created",
        {
            "roomId": room.room_id,
            "roomName": room.room_name,
            "members": room.members,
            "protocol": room.protocol,
        },
        room=room_id,
    )
    print(f"Room created: {room_name} ({room_id}) with {members} using {resolved}")

    # Trigger QKD key exchange in the background
    asyncio.create_task(perform_key_exchange(room_id))


@sio.event
async def join_room(sid, data):
    room_id = data.get("roomId", "")
    room = room_state.get_room(room_id)
    user = room_state.get_user_by_sid(sid)

    if not room or not user:
        await sio.emit("error", {"message": "Room not found"}, to=sid)
        return

    if user.nickname not in room.members:
        room.members.append(user.nickname)
        # Notify existing members about new member
        await sio.emit(
            "member_joined",
            {"roomId": room_id, "nickname": user.nickname, "members": room.members},
            room=room_id,
        )

    await sio.enter_room(sid, room_id)
    await sio.emit(
        "room_created",
        {
            "roomId": room.room_id,
            "roomName": room.room_name,
            "members": room.members,
            "protocol": room.protocol,
        },
        to=sid,
    )

    # Trigger rekey so the new member gets the key
    asyncio.create_task(perform_key_exchange(room_id))


@sio.event
async def leave_room(sid, data):
    room_id = data.get("roomId", "")
    room = room_state.get_room(room_id)
    user = room_state.get_user_by_sid(sid)

    if not room or not user:
        return

    if user.nickname in room.members:
        room.members.remove(user.nickname)

    await sio.leave_room(sid, room_id)

    # Notify remaining members
    await sio.emit(
        "member_left",
        {"roomId": room_id, "nickname": user.nickname, "members": room.members},
        room=room_id,
    )

    # Clean up empty rooms
    if len(room.members) == 0:
        del room_state.rooms[room_id]


@sio.event
async def delete_room(sid, data):
    room_id = data.get("roomId", "")
    room = room_state.get_room(room_id)
    user = room_state.get_user_by_sid(sid)

    if not room or not user:
        return

    if user.nickname not in room.members:
        await sio.emit("error", {"message": "Not a member of this room"}, to=sid)
        return

    # Notify all members before deletion
    await sio.emit("room_deleted", {"roomId": room_id}, room=room_id)

    # Remove all members from the Socket.IO room
    for member_nick in list(room.members):
        member = room_state.get_user_by_nickname(member_nick)
        if member:
            await sio.leave_room(member.sid, room_id)

    del room_state.rooms[room_id]


@sio.event
async def edit_room(sid, data):
    room_id = data.get("roomId", "")
    new_name = data.get("roomName", "").strip()
    room = room_state.get_room(room_id)
    user = room_state.get_user_by_sid(sid)

    if not room or not user:
        return

    if user.nickname not in room.members:
        await sio.emit("error", {"message": "Not a member of this room"}, to=sid)
        return

    if not new_name:
        await sio.emit("error", {"message": "Room name cannot be empty"}, to=sid)
        return

    room.room_name = new_name
    await sio.emit(
        "room_updated",
        {"roomId": room_id, "roomName": new_name},
        room=room_id,
    )


@sio.event
async def message(sid, data):
    room_id = data.get("roomId", "")
    content = data.get("content", "")
    encrypted = data.get("encrypted", True)
    timestamp = data.get("timestamp", time.time())
    message_id = data.get("messageId", str(uuid.uuid4()))
    attachment_id = data.get("attachmentId", "")

    user = room_state.get_user_by_sid(sid)
    if not user:
        return

    room = room_state.get_room(room_id)
    if not room:
        return

    # Reject unencrypted messages — require QKD key exchange first
    if not encrypted:
        await sio.emit(
            "error",
            {"message": "Cannot send unencrypted messages. Wait for key exchange to complete."},
            to=sid,
        )
        return

    # Initialize read_by with sender already marked as read
    read_by = {user.nickname: timestamp}

    # Build message payload, including attachment metadata if present
    msg_payload = {
        "roomId": room_id,
        "sender": user.nickname,
        "content": content,
        "encrypted": encrypted,
        "timestamp": timestamp,
        "messageId": message_id,
        "readBy": read_by,
        "attachmentId": attachment_id,
    }

    # Forward attachment metadata so receivers can render file previews
    attachment_name = data.get("attachmentName", "")
    attachment_type = data.get("attachmentType", "")
    attachment_size = data.get("attachmentSize", 0)
    if attachment_name:
        msg_payload["attachmentName"] = attachment_name
        msg_payload["attachmentType"] = attachment_type
        msg_payload["attachmentSize"] = attachment_size

    await sio.emit("message", msg_payload, room=room_id, skip_sid=sid)


@sio.event
async def typing(sid, data):
    room_id = data.get("roomId", "")
    is_typing = data.get("typing", False)

    user = room_state.get_user_by_sid(sid)
    if not user:
        return

    await sio.emit(
        "typing",
        {"roomId": room_id, "user": user.nickname, "typing": is_typing},
        room=room_id,
        skip_sid=sid,
    )


@sio.event
async def toggle_eavesdropper(sid, data):
    room_id = data.get("roomId", "")
    enabled = data.get("enabled", False)

    room = room_state.get_room(room_id)
    if room:
        room.eve_enabled = enabled
        await sio.emit(
            "eavesdropper_status",
            {"roomId": room_id, "enabled": enabled},
            room=room_id,
        )


@sio.event
async def request_rekey(sid, data):
    room_id = data.get("roomId", "")
    protocol = data.get("protocol", None)

    user = room_state.get_user_by_sid(sid)
    if not user:
        await sio.emit("error", {"message": "Not registered"}, to=sid)
        return

    room = room_state.get_room(room_id)
    if not room:
        await sio.emit("error", {"message": "Room not found"}, to=sid)
        return

    asyncio.create_task(perform_key_exchange(room_id, protocol=protocol))


@sio.event
async def mark_message_read(sid, data):
    """Mark message as read and broadcast read receipt."""
    user = room_state.get_user_by_sid(sid)
    if not user:
        return

    room_id = data.get("roomId", "")
    message_id = data.get("messageId", "")
    timestamp = data.get("timestamp", time.time())

    room = room_state.get_room(room_id)
    if not room or user.nickname not in room.members:
        return

    # Broadcast read receipt to room
    await sio.emit(
        "message_read",
        {
            "roomId": room_id,
            "messageId": message_id,
            "nickname": user.nickname,
            "timestamp": timestamp,
        },
        room=room_id,
    )


@sio.event
async def file_start_transfer(sid, data):
    """Announce file transfer start."""
    user = room_state.get_user_by_sid(sid)
    if not user:
        await sio.emit("error", {"message": "Not registered"}, to=sid)
        return

    room_id = data.get("roomId", "")
    attachment_id = data.get("attachmentId", "")
    attachment_name = data.get("attachmentName", "")
    attachment_type = data.get("attachmentType", "")  # "image" or "file"
    attachment_size = data.get("attachmentSize", 0)

    # Validate size (10MB max)
    if attachment_size > 10 * 1024 * 1024:
        await sio.emit(
            "file_error",
            {"attachmentId": attachment_id, "error": "File exceeds 10MB limit"},
            to=sid,
        )
        return

    room = room_state.get_room(room_id)
    if not room or user.nickname not in room.members:
        await sio.emit("error", {"message": "Room not found or access denied"}, to=sid)
        return

    # Broadcast file availability to room
    await sio.emit(
        "file_available",
        {
            "roomId": room_id,
            "attachmentId": attachment_id,
            "attachmentName": attachment_name,
            "attachmentType": attachment_type,
            "attachmentSize": attachment_size,
            "sender": user.nickname,
        },
        room=room_id,
    )


@sio.event
async def file_chunk(sid, data):
    """Relay encrypted file chunk to room members."""
    user = room_state.get_user_by_sid(sid)
    if not user:
        await sio.emit("error", {"message": "Not registered"}, to=sid)
        return

    attachment_id = data.get("attachmentId", "")
    chunk_index = data.get("chunkIndex", 0)
    total_chunks = data.get("totalChunks", 0)
    encrypted_chunk = data.get("encryptedChunk", "")
    room_id = data.get("roomId", "")

    room = room_state.get_room(room_id)
    if not room or user.nickname not in room.members:
        await sio.emit("error", {"message": "Room not found or access denied"}, to=sid)
        return

    # Relay to all room members except sender
    await sio.emit(
        "file_chunk",
        {
            "attachmentId": attachment_id,
            "chunkIndex": chunk_index,
            "totalChunks": total_chunks,
            "encryptedChunk": encrypted_chunk,
        },
        room=room_id,
        skip_sid=sid,
    )


@sio.event
async def update_profile(sid, data):
    """Update user profile (bio, status) and broadcast to all rooms."""
    user = room_state.get_user_by_sid(sid)
    if not user:
        await sio.emit("error", {"message": "Not registered"}, to=sid)
        return

    bio = data.get("bio", user.bio)
    status = data.get("status", user.status)

    # Validate
    if len(bio) > 100:
        bio = bio[:100]
    if status not in ("online", "idle", "offline"):
        status = user.status

    user.bio = bio
    user.status = status

    profile_data = {
        "nickname": user.nickname,
        "avatarInitials": user.avatar_initials,
        "avatarColor": user.avatar_color,
        "status": user.status,
        "bio": user.bio,
    }

    # Broadcast profile update to all rooms this user is in
    for room_id, room in room_state.rooms.items():
        if user.nickname in room.members:
            await sio.emit("profile_updated", profile_data, room=room_id)
