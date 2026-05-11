"use client";

import { useState, useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { getSocket } from "@/lib/socket";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Circle, MessageSquare, Shield, Users, FileKey, MoreHorizontal, Pencil, Trash2, Check, X, ChevronLeft } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { getProtocolLabel } from "@/lib/protocol";

const PROTOCOLS = [
  { value: "bell_state", label: "Bell State (T22)", description: "4-qubit entangled pairs" },
  { value: "bb84", label: "BB84", description: "Prepare-and-measure" },
  { value: "e91", label: "E91", description: "Entanglement-based" },
] as const;

interface SidebarProps {
  onClose?: () => void;
}

export function Sidebar({ onClose }: SidebarProps) {
  const rooms = useAppStore((s) => s.rooms);
  const activeRoomId = useAppStore((s) => s.activeRoomId);
  const setActiveRoom = useAppStore((s) => s.setActiveRoom);
  const onlineUsers = useAppStore((s) => s.onlineUsers);
  const nickname = useAppStore((s) => s.nickname);
  const encryptionLogs = useAppStore((s) => s.encryptionLogs);

  const removeRoom = useAppStore((s) => s.removeRoom);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [roomName, setRoomName] = useState("");
  const [memberInput, setMemberInput] = useState("");
  const [protocol, setProtocol] = useState("bell_state");
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const reversedLogs = [...encryptionLogs].reverse();

  // Close menu on any click outside
  useEffect(() => {
    if (!menuOpenId) return;
    const handler = () => setMenuOpenId(null);
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [menuOpenId]);

  const handleDeleteRoom = (roomId: string) => {
    const socket = getSocket();
    socket.emit("delete_room", { roomId });
    removeRoom(roomId);
    setMenuOpenId(null);
  };

  const handleStartEdit = (roomId: string, currentName: string) => {
    setEditingRoomId(roomId);
    setEditName(currentName);
    setMenuOpenId(null);
  };

  const handleConfirmEdit = () => {
    if (editingRoomId && editName.trim()) {
      const socket = getSocket();
      socket.emit("edit_room", { roomId: editingRoomId, roomName: editName.trim() });
    }
    setEditingRoomId(null);
    setEditName("");
  };

  const handleCancelEdit = () => {
    setEditingRoomId(null);
    setEditName("");
  };

  const handleCreateRoom = () => {
    const trimmedName = roomName.trim() || "New Room";
    const members = memberInput
      .split(",")
      .map((m) => m.trim())
      .filter(Boolean);

    const socket = getSocket();
    socket.emit("create_room", {
      roomName: trimmedName,
      members,
      protocol,
    });

    setRoomName("");
    setMemberInput("");
    setProtocol("bell_state");
    setDialogOpen(false);
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex h-14 items-center justify-between px-4 border-b shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="lg:hidden p-1 rounded hover:bg-accent transition-colors"
            aria-label="Close sidebar"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <h2 className="text-lg font-semibold">Chats</h2>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              New Room
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Chat Room</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleCreateRoom();
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label>Room Name</Label>
                <Input
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  placeholder="e.g. Quantum Lab"
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label>
                  Members
                  <span className="text-muted-foreground font-normal ml-1">
                    (comma-separated nicknames)
                  </span>
                </Label>
                <Input
                  value={memberInput}
                  onChange={(e) => setMemberInput(e.target.value)}
                  placeholder="e.g. Alice, Bob"
                />
                <p className="text-xs text-muted-foreground">
                  You will be added automatically. Use 3+ members for CASQKA protocol.
                </p>
              </div>
              <div className="space-y-2">
                <Label>QKD Protocol</Label>
                <Select value={protocol} onValueChange={setProtocol}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PROTOCOLS.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        <div className="flex items-center gap-2">
                          <Shield className="h-3 w-3" />
                          <span>{p.label}</span>
                          <span className="text-muted-foreground text-xs">
                            &mdash; {p.description}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full">
                Create Room
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Room List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {rooms.map((room) => {
            const isActive = activeRoomId === room.roomId;
            const isEditing = editingRoomId === room.roomId;
            const isMenuOpen = menuOpenId === room.roomId;
            return (
              <div key={room.roomId} className="relative group">
                {isEditing ? (
                  <div className={`w-full rounded-lg px-3 py-2.5 ${
                    isActive ? "bg-accent text-accent-foreground" : "bg-accent/50"
                  }`}>
                    <form
                      className="flex items-center gap-2"
                      onSubmit={(e) => { e.preventDefault(); handleConfirmEdit(); }}
                    >
                      <MessageSquare className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="h-6 text-sm px-1.5 flex-1"
                        autoFocus
                        onKeyDown={(e) => { if (e.key === "Escape") handleCancelEdit(); }}
                      />
                      <button type="submit" className="shrink-0 text-green-500 hover:text-green-400">
                        <Check className="h-3.5 w-3.5" />
                      </button>
                      <button type="button" onClick={handleCancelEdit} className="shrink-0 text-muted-foreground hover:text-foreground">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </form>
                  </div>
                ) : (
                  <>
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => { setActiveRoom(room.roomId); onClose?.(); }}
                      onKeyDown={(e) => { if (e.key === "Enter") { setActiveRoom(room.roomId); onClose?.(); } }}
                      className={`w-full rounded-lg px-3 py-2.5 text-left transition-colors cursor-pointer ${
                        isActive
                          ? "bg-accent text-accent-foreground"
                          : "hover:bg-accent/50"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <span className="font-medium truncate">{room.roomName}</span>
                      </div>
                      <div className="mt-1.5 flex items-center gap-1.5 ml-6">
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                          {getProtocolLabel(room.protocol)}
                        </Badge>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {room.members.length}
                        </span>
                      </div>
                    </div>
                    {/* Hover action menu */}
                    <div className="absolute right-2 top-2">
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={(e) => { e.stopPropagation(); setMenuOpenId(isMenuOpen ? null : room.roomId); }}
                        onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); setMenuOpenId(isMenuOpen ? null : room.roomId); } }}
                        className={`rounded p-0.5 transition-opacity cursor-pointer ${
                          isMenuOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                        } hover:bg-accent`}
                      >
                        <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                      </div>
                      {isMenuOpen && (
                        <div
                          className="absolute right-0 top-6 z-50 min-w-[140px] rounded-md border bg-popover p-1 shadow-md"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div
                            role="button"
                            tabIndex={0}
                            onClick={() => handleStartEdit(room.roomId, room.roomName)}
                            onKeyDown={(e) => { if (e.key === "Enter") handleStartEdit(room.roomId, room.roomName); }}
                            className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent cursor-pointer"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            Rename
                          </div>
                          <div
                            role="button"
                            tabIndex={0}
                            onClick={() => handleDeleteRoom(room.roomId)}
                            onKeyDown={(e) => { if (e.key === "Enter") handleDeleteRoom(room.roomId); }}
                            className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-red-500 hover:bg-red-500/10 cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
          {rooms.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <div className="rounded-full bg-muted p-3 mb-3">
                <MessageSquare className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">No rooms yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Create a room to start a quantum-secured conversation
              </p>
            </div>
          )}
        </div>
      </ScrollArea>

      <Separator />

      {/* Encryption Logs */}
      <div className="shrink-0">
        <div className="flex items-center gap-1.5 px-4 py-2">
          <FileKey className="h-3 w-3 text-muted-foreground" />
          <span className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
            Encryption Logs
          </span>
        </div>
        <ScrollArea className="h-[100px]">
          <div className="px-4 pb-2 space-y-1">
            {reversedLogs.length > 0 ? (
              reversedLogs.map((log, i) => (
                <div key={`${log.timestamp}-${i}`} className="text-[10px] text-muted-foreground">
                  <span className="opacity-60">
                    {formatDistanceToNow(log.timestamp, { addSuffix: true })}
                  </span>{" "}
                  {log.action}
                </div>
              ))
            ) : (
              <p className="text-[10px] text-muted-foreground py-1">No logs yet</p>
            )}
          </div>
        </ScrollArea>
      </div>

      <Separator />

      {/* Online Users */}
      <div className="p-4 shrink-0">
        <h3 className="mb-2 text-xs font-semibold uppercase text-muted-foreground tracking-wider">
          Online ({onlineUsers.length})
        </h3>
        <div className="space-y-1.5">
          {onlineUsers.map((user) => (
            <div key={user} className="flex items-center gap-2 text-sm">
              <Circle className="h-2 w-2 shrink-0 fill-green-500 text-green-500" />
              <span className={`truncate ${user === nickname ? "font-semibold" : ""}`}>
                {user}
                {user === nickname && " (you)"}
              </span>
            </div>
          ))}
          {onlineUsers.length === 0 && (
            <p className="text-xs text-muted-foreground">No users online</p>
          )}
        </div>
      </div>
    </div>
  );
}
