import { create } from "zustand";
import type { Room, Message, QKDState, UserProfile, FileTransfer } from "./types";

interface AppStore {
  // Auth
  nickname: string | null;
  publicKey: string | null;
  privateKey: string | null;
  setAuth: (nickname: string, publicKey: string, privateKey: string) => void;
  clearAuth: () => void;

  // Login error
  loginError: string | null;
  setLoginError: (error: string | null) => void;

  // Rooms
  rooms: Room[];
  activeRoomId: string | null;
  setActiveRoom: (roomId: string) => void;
  addRoom: (room: Room) => void;
  updateRoomMembers: (roomId: string, members: string[]) => void;
  removeRoom: (roomId: string) => void;

  // Messages (per room)
  messages: Record<string, Message[]>;
  addMessage: (roomId: string, msg: Message) => void;

  // Message pagination (per room)
  messagePagination: Record<string, number>;
  setMessagePaginationStart: (roomId: string, start: number) => void;

  // Encryption keys (per room)
  roomKeys: Record<string, string>;
  setRoomKey: (roomId: string, key: string) => void;

  // Online users
  onlineUsers: string[];
  setOnlineUsers: (users: string[]) => void;
  addOnlineUser: (nickname: string) => void;
  removeOnlineUser: (nickname: string) => void;

  // User profiles
  profiles: Record<string, UserProfile>;
  updateProfile: (nickname: string, profile: Partial<UserProfile>) => void;

  // QKD state (per room)
  qkdState: Record<string, QKDState>;
  updateQKDState: (roomId: string, state: Partial<QKDState>) => void;

  // Typing indicators (per room)
  typingUsers: Record<string, string[]>;
  setTypingUser: (roomId: string, user: string, typing: boolean) => void;

  // Encryption logs
  encryptionLogs: { timestamp: number; action: string; roomId: string }[];
  addEncryptionLog: (action: string, roomId: string) => void;

  // Read receipts
  messageReadReceipts: Record<string, Record<string, Record<string, number>>>;
  updateReadReceipts: (roomId: string, messageId: string, nickname: string, timestamp: number) => void;
  updateMessageReadBy: (roomId: string, messageId: string, nickname: string, timestamp: number) => void;

  // File transfers
  fileTransfers: Record<string, FileTransfer>;
  addFileTransfer: (id: string, transfer: FileTransfer) => void;
  removeFileTransfer: (id: string) => void;
  updateFileTransfer: (id: string, partial: Partial<FileTransfer> & { _appendChunk?: string }) => void;

  // File chunk deduplication
  pendingChunks: Record<string, { chunks: string[]; totalChunks: number }>;
  processedChunks: Record<string, Set<number>>;
  addPendingChunk: (attachmentId: string, chunkIndex: number, totalChunks: number, encryptedChunk: string) => void;
  clearPendingChunks: (attachmentId: string) => { chunks: string[]; totalChunks: number };
  isChunkProcessed: (attachmentId: string, chunkIndex: number) => boolean;
  markChunkProcessed: (attachmentId: string, chunkIndex: number) => void;

  // UI state
  isKeyGenerating: boolean;
  setKeyGenerating: (v: boolean) => void;
}

