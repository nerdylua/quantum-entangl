"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { useSocket } from "@/hooks/use-socket";
import { Sidebar } from "@/components/chat/Sidebar";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { MessageList } from "@/components/chat/MessageList";
import { MessageInput } from "@/components/chat/MessageInput";
import { QuantumDashboard } from "@/components/quantum/QuantumDashboard";

export default function ChatPage() {
  const router = useRouter();
  const nickname = useAppStore((s) => s.nickname);

  // Initialize socket connection
  useSocket();

  useEffect(() => {
    if (!nickname) {
      router.push("/login");
    }
  }, [nickname, router]);

  if (!nickname) return null;

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 border-r bg-muted/30 flex flex-col h-full">
        <Sidebar />
      </aside>

      {/* Chat area */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        <ChatHeader />
        <MessageList />
        <MessageInput />
      </div>

      {/* Quantum Dashboard - fixed width right panel */}
      <div className="w-80 shrink-0 border-l h-full">
        <QuantumDashboard />
      </div>
    </div>
  );
}
