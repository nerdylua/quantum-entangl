"use client";

import { useAppStore } from "@/lib/store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTheme } from "next-themes";
import { Moon, Sun, Users, Shield, Lock, Unlock, Menu, Activity } from "lucide-react";

const PROTOCOL_LABELS: Record<string, string> = {
  bell_state: "Bell State (T22)",
  bb84: "BB84",
  e91: "E91",
  ghz: "CASQKA Multi-Party",
};

interface ChatHeaderProps {
  onSidebarToggle?: () => void;
  onQuantumToggle?: () => void;
  quantumOpen?: boolean;
}

export function ChatHeader({ onSidebarToggle, onQuantumToggle, quantumOpen }: ChatHeaderProps) {
  const rooms = useAppStore((s) => s.rooms);
  const activeRoomId = useAppStore((s) => s.activeRoomId);
  const roomKeys = useAppStore((s) => s.roomKeys);
  const { theme, setTheme } = useTheme();

  const activeRoom = rooms.find((r) => r.roomId === activeRoomId);
  const hasKey = activeRoomId ? !!roomKeys[activeRoomId] : false;

  if (!activeRoom) {
    return (
      <div className="flex h-14 shrink-0 items-center justify-between border-b px-3 gap-2">
        {/* Mobile hamburger */}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden shrink-0"
          onClick={onSidebarToggle}
          aria-label="Open sidebar"
        >
          <Menu className="h-4 w-4" />
        </Button>

        <div className="flex items-center gap-1">
          {/* Mobile quantum toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={onQuantumToggle}
            aria-label="Toggle quantum dashboard"
          >
            <Activity className={`h-4 w-4 ${quantumOpen ? "text-primary" : ""}`} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    );
  }

  const protocolLabel = PROTOCOL_LABELS[activeRoom.protocol] || activeRoom.protocol;

  return (
    <div className="flex h-14 shrink-0 items-center justify-between border-b px-3 gap-2">
      <div className="flex items-center gap-2 min-w-0">
        {/* Mobile hamburger */}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden shrink-0"
          onClick={onSidebarToggle}
          aria-label="Open sidebar"
        >
          <Menu className="h-4 w-4" />
        </Button>

        <h2 className="font-semibold truncate">{activeRoom.roomName}</h2>
        <Badge variant="outline" className="gap-1 shrink-0 hidden sm:flex">
          <Shield className="h-3 w-3" />
          {protocolLabel}
        </Badge>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground shrink-0 cursor-default">
                <Users className="h-3 w-3" />
                {activeRoom.members.length}
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p className="font-medium mb-1">Members</p>
              {activeRoom.members.map((m) => (
                <p key={m} className="text-xs">{m}</p>
              ))}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        {hasKey ? (
          <Lock className="h-3.5 w-3.5 text-green-500 shrink-0" />
        ) : (
          <Unlock className="h-3.5 w-3.5 text-yellow-500 shrink-0" />
        )}
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {/* Mobile quantum toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={onQuantumToggle}
          aria-label="Toggle quantum dashboard"
        >
          <Activity className={`h-4 w-4 ${quantumOpen ? "text-primary" : ""}`} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          {theme === "dark" ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
