"use client";

import { useEffect, useRef, useState } from "react";
import { useAppStore } from "@/lib/store";
import { decryptMessage } from "@/lib/encryption";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { format } from "date-fns";
import { useSocket } from "@/hooks/use-socket";
import { ChevronUp, Check, CheckCheck, Download, FileIcon, ImageIcon, Loader2 } from "lucide-react";

const MESSAGES_PER_PAGE = 50;

export function MessageList() {
  const socket = useSocket();
  const activeRoomId = useAppStore((s) => s.activeRoomId);
  const messages = useAppStore((s) => s.messages);
  const messagePagination = useAppStore((s) => s.messagePagination);
  const setMessagePaginationStart = useAppStore((s) => s.setMessagePaginationStart);
  const roomKeys = useAppStore((s) => s.roomKeys);
  const nickname = useAppStore((s) => s.nickname);
  const fileTransfers = useAppStore((s) => s.fileTransfers);

  const scrollRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const prevRoomRef = useRef<string | null>(null);
  const prevMessageCountRef = useRef(0);
  const markedReadRef = useRef<Set<string>>(new Set());

  const roomMessages = activeRoomId ? messages[activeRoomId] || [] : [];
  const roomKey = activeRoomId ? roomKeys[activeRoomId] : undefined;
  const rooms = useAppStore((s) => s.rooms);
  const activeRoom = rooms.find((r) => r.roomId === activeRoomId);

  // Calculate pagination - show last MESSAGES_PER_PAGE messages by default
  // Use stored pagination, or default to showing latest messages
  const storedStart = activeRoomId ? messagePagination[activeRoomId] : undefined;
  const paginationStart = storedStart !== undefined
    ? storedStart
    : Math.max(0, roomMessages.length - MESSAGES_PER_PAGE);

  // Only render a window of messages (paginationStart to paginationStart + MESSAGES_PER_PAGE)
  const paginationEnd = paginationStart + MESSAGES_PER_PAGE;
  const visibleMessages = roomMessages.slice(paginationStart, paginationEnd);
  const hasEarlierMessages = paginationStart > 0;
  const hasLaterMessages = paginationEnd < roomMessages.length;

  // Load more earlier messages
  const handleLoadEarlier = () => {
    if (!activeRoomId) return;
    const newStart = Math.max(0, paginationStart - MESSAGES_PER_PAGE);
    setMessagePaginationStart(activeRoomId, newStart);
  };

  // Load more later messages
  const handleLoadLater = () => {
    if (!activeRoomId) return;
    const newStart = Math.min(paginationStart + MESSAGES_PER_PAGE, Math.max(0, roomMessages.length - MESSAGES_PER_PAGE));
    setMessagePaginationStart(activeRoomId, newStart);
  };

  // Auto-mark messages as read when visible
  useEffect(() => {
    if (!activeRoomId || !nickname || !socket) return;

    visibleMessages.forEach((msg) => {
      if (
        msg.sender !== nickname &&
        msg.messageId &&
        !msg.readBy?.[nickname] &&
        !markedReadRef.current.has(msg.messageId)
      ) {
        markedReadRef.current.add(msg.messageId);
        socket.emit("mark_message_read", {
          roomId: activeRoomId,
          messageId: msg.messageId,
          timestamp: Date.now() / 1000,
        });
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeRoomId, nickname, socket, roomMessages.length]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (!autoScroll || !scrollRef.current) return;
    // Use scrollTop directly on the viewport to avoid scrollIntoView
    // propagating scroll to parent containers
    const viewport = scrollRef.current.querySelector(
      "[data-radix-scroll-area-viewport]"
    ) as HTMLElement;
    if (viewport) {
      viewport.scrollTop = viewport.scrollHeight;
    }
  }, [visibleMessages.length, autoScroll]);

  // Detect when user scrolls up manually
  const handleScroll = (e: React.WheelEvent | React.TouchEvent) => {
    if (!scrollRef.current) return;

    // Check if scrolled near bottom
    const element = scrollRef.current.querySelector("[data-radix-scroll-area-viewport]") as HTMLElement;
    if (element) {
      const isNearBottom =
        element.scrollHeight - element.scrollTop - element.clientHeight < 100;
      setAutoScroll(isNearBottom);
    }
  };

  // Reset pagination when switching rooms - ONLY fires when activeRoomId changes
  useEffect(() => {
    if (activeRoomId && activeRoomId !== prevRoomRef.current) {
      prevRoomRef.current = activeRoomId;
      // Read current message count directly from store (fresh value)
      const currentMessages = useAppStore.getState().messages[activeRoomId] || [];
      const startIndex = Math.max(0, currentMessages.length - MESSAGES_PER_PAGE);
      setMessagePaginationStart(activeRoomId, startIndex);
      setAutoScroll(true);
      prevMessageCountRef.current = currentMessages.length;
    }
  }, [activeRoomId, setMessagePaginationStart]);

  // Advance pagination when new messages arrive (only if auto-scrolling)
  useEffect(() => {
    const prevCount = prevMessageCountRef.current;
    if (roomMessages.length > prevCount) {
      if (autoScroll && activeRoomId) {
        const newStart = Math.max(0, roomMessages.length - MESSAGES_PER_PAGE);
        setMessagePaginationStart(activeRoomId, newStart);
      }
    }
    prevMessageCountRef.current = roomMessages.length;
  }, [roomMessages.length, autoScroll, activeRoomId, setMessagePaginationStart]);

  if (!activeRoomId) {
    return (
      <div className="flex flex-1 min-h-0 items-center justify-center text-muted-foreground">
        Select a room to view messages
      </div>
    );
  }

  return (
    <ScrollArea
      ref={scrollRef}
      className="flex-1 min-h-0 overflow-hidden"
      onWheel={handleScroll}
      onTouchMove={handleScroll}
    >
      <TooltipProvider>
      <div className="space-y-2 p-4">
        {/* Load earlier button */}
        {hasEarlierMessages && (
          <div className="flex justify-center py-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleLoadEarlier}
              className="gap-2"
            >
              <ChevronUp className="h-4 w-4" />
              Load earlier messages
            </Button>
          </div>
        )}

        {/* Messages */}
        <div className="space-y-4">
          {visibleMessages.map((msg, i) => {
            const isOwn = msg.sender === nickname;
            let displayContent = msg.content;

            if (msg.encrypted && roomKey) {
              try {
                displayContent = decryptMessage(msg.content, roomKey);
              } catch {
                displayContent = "[Unable to decrypt]";
              }
            } else if (msg.encrypted) {
              displayContent = "[Encrypted - awaiting key]";
            }

            // Check if this message has an attachment
            const attachment = msg.attachmentId ? fileTransfers[msg.attachmentId] : null;
            const attachmentType = msg.attachmentType || attachment?.attachmentType;
            const attachmentName = msg.attachmentName || attachment?.attachmentName || "file";
            const attachmentSize = msg.attachmentSize || attachment?.attachmentSize || 0;
            const isImage = attachmentType === "image";

            // Get decrypted file data if available
            let fileUrl: string | undefined;
            let decryptError = false;
            if (attachment?.encryptedData && attachment.progress === 100) {
              if (roomKey) {
                try {
                  fileUrl = decryptMessage(attachment.encryptedData, roomKey);
                } catch (e) {
                  console.error("[FileTransfer] Failed to decrypt file:", e, {
                    encryptedDataLen: attachment.encryptedData.length,
                    roomKeyPrefix: roomKey.substring(0, 8),
                  });
                  decryptError = true;
                }
              } else {
                console.error("[FileTransfer] No room key for decryption");
                decryptError = true;
              }
            }

            // Download handler for non-image files
            const handleDownload = () => {
              if (!fileUrl) return;
              const link = document.createElement("a");
              link.href = fileUrl;
              link.download = attachmentName;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            };

            // Read receipt status for own messages
            const readByEntries = msg.readBy ? Object.keys(msg.readBy) : [];
            const readByOthers = readByEntries.filter((n) => n !== nickname);
            const totalOtherMembers = (activeRoom?.members.length || 1) - 1;
            // All other members have read it
            const allRead = totalOtherMembers > 0 && readByOthers.length >= totalOtherMembers;

            return (
              <div
                key={`${msg.messageId || msg.timestamp}-${i}`}
                className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[70%] rounded-lg px-3 py-2 ${
                    isOwn
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  {!isOwn && (
                    <p className="mb-1 text-xs font-semibold">{msg.sender}</p>
                  )}

                  <p className="text-sm whitespace-pre-wrap">{displayContent}</p>

                  {/* File attachment preview */}
                  {msg.attachmentId && (
                    <div className="mt-2 rounded bg-black/10 dark:bg-white/10 p-2">
                      {/* Fully loaded - show preview or download */}
                      {attachment && attachment.progress === 100 && fileUrl ? (
                        isImage ? (
                          <div className="space-y-2">
                            <img
                              src={fileUrl}
                              alt={attachmentName}
                              className="max-h-48 max-w-full rounded cursor-pointer"
                              onClick={() => window.open(fileUrl, "_blank")}
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs gap-1"
                              onClick={handleDownload}
                            >
                              <Download className="h-3 w-3" />
                              Download
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <FileIcon className="h-8 w-8 text-muted-foreground" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{attachmentName}</p>
                              <p className="text-xs text-muted-foreground">
                                {(attachmentSize / 1024).toFixed(1)} KB
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 gap-1"
                              onClick={handleDownload}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        )
                      ) : /* Decrypt error */
                      attachment && attachment.progress === 100 && decryptError ? (
                        <div className="flex items-center gap-2 text-destructive">
                          <FileIcon className="h-5 w-5" />
                          <span className="text-xs">Failed to decrypt file</span>
                        </div>
                      ) : /* Still loading */
                      attachment && attachment.progress !== undefined && attachment.progress < 100 ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                          <div className="flex-1">
                            <p className="text-xs">{attachmentName}</p>
                            <div className="h-1 bg-muted rounded-full mt-1 overflow-hidden">
                              <div
                                className="h-full bg-primary transition-all"
                                style={{ width: `${attachment.progress}%` }}
                              />
                            </div>
                          </div>
                          <span className="text-xs text-muted-foreground">{attachment.progress}%</span>
                        </div>
                      ) : /* Waiting for transfer to start */
                      (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          {isImage ? <ImageIcon className="h-5 w-5" /> : <FileIcon className="h-5 w-5" />}
                          <span className="text-xs">{attachmentName} - awaiting transfer</span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="mt-1 flex items-center justify-end gap-1">
                    <p
                      className={`text-[10px] ${
                        isOwn
                          ? "text-primary-foreground/70"
                          : "text-muted-foreground"
                      }`}
                    >
                      {format(new Date(msg.timestamp * 1000), "HH:mm")}
                    </p>

                    {/* Read receipts - WhatsApp-style double tick */}
                    {isOwn && msg.messageId && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="inline-flex items-center">
                            {allRead ? (
                              <CheckCheck className="h-3.5 w-3.5 text-blue-400" />
                            ) : readByOthers.length > 0 ? (
                              <CheckCheck className="h-3.5 w-3.5 text-primary-foreground/70" />
                            ) : (
                              <Check className="h-3.5 w-3.5 text-primary-foreground/70" />
                            )}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <div className="space-y-1">
                            {readByOthers.length > 0 ? (
                              readByOthers.map((name) => (
                                <div key={name} className="text-xs">
                                  {name} · {format(new Date((msg.readBy![name]) * 1000), "HH:mm")}
                                </div>
                              ))
                            ) : (
                              <div className="text-xs text-muted-foreground">Delivered</div>
                            )}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Load later button */}
        {hasLaterMessages && (
          <div className="flex justify-center py-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleLoadLater}
              className="gap-2"
            >
              <ChevronUp className="h-4 w-4 rotate-180" />
              Load newer messages
            </Button>
          </div>
        )}

        {/* Message count indicator */}
        {roomMessages.length > MESSAGES_PER_PAGE && (
          <div className="flex justify-center py-2">
            <p className="text-xs text-muted-foreground">
              Showing {Math.min(visibleMessages.length, MESSAGES_PER_PAGE)} of {roomMessages.length} messages
            </p>
          </div>
        )}
      </div>
      </TooltipProvider>
    </ScrollArea>
  );
}
