"""
Key Distribution - RSA-OAEP encrypt QKD key and distribute to room members via Socket.IO.
"""

import base64
from cryptography.hazmat.primitives import serialization, hashes
from cryptography.hazmat.primitives.asymmetric import padding

from app.server import sio
from app.ws import rooms as room_state
from app.qkd.engine import generate_key, KeyResult


def _encrypt_key_for_user(binary_key: str, public_key_pem: str) -> str:
    """
    Encrypt a binary key string with the user's RSA public key (RSA-OAEP).
    Converts the 256-char binary string ("010110...") to 32 raw bytes before encrypting.
    Returns base64-encoded ciphertext.
    """
    key_bytes = int(binary_key, 2).to_bytes(len(binary_key) // 8, byteorder="big")
    public_key = serialization.load_pem_public_key(public_key_pem.encode("utf-8"))
    encrypted = public_key.encrypt(
        key_bytes,
        padding.OAEP(
            mgf=padding.MGF1(algorithm=hashes.SHA256()),
            algorithm=hashes.SHA256(),
            label=None,
        ),
    )
    return base64.b64encode(encrypted).decode("utf-8")


async def perform_key_exchange(room_id: str, protocol: str | None = None):
    """
    Run QKD key generation and distribute the encrypted key to all room members.

    Flow:
    1. Emit rekey_started to all members
    2. Run QKD engine to generate 256-bit key
    3. If COMPROMISED: emit key_rejected, auto-retry without eavesdropper
    4. If OK: encrypt key with each member's RSA public key, emit key_exchange
    5. Emit qkd_metrics for dashboard
    """
    room = room_state.get_room(room_id)
    if not room:
        return

    if protocol:
        room.protocol = protocol

    # Determine number of parties for protocol auto-selection
    n_parties = len(room.members)

    # Notify clients that key generation is starting
    await sio.emit("rekey_started", {"roomId": room_id}, room=room_id)

    # Run QKD engine (auto-selects GHZ for 3+ parties)
    result: KeyResult = await generate_key(
        protocol=room.protocol,
        key_length=256,
        eavesdropper=room.eve_enabled,
        n_parties=n_parties,
    )

    if result.status == "COMPROMISED":
        # Key rejected due to high QBER (eavesdropper detected)
        await sio.emit(
            "key_rejected",
            {
                "roomId": room_id,
                "qber": result.qber,
                "reason": f"QBER {result.qber:.2%} exceeds threshold - eavesdropper detected",
                "protocol": result.protocol,
            },
            room=room_id,
        )

        # Auto-retry without eavesdropper
        if room.eve_enabled:
            room.eve_enabled = False
            await sio.emit(
                "eavesdropper_status",
                {"roomId": room_id, "enabled": False},
                room=room_id,
            )

        retry_result = await generate_key(
            protocol=room.protocol,
            key_length=256,
            eavesdropper=False,
            n_parties=n_parties,
        )

        if retry_result.status != "OK" or not retry_result.key:
            await sio.emit(
                "error",
                {"message": f"Key generation failed after retry: {retry_result.status}"},
                room=room_id,
            )
            return

        result = retry_result

    elif result.status == "ERROR":
        # Protocol execution error
        await sio.emit(
            "error",
            {"message": "Key generation protocol error - retrying with different settings"},
            room=room_id,
        )

        # Retry with a different protocol if possible
        alt_protocols = {
            "bell_state": "bb84",
            "bb84": "e91",
            "e91": "bell_state",
            "ghz": "ghz",  # GHZ for multi-party, can't switch
        }
        alt_protocol = alt_protocols.get(room.protocol, "bb84")

        if alt_protocol != room.protocol:
            # Retry with alternative protocol
            retry_result = await generate_key(
                protocol=alt_protocol,
                key_length=256,
                eavesdropper=False,
                n_parties=n_parties,
            )

            if retry_result.status == "OK" and retry_result.key:
                result = retry_result
            else:
                await sio.emit(
                    "error",
                    {"message": "Key generation failed - please try again"},
                    room=room_id,
                )
                return
        else:
            # Multi-party GHZ, can't switch
            await sio.emit(
                "error",
                {"message": "Multi-party key generation failed - please try again"},
                room=room_id,
            )
            return

    if not result.key:
        await sio.emit(
            "error",
            {"message": "Key generation failed"},
            room=room_id,
        )
        return

    # Distribute encrypted key to each member
    for member_nick in room.members:
        member = room_state.get_user_by_nickname(member_nick)
        if not member or not member.public_key:
            continue

        try:
            encrypted_key = _encrypt_key_for_user(result.key, member.public_key)
        except Exception as e:
            print(f"Failed to encrypt key for {member_nick}: {e}")
            continue

        await sio.emit(
            "key_exchange",
            {
                "roomId": room_id,
                "encryptedKey": encrypted_key,
                "protocol": result.protocol,
                "qber": result.qber,
                "timeTaken": result.time_taken,
            },
            to=member.sid,
        )

    # Emit QKD metrics for dashboard
    await sio.emit(
        "qkd_metrics",
        {
            "roomId": room_id,
            "qber": result.qber,
            "protocol": result.protocol,
            "keyLength": result.key_length,
            "timeTaken": result.time_taken,
            "rounds": result.rounds,
        },
        room=room_id,
    )