export const useAppStore = create<AppStore>((set, get) => ({
  // Auth
  nickname: null,
  publicKey: null,
  privateKey: null,
  setAuth: (nickname, publicKey, privateKey) =>
    set({ nickname, publicKey, privateKey }),
  clearAuth: () => set({ nickname: null, publicKey: null, privateKey: null }),

  // Login error
  loginError: null,
  setLoginError: (error) => set({ loginError: error }),

  // Rooms
  rooms: [],
  activeRoomId: null,
  setActiveRoom: (roomId) => set({ activeRoomId: roomId }),
  addRoom: (room) =>
    set((state) => {
      if (state.rooms.find((r) => r.roomId === room.roomId)) return state;
      return { rooms: [...state.rooms, room] };
    }),
  updateRoomMembers: (roomId, members) =>
    set((state) => ({
      rooms: state.rooms.map((r) =>
        r.roomId === roomId ? { ...r, members } : r
      ),
    })),
  removeRoom: (roomId) =>
    set((state) => ({
      rooms: state.rooms.filter((r) => r.roomId !== roomId),
      activeRoomId: state.activeRoomId === roomId ? null : state.activeRoomId,
    })),

  // Messages
  messages: {},
  addMessage: (roomId, msg) =>
    set((state) => {
      const existing = state.messages[roomId] || [];
      // Deduplicate by messageId
      if (msg.messageId && existing.some((m) => m.messageId === msg.messageId)) {
        return state;
      }
      return {
        messages: {
          ...state.messages,
          [roomId]: [...existing, msg],
        },
      };
    }),

  // Message pagination
  messagePagination: {},
  setMessagePaginationStart: (roomId, start) =>
    set((state) => ({
      messagePagination: { ...state.messagePagination, [roomId]: start },
    })),

  // Room keys
  roomKeys: {},
  setRoomKey: (roomId, key) =>
    set((state) => ({
      roomKeys: { ...state.roomKeys, [roomId]: key },
    })),

  // Online users
  onlineUsers: [],
  setOnlineUsers: (users) => set({ onlineUsers: users }),
  addOnlineUser: (nickname) =>
    set((state) => {
      if (state.onlineUsers.includes(nickname)) return state;
      return { onlineUsers: [...state.onlineUsers, nickname] };
    }),
  removeOnlineUser: (nickname) =>
    set((state) => ({
      onlineUsers: state.onlineUsers.filter((u) => u !== nickname),
    })),

  // User profiles
  profiles: {},
  updateProfile: (nickname, partial) =>
    set((state) => ({
      profiles: {
        ...state.profiles,
        [nickname]: {
          ...(state.profiles[nickname] || {
            nickname,
            avatarInitials: "",
            avatarColor: "",
            status: "online" as const,
            bio: "",
          }),
          ...partial,
        },
      },
    })),

  // QKD state
  qkdState: {},
  updateQKDState: (roomId, partial) =>
    set((state) => ({
      qkdState: {
        ...state.qkdState,
        [roomId]: {
          ...(state.qkdState[roomId] || {
            qber: 0,
            protocol: "bell_state",
            timeline: [],
            eveEnabled: false,
            isGenerating: false,
          }),
          ...partial,
        },
      },
    })),

  // Typing indicators
  typingUsers: {},
  setTypingUser: (roomId, user, typing) =>
    set((state) => {
      const current = state.typingUsers[roomId] || [];
      const updated = typing
        ? current.includes(user)
          ? current
          : [...current, user]
        : current.filter((u) => u !== user);
      return {
        typingUsers: { ...state.typingUsers, [roomId]: updated },
      };
    }),

  // Encryption logs
  encryptionLogs: [],
  addEncryptionLog: (action, roomId) =>
    set((state) => ({
      encryptionLogs: [
        ...state.encryptionLogs.slice(-49),
        { timestamp: Date.now(), action, roomId },
      ],
    })),

  // Read receipts
  messageReadReceipts: {},
  updateReadReceipts: (roomId, messageId, nickname, timestamp) =>
    set((state) => ({
      messageReadReceipts: {
        ...state.messageReadReceipts,
        [roomId]: {
          ...(state.messageReadReceipts[roomId] || {}),
          [messageId]: {
            ...((state.messageReadReceipts[roomId] || {})[messageId] || {}),
            [nickname]: timestamp,
          },
        },
      },
    })),
  updateMessageReadBy: (roomId, messageId, nickname, timestamp) =>
    set((state) => {
      const roomMsgs = state.messages[roomId];
      if (!roomMsgs) return state;
      return {
        messages: {
          ...state.messages,
          [roomId]: roomMsgs.map((msg) =>
            msg.messageId === messageId
              ? { ...msg, readBy: { ...(msg.readBy || {}), [nickname]: timestamp } }
              : msg
          ),
        },
      };
    }),

  // File transfers
  fileTransfers: {},
  addFileTransfer: (id, transfer) =>
    set((state) => ({
      fileTransfers: { ...state.fileTransfers, [id]: transfer },
    })),
  removeFileTransfer: (id) =>
    set((state) => {
      const { [id]: _, ...rest } = state.fileTransfers;
      return { fileTransfers: rest };
    }),
  updateFileTransfer: (id, partial) =>
    set((state) => {
      const existing = state.fileTransfers[id];
      if (!existing) return state;

      const appendChunk = (partial as any)._appendChunk as string | undefined;
      if (appendChunk) {
        const { _appendChunk, ...rest } = partial as any;
        return {
          fileTransfers: {
            ...state.fileTransfers,
            [id]: {
              ...existing,
              ...rest,
              encryptedData: (existing.encryptedData || "") + appendChunk,
            },
          },
        };
      }

      return {
        fileTransfers: {
          ...state.fileTransfers,
          [id]: { ...existing, ...partial },
        },
      };
    }),

  // File chunk deduplication
  pendingChunks: {},
  processedChunks: {},
  addPendingChunk: (attachmentId, chunkIndex, totalChunks, encryptedChunk) => {
    const state = get();
    const existing = state.pendingChunks[attachmentId] || { chunks: [], totalChunks: 0 };
    const chunks = [...existing.chunks];
    chunks[chunkIndex] = encryptedChunk;
    set({
      pendingChunks: {
        ...state.pendingChunks,
        [attachmentId]: { chunks, totalChunks },
      },
    });
  },
  clearPendingChunks: (attachmentId) => {
    const state = get();
    const pending = state.pendingChunks[attachmentId] || { chunks: [], totalChunks: 0 };
    const orderedChunks = pending.chunks.filter((c) => c !== undefined);
    const { [attachmentId]: _, ...rest } = state.pendingChunks;
    set({ pendingChunks: rest });
    return { chunks: orderedChunks, totalChunks: pending.totalChunks };
  },
  isChunkProcessed: (attachmentId, chunkIndex) => {
    const state = get();
    return state.processedChunks[attachmentId]?.has(chunkIndex) ?? false;
  },
  markChunkProcessed: (attachmentId, chunkIndex) => {
    const state = get();
    const existing = state.processedChunks[attachmentId] || new Set<number>();
    const updated = new Set(existing);
    updated.add(chunkIndex);
    set({
      processedChunks: { ...state.processedChunks, [attachmentId]: updated },
    });
  },

  // UI
  isKeyGenerating: false,
  setKeyGenerating: (v) => set({ isKeyGenerating: v }),
}));
