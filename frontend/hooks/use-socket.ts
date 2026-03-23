"use client";

import { useEffect, useRef } from "react";
import { getSocket, connectSocket, disconnectSocket } from "@/lib/socket";
import { useAppStore } from "@/lib/store";
import { decryptSymmetricKey } from "@/lib/encryption";
import { toast } from "sonner";
import type { Room, Message } from "@/lib/types";

export function useSocket() {
  const initialized = useRef(false);
  const nickname = useAppStore((s) => s.nickname);
  const publicKey = useAppStore((s) => s.publicKey);
  const addRoom = useAppStore((s) => s.addRoom);
  const updateRoomMembers = useAppStore((s) => s.updateRoomMembers);
  const addMessage = useAppStore((s) => s.addMessage);
  const setOnlineUsers = useAppStore((s) => s.setOnlineUsers);
  const addOnlineUser = useAppStore((s) => s.addOnlineUser);
  const removeOnlineUser = useAppStore((s) => s.removeOnlineUser);
  const setRoomKey = useAppStore((s) => s.setRoomKey);
  const updateQKDState = useAppStore((s) => s.updateQKDState);
  const setKeyGenerating = useAppStore((s) => s.setKeyGenerating);
  const setTypingUser = useAppStore((s) => s.setTypingUser);
  const addEncryptionLog = useAppStore((s) => s.addEncryptionLog);
  const updateProfile = useAppStore((s) => s.updateProfile);
  const updateReadReceipts = useAppStore((s) => s.updateReadReceipts);
  const updateMessageReadBy = useAppStore((s) => s.updateMessageReadBy);
  const addFileTransfer = useAppStore((s) => s.addFileTransfer);
  const removeFileTransfer = useAppStore((s) => s.removeFileTransfer);

  useEffect(() => {
    if (!nickname || !publicKey || initialized.current) return;
    initialized.current = true;

    const socket = connectSocket();

    socket.on("connect", () => {
      socket.emit("register", { nickname, publicKey });
    });

    socket.on("registered", (data: { success: boolean; onlineUsers: string[] }) => {
      if (data.success) {
        setOnlineUsers(data.onlineUsers);
        // Update profiles for online users if avatar data is available
        if (Array.isArray(data.onlineUsers)) {
          data.onlineUsers.forEach((user: any) => {
            if (typeof user === 'object' && user.nickname) {
              updateProfile(user.nickname, {
                avatarInitials: user.avatarInitials || "",
                avatarColor: user.avatarColor || "",
                status: user.status || "online",
              });
            }
          });
        }
      }
    });

    socket.on("user_online", (data: {
      nickname: string;
      avatarInitials?: string;
      avatarColor?: string;
      status?: string;
    }) => {
      addOnlineUser(data.nickname);
      if (data.avatarInitials && data.avatarColor) {
        updateProfile(data.nickname, {
          avatarInitials: data.avatarInitials,
          avatarColor: data.avatarColor,
          status: (data.status || "online") as "online" | "idle" | "offline",
        });
      }
    });

    socket.on("user_offline", (data: { nickname: string }) => {
      removeOnlineUser(data.nickname);
    });

    socket.on("room_created", (data: Room) => {
      addRoom(data);
    });

    socket.on("member_joined", (data: { roomId: string; nickname: string; members: string[] }) => {
      updateRoomMembers(data.roomId, data.members);
    });

    socket.on("member_left", (data: { roomId: string; nickname: string; members: string[] }) => {
      updateRoomMembers(data.roomId, data.members);
    });

    socket.on("message", (data: Message) => {
      addMessage(data.roomId, data);
      if (data.encrypted) {
        addEncryptionLog("Received encrypted message", data.roomId);
      }
    });

    socket.on("typing", (data: { roomId: string; user: string; typing: boolean }) => {
      setTypingUser(data.roomId, data.user, data.typing);
    });

    socket.on("key_exchange", (data: {
      roomId: string;
      encryptedKey: string;
      protocol: string;
      qber: number;
      timeTaken: number;
    }) => {
      // Decrypt the RSA-OAEP encrypted key with our private key
      const privKey = useAppStore.getState().privateKey;
      if (!privKey) {
        console.error("No private key available to decrypt symmetric key");
        return;
      }

      try {
        const binaryKey = decryptSymmetricKey(data.encryptedKey, privKey);

        // Skip if we already have this exact key (deduplication)
        const existingKey = useAppStore.getState().roomKeys[data.roomId];
        if (existingKey === binaryKey) {
          return;
        }

        setRoomKey(data.roomId, binaryKey);
        updateQKDState(data.roomId, {
          qber: data.qber,
          protocol: data.protocol,
          isGenerating: false,
          timeline: [
            ...(useAppStore.getState().qkdState[data.roomId]?.timeline || []),
            {
              timestamp: Date.now(),
              protocol: data.protocol,
              qber: data.qber,
              keyLength: 128,
              status: "accepted" as const,
              timeTaken: data.timeTaken,
            },
          ],
        });
        // Use unique toast ID to prevent duplicates
        toast.success("Quantum key exchanged", {
          id: `qkd-${data.roomId}`,
          description: `${data.protocol.replace("_", " ").toUpperCase()} - QBER: ${(data.qber * 100).toFixed(1)}%`,
        });
        addEncryptionLog(`QKD key accepted (${data.protocol})`, data.roomId);
      } catch (err) {
        console.error("Failed to decrypt symmetric key:", err);
        toast.error("Key decryption failed", { id: `qkd-error-${data.roomId}` });
      }
      setKeyGenerating(false);
    });

    socket.on("rekey_started", (data: { roomId: string }) => {
      setKeyGenerating(true);
      if (data.roomId) {
        updateQKDState(data.roomId, { isGenerating: true });
      }
    });

    socket.on("key_rejected", (data: {
      roomId: string;
      qber: number;
      reason: string;
      protocol: string;
    }) => {
      updateQKDState(data.roomId, {
        qber: data.qber,
        timeline: [
          ...(useAppStore.getState().qkdState[data.roomId]?.timeline || []),
          {
            timestamp: Date.now(),
            protocol: data.protocol,
            qber: data.qber,
            keyLength: 0,
            status: "rejected" as const,
            reason: data.reason,
          },
        ],
      });
      toast.error("Eavesdropper detected!", {
        id: `qkd-rejected-${data.roomId}`,
        description: `QBER ${(data.qber * 100).toFixed(1)}% exceeds threshold. Key rejected, auto-rekeying...`,
        duration: 5000,
      });
      addEncryptionLog(`Key REJECTED - Eve detected (QBER ${(data.qber * 100).toFixed(1)}%)`, data.roomId);
    });

    socket.on("qkd_metrics", (data: {
      roomId: string;
      qber: number;
      protocol: string;
      keyLength: number;
      timeTaken: number;
      rounds: number;
    }) => {
      updateQKDState(data.roomId, {
        qber: data.qber,
        protocol: data.protocol,
      });
    });

    socket.on("eavesdropper_status", (data: { roomId: string; enabled: boolean }) => {
      updateQKDState(data.roomId, { eveEnabled: data.enabled });
      if (data.enabled) {
        toast.warning("Eavesdropper enabled", {
          description: "Eve will intercept the next key exchange.",
        });
      } else {
        toast.info("Eavesdropper disabled", {
          description: "Quantum channel is clean.",
        });
      }
    });

    socket.on("profile_updated", (data: {
      nickname: string;
      avatarInitials: string;
      avatarColor: string;
      status: string;
      bio: string;
    }) => {
      updateProfile(data.nickname, {
        avatarInitials: data.avatarInitials,
        avatarColor: data.avatarColor,
        status: data.status as "online" | "idle" | "offline",
        bio: data.bio,
      });
    });

    socket.on("message_read", (data: {
      roomId: string;
      messageId: string;
      nickname: string;
      timestamp: number;
    }) => {
      updateReadReceipts(data.roomId, data.messageId, data.nickname, data.timestamp);
      updateMessageReadBy(data.roomId, data.messageId, data.nickname, data.timestamp);
    });

    socket.on("file_available", (data: {
      roomId: string;
      attachmentId: string;
      attachmentName: string;
      attachmentType: string;
      attachmentSize: number;
      sender: string;
    }) => {
      const store = useAppStore.getState();

      // Skip if we're the sender (we already have our local copy with full data)
      if (data.sender === store.nickname) {
        return;
      }

      // Skip if we already have this transfer with data (shouldn't happen, but safety check)
      const existing = store.fileTransfers[data.attachmentId];
      if (existing?.encryptedData) {
        return;
      }

      // Get any pending chunks that arrived before this event
      const pending = store.clearPendingChunks(data.attachmentId);
      const encryptedData = pending.chunks.length > 0 ? pending.chunks.join("") : undefined;

      // Calculate progress based on pending chunks
      let progress = 0;
      if (pending.chunks.length > 0 && pending.totalChunks > 0) {
        progress = Math.round((pending.chunks.length / pending.totalChunks) * 100);
      }

      addFileTransfer(data.attachmentId, {
        attachmentId: data.attachmentId,
        attachmentName: data.attachmentName,
        attachmentType: data.attachmentType,
        attachmentSize: data.attachmentSize,
        roomId: data.roomId,
        sender: data.sender,
        encryptedData,
        progress,
      });
    });

    socket.on("file_chunk", (data: {
      attachmentId: string;
      chunkIndex: number;
      totalChunks: number;
      encryptedChunk: string;
    }) => {
      const store = useAppStore.getState();

      // Deduplication: skip if this chunk was already processed
      if (store.isChunkProcessed(data.attachmentId, data.chunkIndex)) {
        return;
      }
      store.markChunkProcessed(data.attachmentId, data.chunkIndex);

      const transfer = store.fileTransfers[data.attachmentId];

      if (transfer) {
        // Transfer exists, append chunk atomically using _appendChunk
        const progress = Math.round(((data.chunkIndex + 1) / data.totalChunks) * 100);

        store.updateFileTransfer(data.attachmentId, {
          _appendChunk: data.encryptedChunk,
          progress,
        } as any);
      } else {
        // Transfer doesn't exist yet (file_available hasn't arrived), queue the chunk
        store.addPendingChunk(data.attachmentId, data.chunkIndex, data.totalChunks, data.encryptedChunk);
      }
    });

    socket.on("file_error", (data: { attachmentId: string; error: string }) => {
      toast.error(`File transfer failed: ${data.error}`, { id: `file-error-${data.attachmentId}` });
      removeFileTransfer(data.attachmentId);
    });

    socket.on("error", (data: { message: string }) => {
      console.error("Socket error:", data.message);

      // Handle nickname already taken error
      if (data.message.toLowerCase().includes("nickname already taken")) {
        const store = useAppStore.getState();
        store.setLoginError(data.message);
        store.clearAuth();
        disconnectSocket();
        // Redirect will happen automatically due to nickname being null
        return;
      }

      toast.error("Connection error", { id: "socket-error", description: data.message });
    });

    return () => {
      // Remove all event listeners before disconnecting
      socket.off("connect");
      socket.off("registered");
      socket.off("user_online");
      socket.off("user_offline");
      socket.off("room_created");
      socket.off("member_joined");
      socket.off("member_left");
      socket.off("key_exchange");
      socket.off("key_rejected");
      socket.off("rekey_started");
      socket.off("qkd_metrics");
      socket.off("eavesdropper_status");
      socket.off("message");
      socket.off("typing");
      socket.off("profile_updated");
      socket.off("message_read");
      socket.off("file_available");
      socket.off("file_chunk");
      socket.off("file_error");
      socket.off("error");
      disconnectSocket();
      initialized.current = false;
    };
  }, [
    nickname,
    publicKey,
  ]);

  return getSocket();
}
