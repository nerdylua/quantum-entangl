"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";

const STEPS = [
  "Creating quantum channel",
  "Generating entangled pairs",
  "Running QKD protocol",
  "Calculating QBER",
  "Distributing keys",
];

interface QKDLoaderProps {
  active: boolean;
}

export function QKDLoader({ active }: QKDLoaderProps) {
  const [step, setStep] = useState(0);
  const prevActive = useRef(active);

  // Reset step when transitioning from inactive to active
  if (active && !prevActive.current) {
    setStep(0);
  }
  prevActive.current = active;

  useEffect(() => {
    if (!active) return;

    const interval = setInterval(() => {
      setStep((s) => (s + 1) % STEPS.length);
    }, 1800);

    return () => clearInterval(interval);
  }, [active]);

  if (!active) return null;

  return (
    <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
      <div className="flex items-center gap-2 mb-3">
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
        <span className="text-sm font-medium text-primary">
          Generating Quantum Key
        </span>
      </div>
      <div className="space-y-1.5">
        {STEPS.map((label, i) => {
          const isActive = i === step;
          const isDone = i < step;
          return (
            <div key={label} className="flex items-center gap-2">
              <div
                className={`h-1.5 w-1.5 rounded-full shrink-0 transition-colors ${
                  isDone
                    ? "bg-primary"
                    : isActive
                      ? "bg-primary animate-pulse"
                      : "bg-muted-foreground/30"
                }`}
              />
              <AnimatePresence mode="wait">
                <motion.span
                  key={`${label}-${isActive}`}
                  initial={{ opacity: 0.4 }}
                  animate={{ opacity: isActive ? 1 : isDone ? 0.7 : 0.35 }}
                  className={`text-xs ${
                    isActive
                      ? "text-primary font-medium"
                      : isDone
                        ? "text-foreground/70"
                        : "text-muted-foreground"
                  }`}
                >
                  {label}
                </motion.span>
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
