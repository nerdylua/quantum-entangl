"use client";

import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useAppStore } from "@/lib/store";
import { getSocket } from "@/lib/socket";
import { ShieldAlert, ShieldCheck, RefreshCw } from "lucide-react";

export function EavesdropperToggle() {
  const activeRoomId = useAppStore((s) => s.activeRoomId);
  const qkdState = useAppStore((s) => s.qkdState);
  const isKeyGenerating = useAppStore((s) => s.isKeyGenerating);

  const activeQKD = activeRoomId ? qkdState[activeRoomId] : undefined;
  const eveEnabled = activeQKD?.eveEnabled ?? false;
  const isCompromised = activeQKD?.isCompromised ?? false;

  const handleToggle = (checked: boolean) => {
    if (!activeRoomId) return;
    const socket = getSocket();
    socket.emit("toggle_eavesdropper", {
      roomId: activeRoomId,
      enabled: checked,
    });
    // Optimistic update — server skips sender via skip_sid
    useAppStore.getState().updateQKDState(activeRoomId, { eveEnabled: checked });
  };

  const handleRekey = () => {
    if (!activeRoomId) return;
    const socket = getSocket();
    socket.emit("request_rekey", { roomId: activeRoomId });
  };

  return (
    <div className="rounded-lg border p-3 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {eveEnabled ? (
            <ShieldAlert className="h-4 w-4 text-destructive" />
          ) : (
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
          )}
          <Label htmlFor="eve-toggle" className="text-sm font-medium cursor-pointer">
            Simulate Eavesdropper
          </Label>
        </div>
        <Switch
          id="eve-toggle"
          checked={eveEnabled}
          onCheckedChange={handleToggle}
          disabled={!activeRoomId || isCompromised}
        />
      </div>
      {eveEnabled && (
        <p className="text-xs text-muted-foreground">
          Injects a measurement attack into the quantum channel. The next key
          exchange will show elevated QBER.
        </p>
      )}
      {isCompromised && !eveEnabled && (
        <p className="text-xs text-destructive">
          Eavesdropper auto-disabled after detection.
        </p>
      )}
      <Button
        variant="outline"
        size="sm"
        className="w-full"
        onClick={handleRekey}
        disabled={!activeRoomId || isKeyGenerating}
      >
        <RefreshCw className={`h-3.5 w-3.5 mr-2 ${isKeyGenerating ? "animate-spin" : ""}`} />
        {isKeyGenerating ? "Generating Key..." : "Rekey Now"}
      </Button>
    </div>
  );
}
