from pydantic import BaseModel


class LoginRequest(BaseModel):
    nickname: str


class LoginResponse(BaseModel):
    success: bool
    nickname: str


class RoomInfo(BaseModel):
    room_id: str
    room_name: str
    members: list[str]
    protocol: str


class MessageData(BaseModel):
    room_id: str
    sender: str
    content: str
    encrypted: bool
    timestamp: float
    message_id: str = ""  # UUID for unique identification
    read_by: dict[str, float] = {}  # {nickname: read_timestamp}
    attachment_id: str = ""  # UUID if file attached
    attachment_name: str = ""  # Original filename
    attachment_type: str = ""  # "image" or "file"
    attachment_size: int = 0  # Bytes
    attachment_checksum: str = ""  # MD5 for integrity check


class UserProfile(BaseModel):
    nickname: str
    avatar_initials: str  # First 2 letters
    avatar_color: str  # Hex color (#RRGGBB)
    status: str = "online"  # "online", "idle", "offline"
    bio: str = ""
    public_key: str


class FileMetadata(BaseModel):
    attachment_id: str
    attachment_name: str
    attachment_type: str
    attachment_size: int
    room_id: str
    sender: str
