"use client";

import { Button } from "@/components/ui/button";
import { AttackDemoPlayer } from "./AttackDemoPlayer";
import { useAppStore } from "@/lib/store";
import { getSocket } from "@/lib/socket";
import { Eye, RefreshCw, ShieldAlert, ShieldCheck } from "lucide-react";

export function EavesdropperToggle() {
  const activeRoomId = useAppStore((s) => s.activeRoomId);
  const qkdState = useAppStore((s) => s.qkdState);
  const isKeyGenerating = useAppStore((s) => s.isKeyGenerating);
  const activeQKD = activeRoomId ? qkdState[activeRoomId] : undefined;
  const demo = activeQKD?.attackDemo;
  const demoHasRun = Boolean(demo?.startedAt);

  const handleStartDemo = () => {
    if (!activeRoomId) return;
    getSocket().emit("start_eavesdropper_demo", { roomId: activeRoomId });
  };

  const handleRekey = () => {
    if (!activeRoomId) return;
    getSocket().emit("request_rekey", { roomId: activeRoomId });
  };

  return (
    <>
      <div className="rounded-lg border p-3 space-y-3">
        <div className="flex items-center gap-2">
          {demoHasRun ? <ShieldAlert className="h-4 w-4 text-destructive" /> : <ShieldCheck className="h-4 w-4 text-emerald-500" />}
          <span className="text-sm font-medium">Eavesdropper Attack</span>
        </div>
        <p className="text-xs text-muted-foreground">
          A guided intercept-resend demonstration that explains why quantum-channel observation is detectable.
        </p>
        <Button variant="destructive" size="sm" className="w-full" onClick={handleStartDemo} disabled={!activeRoomId || isKeyGenerating || demoHasRun}>
          <Eye className="h-3.5 w-3.5 mr-2" />
          {demoHasRun ? "Rekey Required" : "Run Attack Demo"}
        </Button>
        <Button variant="outline" size="sm" className="w-full" onClick={handleRekey} disabled={!activeRoomId || isKeyGenerating}>
          <RefreshCw className={`h-3.5 w-3.5 mr-2 ${isKeyGenerating ? "animate-spin" : ""}`} />
          {isKeyGenerating ? "Generating Key..." : "Rekey Now"}
        </Button>
      </div>
      <AttackDemoPlayer demo={demo} compromisedDetails={activeQKD?.compromisedDetails} />
    </>
  );
}
