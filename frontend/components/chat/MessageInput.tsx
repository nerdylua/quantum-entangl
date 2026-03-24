"use client";

import { useState, useRef, useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { getSocket } from "@/lib/socket";
import { encryptMessage } from "@/lib/encryption";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Lock, Unlock, Paperclip, X, Loader2 } from "lucide-react";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const CHUNK_SIZE = 64 * 1024; // 64KB chunks

export function MessageInput() {
  const [text, setText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const activeRoomId = useAppStore((s) => s.activeRoomId);
  const roomKeys = useAppStore((s) => s.roomKeys);
  const typingUsers = useAppStore((s) => s.typingUsers);
  const nickname = useAppStore((s) => s.nickname);
  const addEncryptionLog = useAppStore((s) => s.addEncryptionLog);
  const addMessage = useAppStore((s) => s.addMessage);
  const addFileTransfer = useAppStore((s) => s.addFileTransfer);
  const updateFileTransfer = useAppStore((s) => s.updateFileTransfer);
  const typingTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const roomKey = activeRoomId ? roomKeys[activeRoomId] : undefined;
  const typers = activeRoomId ? typingUsers[activeRoomId] || [] : [];
  const qkdState = useAppStore((s) => s.qkdState);
  const isGeneratingKey = activeRoomId
    ? qkdState[activeRoomId]?.isGenerating ?? false
    : false;
  const canSend = !!roomKey;

  // Clear typing timeout and emit typing:false on unmount or room switch
  useEffect(() => {
    return () => {
      if (typingTimeout.current) {
        clearTimeout(typingTimeout.current);
        typingTimeout.current = undefined;
      }
      if (activeRoomId) {
        const socket = getSocket();
        if (socket.connected) {
          socket.emit("typing", { roomId: activeRoomId, typing: false });
        }
      }
    };
  }, [activeRoomId]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      alert(`File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`);
      return;
    }

    setSelectedFile(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
  };

  const handleSendFile = async () => {
    if (!selectedFile || !activeRoomId || !roomKey) return;

    setIsUploading(true);
    const socket = getSocket();
    const attachmentId = crypto.randomUUID();
    const attachmentType = selectedFile.type.startsWith("image/") ? "image" : "file";

    try {
      // Read file as base64 data URL
      const fileData = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(selectedFile);
      });

      // Encrypt the file data
      const encryptedData = encryptMessage(fileData, roomKey);

      // Add local file transfer for sender
      addFileTransfer(attachmentId, {
        attachmentId,
        attachmentName: selectedFile.name,
        attachmentType,
        attachmentSize: selectedFile.size,
        roomId: activeRoomId,
        sender: useAppStore.getState().nickname || "",
        encryptedData,
        progress: 100,
      });

      // Send file start event
      socket.emit("file_start_transfer", {
        roomId: activeRoomId,
        attachmentId,
        attachmentName: selectedFile.name,
        attachmentType,
        attachmentSize: selectedFile.size,
      });

      // Split encrypted data into chunks and send
      const totalChunks = Math.ceil(encryptedData.length / CHUNK_SIZE);
      for (let i = 0; i < totalChunks; i++) {
        const chunk = encryptedData.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
        socket.emit("file_chunk", {
          roomId: activeRoomId,
          attachmentId,
          chunkIndex: i,
          totalChunks,
          encryptedChunk: chunk,
        });
      }

      // Send message with attachment reference
      const messageContent = `Shared a file: ${selectedFile.name}`;
      const encryptedContent = encryptMessage(messageContent, roomKey);
      const timestamp = Math.floor(Date.now() / 1000);
      const messageId = crypto.randomUUID();
      const senderNickname = useAppStore.getState().nickname || "";

      // Add message to local store immediately (server skips sender)
      addMessage(activeRoomId, {
        roomId: activeRoomId,
        sender: senderNickname,
        content: encryptedContent,
        encrypted: true,
        timestamp,
        messageId,
        readBy: { [senderNickname]: timestamp },
        attachmentId,
        attachmentName: selectedFile.name,
        attachmentType,
        attachmentSize: selectedFile.size,
      });

      socket.emit("message", {
        roomId: activeRoomId,
        content: encryptedContent,
        encrypted: true,
        timestamp,
        messageId,
        attachmentId,
        attachmentName: selectedFile.name,
        attachmentType,
        attachmentSize: selectedFile.size,
      });

      addEncryptionLog(`Sent encrypted file: ${selectedFile.name}`, activeRoomId);
      setSelectedFile(null);
    } catch (error) {
      console.error("File upload error:", error);
      alert("Failed to upload file");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSend = () => {
    if (!activeRoomId || !nickname || !roomKey) return;

    // If there's a file selected, send it
    if (selectedFile) {
      handleSendFile();
      return;
    }

    const trimmed = text.trim();
    if (!trimmed) return;

    const socket = getSocket();
    const content = encryptMessage(trimmed, roomKey);
    const timestamp = Math.floor(Date.now() / 1000);
    const messageId = crypto.randomUUID();
    addEncryptionLog("Sent encrypted message", activeRoomId);

    // Add message to local store immediately (server skips sender)
    addMessage(activeRoomId, {
      roomId: activeRoomId,
      sender: nickname,
      content,
      encrypted: true,
      timestamp,
      messageId,
      readBy: { [nickname]: timestamp },
    });

    socket.emit("message", {
      roomId: activeRoomId,
      content,
      encrypted: true,
      timestamp,
      messageId,
    });

    setText("");
  };

  const handleTyping = () => {
    if (!activeRoomId) return;
    const socket = getSocket();

    socket.emit("typing", { roomId: activeRoomId, typing: true });

    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      socket.emit("typing", { roomId: activeRoomId, typing: false });
    }, 2000);
  };

  if (!activeRoomId) return null;

  return (
    <div className="border-t p-4">
      {/* Typing indicator */}
      {typers.length > 0 && (
        <div className="mb-2 flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="flex gap-0.5">
            <span className="h-1 w-1 rounded-full bg-muted-foreground animate-bounce [animation-delay:0ms]" />
            <span className="h-1 w-1 rounded-full bg-muted-foreground animate-bounce [animation-delay:150ms]" />
            <span className="h-1 w-1 rounded-full bg-muted-foreground animate-bounce [animation-delay:300ms]" />
          </span>
          <span>
            {typers.length === 1
              ? `${typers[0]} is typing...`
              : `${typers.join(", ")} are typing...`}
          </span>
        </div>
      )}

      {/* Selected file preview */}
      {selectedFile && (
        <div className="mb-2 flex items-center gap-2 rounded-lg bg-muted p-2">
          <Paperclip className="h-4 w-4 text-muted-foreground" />
          <span className="flex-1 truncate text-sm">{selectedFile.name}</span>
          <span className="text-xs text-muted-foreground">
            {(selectedFile.size / 1024).toFixed(1)} KB
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={handleRemoveFile}
            disabled={isUploading}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="flex items-end gap-2"
      >
        {/* File input (hidden) */}
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          className="hidden"
          accept="image/*,.pdf,.doc,.docx,.txt,.zip"
        />

        {/* Attach file button */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => fileInputRef.current?.click()}
          disabled={!roomKey || isUploading}
          title={roomKey ? "Attach file" : "Need encryption key to send files"}
        >
          <Paperclip className="h-4 w-4" />
        </Button>

        <div className="relative flex-1">
          <Textarea
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              handleTyping();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={
              isGeneratingKey
                ? "Generating quantum key..."
                : roomKey
                  ? "Type an encrypted message..."
                  : "Waiting for quantum key exchange..."
            }
            className="min-h-[40px] max-h-[120px] resize-none pr-10"
            rows={1}
            disabled={!canSend || isUploading}
          />
          <div className="absolute bottom-2 right-2 text-muted-foreground">
            {roomKey ? (
              <Lock className="h-4 w-4 text-green-500" />
            ) : (
              <Unlock className="h-4 w-4 text-yellow-500" />
            )}
          </div>
        </div>

        <Button
          type="submit"
          size="icon"
          disabled={!canSend || (!text.trim() && !selectedFile) || isUploading}
        >
          {isUploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </form>
    </div>
  );
}
