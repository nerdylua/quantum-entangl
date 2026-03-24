"use client";

import { useAppStore } from "@/lib/store";
import { getSocket } from "@/lib/socket";
import { Button } from "@/components/ui/button";
import { ShieldAlert, RefreshCw, AlertTriangle } from "lucide-react";

export function CompromisedBanner() {
  const activeRoomId = useAppStore((s) => s.activeRoomId);
  const qkdState = useAppStore((s) => s.qkdState);
  const isKeyGenerating = useAppStore((s) => s.isKeyGenerating);

  const activeQKD = activeRoomId ? qkdState[activeRoomId] : undefined;

  if (!activeQKD?.isCompromised || !activeQKD?.compromisedDetails) return null;

  const details = activeQKD.compromisedDetails;
  const qberPct = (details.qber * 100).toFixed(1);
  const thresholdPct = (details.threshold * 100).toFixed(0);

  const handleSecureChannel = () => {
    if (!activeRoomId) return;
    const socket = getSocket();
    socket.emit("toggle_eavesdropper", {
      roomId: activeRoomId,
      enabled: false,
    });
    socket.emit("request_rekey", { roomId: activeRoomId });
  };

  return (
    <div className="rounded-lg border-2 border-destructive/50 bg-destructive/10 p-3 space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <ShieldAlert className="h-5 w-5 text-destructive shrink-0" />
        <div>
          <p className="text-sm font-semibold text-destructive">
            Channel Compromised
          </p>
          <p className="text-xs text-destructive/80">
            Eavesdropper detected on quantum channel
          </p>
        </div>
      </div>

      {/* Explanation */}
      <div className="space-y-2 text-xs text-muted-foreground">
        <p>
          The Quantum Bit Error Rate (QBER) measured{" "}
          <span className="font-semibold text-destructive">{qberPct}%</span>,
          exceeding the {thresholdPct}% security threshold for{" "}
          <span className="font-medium">
            {details.protocol.replace("_", " ").toUpperCase()}
          </span>
          .
        </p>
        <p>
          A third party (Eve) intercepted and measured qubits during key
          distribution, introducing detectable errors. The key was rejected to
          prevent using a compromised encryption key.
        </p>
      </div>

      {/* Security status */}
      <div className="rounded-md bg-destructive/15 p-2 space-y-1.5">
        <div className="flex items-center gap-1.5">
          <AlertTriangle className="h-3 w-3 text-destructive" />
          <span className="text-[10px] font-semibold uppercase tracking-wider text-destructive">
            Security Status
          </span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Measured QBER</span>
          <span className="font-mono font-semibold text-destructive">
            {qberPct}%
          </span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Safe threshold</span>
          <span className="font-mono font-semibold text-emerald-500">
            &lt; {thresholdPct}%
          </span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Eavesdropper</span>
          <span className="font-mono font-semibold text-destructive">
            Auto-disabled
          </span>
        </div>
      </div>
    </div>
  );
}
