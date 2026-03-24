export interface Room {
  roomId: string;
  roomName: string;
  members: string[];
  protocol: string;
}

export interface Message {
  roomId: string;
  sender: string;
  content: string;
  encrypted: boolean;
  timestamp: number;
  messageId?: string;
  readBy?: Record<string, number>;  // nickname -> read timestamp
  attachmentId?: string;
  attachmentName?: string;
  attachmentType?: string;  // "image" | "file"
  attachmentSize?: number;
  attachmentChecksum?: string;
}

export interface UserProfile {
  nickname: string;
  avatarInitials: string;
  avatarColor: string;
  status: "online" | "idle" | "offline";
  bio: string;
  publicKey?: string;
}

export interface FileTransfer {
  attachmentId: string;
  attachmentName: string;
  attachmentType: string;  // "image" | "file"
  attachmentSize: number;
  roomId: string;
  sender: string;
  encryptedData?: string;  // Base64 encoded
  checksum?: string;
  progress?: number;  // 0-100
}

export interface QKDEvent {
  timestamp: number;
  protocol: string;
  qber: number;
  keyLength: number;
  status: "accepted" | "rejected";
  reason?: string;
  timeTaken?: number;
}

export interface CompromisedDetails {
  qber: number;
  threshold: number;
  protocol: string;
  reason: string;
  timestamp: number;
}

export interface QKDState {
  qber: number;
  protocol: string;
  timeline: QKDEvent[];
  eveEnabled: boolean;
  isGenerating: boolean;
  isCompromised: boolean;
  compromisedDetails?: CompromisedDetails;
}
