"use client";

import type { QKDEvent } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckCircle2, XCircle, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface KeyTimelineProps {
  events: QKDEvent[];
}

function protocolLabel(protocol: string): string {
  const labels: Record<string, string> = {
    bell_state: "Bell State",
    bb84: "BB84",
    e91: "E91",
    ghz: "GHZ",
  };
  return labels[protocol] || protocol;
}

export function KeyTimeline({ events }: KeyTimelineProps) {
  if (events.length === 0) {
    return (
      <div className="rounded-lg border p-3 space-y-2">
        <p className="text-xs font-semibold uppercase text-muted-foreground">
          Key Timeline
        </p>
        <p className="text-xs text-muted-foreground text-center py-2">
          No key events yet
        </p>
      </div>
    );
  }

  const sorted = [...events].reverse();

  return (
    <div className="rounded-lg border p-3 space-y-2">
      <p className="text-xs font-semibold uppercase text-muted-foreground">
        Key Timeline
      </p>
      <ScrollArea className="max-h-[200px]">
        <div className="space-y-2 pr-2">
          {sorted.map((event, i) => (
            <div
              key={`${event.timestamp}-${i}`}
              className={`flex items-start gap-2 rounded-md border p-2 text-xs ${
                event.status === "rejected"
                  ? "border-destructive/30 bg-destructive/5"
                  : "border-emerald-500/30 bg-emerald-500/5"
              }`}
            >
              {event.status === "accepted" ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" />
              ) : (
                <XCircle className="h-3.5 w-3.5 text-destructive mt-0.5 shrink-0" />
              )}
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Badge
                    variant={event.status === "accepted" ? "secondary" : "destructive"}
                    className="text-[10px] px-1.5 py-0"
                  >
                    {event.status === "accepted" ? "Accepted" : "Rejected"}
                  </Badge>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                    {protocolLabel(event.protocol)}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>QBER: {(event.qber * 100).toFixed(1)}%</span>
                  <span className="flex items-center gap-0.5">
                    <Clock className="h-2.5 w-2.5" />
                    {formatDistanceToNow(event.timestamp, { addSuffix: true })}
                  </span>
                </div>
                {event.reason && (
                  <p className="text-destructive/80 truncate">{event.reason}</p>
                )}
                {event.timeTaken !== undefined && (
                  <p className="text-muted-foreground">
                    Generated in {event.timeTaken.toFixed(2)}s
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
