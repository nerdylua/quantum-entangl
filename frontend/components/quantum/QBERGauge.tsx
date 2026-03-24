"use client";

import { useMemo } from "react";

interface QBERGaugeProps {
  qber: number; // 0.0 to 1.0
}

function getQBERStatus(qber: number) {
  const pct = qber * 100;
  if (pct <= 5) return { label: "Secure", color: "#10b981" };
  if (pct <= 11) return { label: "Warning", color: "#f59e0b" };
  return { label: "Compromised", color: "#ef4444" };
}

export function QBERGauge({ qber }: QBERGaugeProps) {
  const pct = qber * 100;
  const status = useMemo(() => getQBERStatus(qber), [qber]);

  // Arc geometry
  const r = 50;
  const strokeWidth = 10;
  const cx = 70;
  const cy = 62;
  const gaugeMax = 25; // 25% QBER = full gauge (meaningful range)

  // Semicircle path (left → right, curving upward)
  const pathD = `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`;
  const halfCirc = Math.PI * r;

  const fraction = Math.min(pct / gaugeMax, 1);
  const dashOffset = halfCirc * (1 - fraction);

  // Threshold tick positions on the arc
  function tickPos(thresholdPct: number) {
    const f = Math.min(thresholdPct / gaugeMax, 1);
    const angle = Math.PI * (1 - f); // π = left, 0 = right
    const inner = r - strokeWidth / 2 - 1;
    const outer = r + strokeWidth / 2 + 1;
    const labelR = outer + 9;
    return {
      ix: cx + inner * Math.cos(angle),
      iy: cy - inner * Math.sin(angle),
      ox: cx + outer * Math.cos(angle),
      oy: cy - outer * Math.sin(angle),
      lx: cx + labelR * Math.cos(angle),
      ly: cy - labelR * Math.sin(angle),
    };
  }

  const ticks = [
    { pct: 5, label: "5%" },
    { pct: 11, label: "11%" },
  ];

  return (
    <div className="rounded-lg border p-3">
      <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">
        QBER Level
      </p>
      <div className="relative flex flex-col items-center">
        <svg
          width="140"
          height="72"
          viewBox="0 0 140 72"
          className="overflow-visible"
        >
          <defs>
            <filter id="qber-glow">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Background arc */}
          <path
            d={pathD}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            className="text-muted-foreground/15"
          />

          {/* Value arc with glow */}
          {fraction > 0.005 && (
            <path
              d={pathD}
              fill="none"
              stroke={status.color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={halfCirc}
              strokeDashoffset={dashOffset}
              filter="url(#qber-glow)"
              style={{
                transition:
                  "stroke-dashoffset 0.6s ease, stroke 0.3s ease",
              }}
            />
          )}

          {/* Threshold tick marks */}
          {ticks.map((t) => {
            const pos = tickPos(t.pct);
            return (
              <g key={t.pct}>
                <line
                  x1={pos.ix}
                  y1={pos.iy}
                  x2={pos.ox}
                  y2={pos.oy}
                  stroke="currentColor"
                  strokeWidth={1.5}
                  className="text-muted-foreground/40"
                />
                <text
                  x={pos.lx}
                  y={pos.ly + 3}
                  textAnchor="middle"
                  className="fill-muted-foreground/50"
                  fontSize={8}
                >
                  {t.label}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Center value overlay */}
        <div className="flex flex-col items-center -mt-7">
          <span
            className="text-2xl font-bold tabular-nums"
            style={{ color: status.color }}
          >
            {pct.toFixed(1)}%
          </span>
          <span
            className="text-[11px] font-semibold tracking-wider uppercase"
            style={{ color: status.color }}
          >
            {status.label}
          </span>
        </div>
      </div>
    </div>
  );
}
