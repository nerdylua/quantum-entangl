"use client";

import { useEffect, useState } from "react";
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [quantumOpen, setQuantumOpen] = useState(false);

  // Initialize socket connection
  useSocket();

  useEffect(() => {
    if (!nickname) {
      router.push("/login");
    }
  }, [nickname, router]);

  // Close sidebar when quantum panel opens on mobile, and vice versa
  const handleSidebarToggle = () => {
    setSidebarOpen((prev) => {
      if (!prev) setQuantumOpen(false);
      return !prev;
    });
  };

  const handleQuantumToggle = () => {
    setQuantumOpen((prev) => {
      if (!prev) setSidebarOpen(false);
      return !prev;
    });
  };

  if (!nickname) return null;

  return (
    <div className="flex h-screen w-full overflow-hidden relative">
      {/* Mobile overlay backdrop */}
      {(sidebarOpen || quantumOpen) && (
        <div
          className="fixed inset-0 z-20 bg-black/40 lg:hidden"
          onClick={() => {
            setSidebarOpen(false);
            setQuantumOpen(false);
          }}
        />
      )}

      {/* Sidebar — fixed-width on desktop, slide-in drawer on mobile */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-30 w-72 shrink-0 border-r bg-muted/30 flex flex-col h-full
          transition-transform duration-300 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          lg:relative lg:translate-x-0 lg:w-64 lg:z-auto
        `}
      >
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </aside>

      {/* Chat area */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        <ChatHeader
          onSidebarToggle={handleSidebarToggle}
          onQuantumToggle={handleQuantumToggle}
          quantumOpen={quantumOpen}
        />
        <MessageList />
        <MessageInput />
      </div>

      {/* Quantum Dashboard — fixed-width on desktop, slide-in drawer on mobile */}
      <div
        className={`
          fixed inset-y-0 right-0 z-30 w-80 shrink-0 border-l h-full overflow-hidden bg-background
          transition-transform duration-300 ease-in-out
          ${quantumOpen ? "translate-x-0" : "translate-x-full"}
          lg:relative lg:translate-x-0 lg:z-auto
        `}
      >
        <QuantumDashboard onClose={() => setQuantumOpen(false)} />
      </div>
    </div>
  );
}
