"use client";

import { useMemo } from "react";
import {
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
  ResponsiveContainer,
} from "recharts";

interface QBERGaugeProps {
  qber: number; // 0.0 to 1.0
}

function getQBERStatus(qber: number) {
  const pct = qber * 100;
  if (pct <= 5) return { label: "Secure", color: "hsl(142, 76%, 46%)", textColor: "text-emerald-500" };
  if (pct <= 11) return { label: "Warning", color: "hsl(45, 93%, 47%)", textColor: "text-yellow-500" };
  return { label: "Compromised", color: "hsl(0, 84%, 60%)", textColor: "text-destructive" };
}

export function QBERGauge({ qber }: QBERGaugeProps) {
  const pct = qber * 100;
  const status = useMemo(() => getQBERStatus(qber), [qber]);

  const data = [{ name: "QBER", value: Math.min(pct, 100), fill: status.color }];

  return (
    <div className="rounded-lg border p-3 space-y-1">
      <p className="text-xs font-semibold uppercase text-muted-foreground">
        QBER Level
      </p>
      <div className="relative h-[120px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            cx="50%"
            cy="100%"
            innerRadius="60%"
            outerRadius="100%"
            startAngle={180}
            endAngle={0}
            barSize={12}
            data={data}
          >
            <PolarAngleAxis
              type="number"
              domain={[0, 50]}
              angleAxisId={0}
              tick={false}
            />
            <RadialBar
              background={{ fill: "hsl(var(--muted))" }}
              dataKey="value"
              angleAxisId={0}
              cornerRadius={6}
            />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-1">
          <span className={`text-2xl font-bold ${status.textColor}`}>
            {pct.toFixed(1)}%
          </span>
          <span className={`text-xs font-medium ${status.textColor}`}>
            {status.label}
          </span>
        </div>
      </div>
    </div>
  );
}
