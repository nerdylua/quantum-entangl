from dataclasses import dataclass, field
import hashlib
import time


@dataclass
class User:
    sid: str
    nickname: str
    public_key: str
    avatar_initials: str = ""  # Pre-computed from nickname
    avatar_color: str = ""  # Deterministic hex color
    status: str = "online"
    bio: str = ""
    created_at: float = field(default_factory=time.time)


@dataclass
class Room:
    room_id: str
    room_name: str
    members: list[str]  # nicknames
    protocol: str = "bell_state"
    eve_enabled: bool = False


# In-memory state
users: dict[str, User] = {}          # sid -> User
nicknames: dict[str, str] = {}       # nickname -> sid
rooms: dict[str, Room] = {}          # room_id -> Room


def add_user(sid: str, nickname: str, public_key: str, avatar_initials: str = "", avatar_color: str = "") -> User:
    user = User(
        sid=sid,
        nickname=nickname,
        public_key=public_key,
        avatar_initials=avatar_initials,
        avatar_color=avatar_color,
    )
    users[sid] = user
    nicknames[nickname] = sid
    return user


def remove_user(sid: str) -> str | None:
    user = users.pop(sid, None)
    if user:
        nicknames.pop(user.nickname, None)
        return user.nickname
    return None


def get_user_by_sid(sid: str) -> User | None:
    return users.get(sid)


def get_user_by_nickname(nickname: str) -> User | None:
    sid = nicknames.get(nickname)
    if sid:
        return users.get(sid)
    return None


def get_online_nicknames() -> list[str]:
    return list(nicknames.keys())


def create_room(room_id: str, room_name: str, members: list[str], protocol: str) -> Room:
    room = Room(
        room_id=room_id,
        room_name=room_name,
        members=members,
        protocol=protocol,
    )
    rooms[room_id] = room
    return room


def get_room(room_id: str) -> Room | None:
    return rooms.get(room_id)


def generate_avatar(nickname: str) -> tuple[str, str]:
    """Generate avatar initials and color from nickname."""
    # Get first 2 letters of each word, or first 2 letters of nickname
    words = nickname.split()
    if len(words) >= 2:
        initials = (words[0][0] + words[1][0]).upper()
    else:
        initials = nickname[:2].upper()

    # Ensure we have exactly 2 characters
    if len(initials) < 2:
        initials = initials.ljust(2, "_")

    # Deterministic color from nickname using SHA-256 (stable across restarts)
    hash_val = int(hashlib.sha256(nickname.lower().encode()).hexdigest()[:6], 16)
    color = f"#{hash_val:06x}"

    return initials, color
