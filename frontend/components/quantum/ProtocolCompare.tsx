"use client";

import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { QKDEvent } from "@/lib/types";

interface ProtocolCompareProps {
  events: QKDEvent[];
}

const PROTOCOL_COLORS: Record<string, string> = {
  bell_state: "hsl(259, 67%, 59%)",
  bb84: "hsl(199, 89%, 48%)",
  e91: "hsl(142, 76%, 46%)",
  ghz: "hsl(25, 95%, 53%)",
};

const PROTOCOL_LABELS: Record<string, string> = {
  bell_state: "Bell State",
  bb84: "BB84",
  e91: "E91",
  ghz: "GHZ",
};

export function ProtocolCompare({ events }: ProtocolCompareProps) {
  const data = useMemo(() => {
    const accepted = events.filter((e) => e.status === "accepted");
    if (accepted.length === 0) return [];

    const grouped: Record<
      string,
      { qberSum: number; timeSum: number; count: number }
    > = {};

    for (const ev of accepted) {
      if (!grouped[ev.protocol]) {
        grouped[ev.protocol] = { qberSum: 0, timeSum: 0, count: 0 };
      }
      grouped[ev.protocol].qberSum += ev.qber;
      grouped[ev.protocol].timeSum += ev.timeTaken ?? 0;
      grouped[ev.protocol].count += 1;
    }

    return Object.entries(grouped).map(([protocol, stats]) => ({
      protocol,
      label: PROTOCOL_LABELS[protocol] || protocol,
      avgQBER: Number(((stats.qberSum / stats.count) * 100).toFixed(2)),
      avgTime: Number((stats.timeSum / stats.count).toFixed(2)),
      keys: stats.count,
      color: PROTOCOL_COLORS[protocol] || "hsl(var(--primary))",
    }));
  }, [events]);

  if (data.length === 0) {
    return (
      <div className="rounded-lg border p-3 space-y-2">
        <p className="text-xs font-semibold uppercase text-muted-foreground">
          Protocol Comparison
        </p>
        <p className="text-xs text-muted-foreground text-center py-2">
          Generate keys with multiple protocols to compare
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border p-3 space-y-2">
      <p className="text-xs font-semibold uppercase text-muted-foreground">
        Protocol Comparison
      </p>

      {/* QBER Chart */}
      <div>
        <p className="text-[10px] text-muted-foreground mb-1">
          Avg QBER (%)
        </p>
        <div className="h-[80px] overflow-hidden">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ left: 0, right: 8, top: 0, bottom: 0 }}>
              <XAxis type="number" domain={[0, "auto"]} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis
                type="category"
                dataKey="label"
                width={60}
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              />
              <Tooltip
                contentStyle={{
                  fontSize: 11,
                  background: "hsl(var(--popover))",
                  borderColor: "hsl(var(--border))",
                  color: "hsl(var(--popover-foreground))",
                  borderRadius: 8,
                }}
                formatter={(value: number) => [`${value}%`, "Avg QBER"]}
              />
              <Bar dataKey="avgQBER" radius={[0, 4, 4, 0]} barSize={14}>
                {data.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Time Chart */}
      <div>
        <p className="text-[10px] text-muted-foreground mb-1">
          Avg Gen Time (s)
        </p>
        <div className="h-[80px] overflow-hidden">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ left: 0, right: 8, top: 0, bottom: 0 }}>
              <XAxis type="number" domain={[0, "auto"]} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis
                type="category"
                dataKey="label"
                width={60}
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              />
              <Tooltip
                contentStyle={{
                  fontSize: 11,
                  background: "hsl(var(--popover))",
                  borderColor: "hsl(var(--border))",
                  color: "hsl(var(--popover-foreground))",
                  borderRadius: 8,
                }}
                formatter={(value: number) => [`${value}s`, "Avg Time"]}
              />
              <Bar dataKey="avgTime" radius={[0, 4, 4, 0]} barSize={14}>
                {data.map((entry, i) => (
                  <Cell key={i} fill={entry.color} fillOpacity={0.7} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
