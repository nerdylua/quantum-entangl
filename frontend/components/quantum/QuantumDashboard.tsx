"use client";

import { useMemo } from "react";
import { useAppStore } from "@/lib/store";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Activity } from "lucide-react";
import { QBERGauge } from "./QBERGauge";
import { KeyTimeline } from "./KeyTimeline";
import { EavesdropperToggle } from "./EavesdropperToggle";
import { ProtocolCompare } from "./ProtocolCompare";

function protocolLabel(protocol: string): string {
  const labels: Record<string, string> = {
    bell_state: "Bell State (T22)",
    bb84: "BB84",
    e91: "E91",
    ghz: "GHZ Multi-Party",
  };
  return labels[protocol] || protocol;
}

export function QuantumDashboard() {
  const activeRoomId = useAppStore((s) => s.activeRoomId);
  const qkdState = useAppStore((s) => s.qkdState);
  const rooms = useAppStore((s) => s.rooms);

  const activeQKD = activeRoomId ? qkdState[activeRoomId] : undefined;
  const activeRoom = activeRoomId
    ? rooms.find((r) => r.roomId === activeRoomId)
    : undefined;

  // Collect all events across all rooms for protocol comparison
  const allEvents = useMemo(() => {
    return Object.values(qkdState).flatMap((s) => s.timeline);
  }, [qkdState]);

  return (
    <div className="flex h-full flex-col bg-muted/10 overflow-hidden">
      {/* Header */}
      <div className="flex h-14 items-center gap-2 border-b px-4 shrink-0">
        <Activity className="h-4 w-4 text-primary" />
        <h3 className="font-semibold text-sm">Quantum Dashboard</h3>
      </div>

      {/* Content - min-h-0 is crucial for flex scroll */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <ScrollArea className="h-full">
        <div className="p-3 space-y-3">
          {activeQKD ? (
            <>
              {/* Protocol info */}
              <div className="rounded-lg border p-3 space-y-2">
                <p className="text-xs font-semibold uppercase text-muted-foreground">
                  Protocol
                </p>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {protocolLabel(activeQKD.protocol)}
                  </Badge>
                  {activeRoom && (
                    <span className="text-xs text-muted-foreground">
                      {activeRoom.members.length} parties
                    </span>
                  )}
                </div>
              </div>

              {/* QBER Gauge */}
              <QBERGauge qber={activeQKD.qber} />

              {/* Eavesdropper Toggle + Rekey */}
              <EavesdropperToggle />

              {/* Protocol Comparison */}
              <ProtocolCompare events={allEvents} />

              {/* Key Timeline */}
              <KeyTimeline events={activeQKD.timeline} />
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Activity className="h-8 w-8 text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground">
                {activeRoomId
                  ? "Waiting for QKD key exchange..."
                  : "Select a room to view quantum metrics"}
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
      </div>
    </div>
  );
}
