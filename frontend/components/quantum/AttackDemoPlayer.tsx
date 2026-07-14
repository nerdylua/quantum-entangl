"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, ChevronLeft, ChevronRight, CirclePause, CirclePlay, Orbit, RotateCcw, ShieldAlert, Waves } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { AttackDemoState, CompromisedDetails } from "@/lib/types";

interface AttackDemoPlayerProps {
  demo?: AttackDemoState;
  compromisedDetails?: CompromisedDetails;
}

const phases = [
  {
    title: "Alice sends a quantum key sample",
    summary: "To establish a shared secret key, Alice sends randomly encoded quantum states. Bob measures each one using a randomly chosen setting.",
    detail: "The protocol encodes random key bits in randomly selected measurement bases. Bob will later reveal only which measurements used compatible bases.",
    icon: Waves,
    accent: "text-primary",
  },
  {
    title: "Eve intercepts — and must measure",
    summary: "Eve cannot inspect an unknown quantum state invisibly. She must choose a measurement setting, which can collapse the state before she forwards a replacement to Bob.",
    detail: "Because Eve does not know Alice's preparation basis, some measurements use an incompatible basis. Those measurements collapse the original state and can change what Bob receives.",
    icon: Orbit,
    accent: "text-destructive",
  },
  {
    title: "Alice and Bob detect the disturbance",
    summary: "Alice and Bob publicly compare measurement settings, discard incompatible results, then reveal a small random sample of the remaining bits. Extra disagreements expose Eve.",
    detail: "This is the Quantum Bit Error Rate (QBER). The public comparison reveals errors, not the final key; any key from this attacked exchange is rejected.",
    icon: ShieldAlert,
    accent: "text-destructive",
  },
] as const;

export function AttackDemoPlayer({ demo, compromisedDetails }: AttackDemoPlayerProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(true);
  const seenSession = useRef(0);

  useEffect(() => {
    if (!demo?.startedAt || demo.startedAt === seenSession.current) return;
    seenSession.current = demo.startedAt;
    setStep(0);
    setPlaying(true);
    setOpen(true);
  }, [demo?.startedAt]);

  useEffect(() => {
    if (!open || !playing || step === phases.length - 1) return;
    const timer = window.setTimeout(() => setStep((current) => current + 1), 7000);
    return () => window.clearTimeout(timer);
  }, [open, playing, step]);

  if (!demo) return null;

  const phase = phases[step];
  const Icon = phase.icon;
  const qber = compromisedDetails ? `${(compromisedDetails.qber * 100).toFixed(1)}%` : "being measured";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-xl gap-4 overflow-hidden p-0 sm:max-w-xl" aria-describedby="attack-demo-description">
        <div className="border-b bg-destructive/5 px-6 pt-6 pb-4">
          <DialogHeader className="gap-1 pr-8">
            <DialogTitle>Eavesdropper attack demo</DialogTitle>
            <DialogDescription id="attack-demo-description" className="sr-only">Interactive eavesdropper attack demo</DialogDescription>
          </DialogHeader>
        </div>

        <div className="px-6 pb-2">
          <div className="mb-5 flex gap-2" aria-label={`Phase ${step + 1} of 3`}>
            {phases.map((item, index) => (
              <div key={item.title} className={`h-1 flex-1 rounded-full ${index <= step ? "bg-destructive" : "bg-muted"}`} />
            ))}
          </div>

          <div className="relative min-h-64 overflow-hidden rounded-xl border bg-muted/30 p-5">
            <div className="absolute inset-x-10 top-1/2 h-px bg-border" />
            <AnimatePresence mode="wait">
              <motion.div
                key={phase.title}
                initial={{ opacity: 0, x: 28 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -28 }}
                transition={{ duration: 0.35 }}
                className="relative z-10"
              >
                <div className="mb-6 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <span>Alice</span><span className={step === 1 ? "text-destructive" : ""}>Eve</span><span>Bob</span>
                </div>
                <div className="mb-6 flex items-center justify-between">
                  {[0, 1, 2].map((node) => (
                    <motion.div
                      key={node}
                      animate={step === 1 && node === 1 ? { scale: [1, 1.18, 1], rotate: [0, 6, -6, 0] } : { scale: 1, rotate: 0 }}
                      transition={{ duration: 1.2, repeat: step === 1 && node === 1 ? Infinity : 0 }}
                      className={`flex size-12 items-center justify-center rounded-full border-2 bg-background text-sm font-bold ${node === 1 && step === 1 ? "border-destructive text-destructive" : "border-primary text-primary"}`}
                    >
                      {node === 0 ? "A" : node === 1 ? "E" : "B"}
                    </motion.div>
                  ))}
                </div>
                <ChannelAnimation step={step} />
                <div className="flex justify-center"><Icon className={`mb-3 size-9 ${phase.accent}`} /></div>
                <h3 className="text-center text-lg font-semibold">{phase.title}</h3>
                <p className="mx-auto mt-2 max-w-md text-center text-sm leading-6 text-muted-foreground">{phase.summary}</p>
              </motion.div>
            </AnimatePresence>
          </div>

          {step === 2 && <div className="mt-3 rounded-lg border border-destructive/25 bg-destructive/5 px-3 py-2 text-xs text-muted-foreground">
            Live result: QBER is <span className="font-semibold text-destructive">{qber}</span>; the key is rejected when it exceeds the safe threshold.
          </div>
          }
        </div>

        <div className="flex items-center justify-between border-t px-6 py-4">
          <Button variant="ghost" size="sm" onClick={() => setStep((current) => Math.max(0, current - 1))} disabled={step === 0}>
            <ChevronLeft className="mr-1 size-4" /> Back
          </Button>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon-sm" onClick={() => setPlaying((value) => !value)} aria-label={playing ? "Pause playback" : "Play playback"}>
              {playing ? <CirclePause className="size-4" /> : <CirclePlay className="size-4" />}
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={() => { setStep(0); setPlaying(true); }} aria-label="Replay demo">
              <RotateCcw className="size-4" />
            </Button>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setStep((current) => Math.min(phases.length - 1, current + 1))} disabled={step === phases.length - 1}>
            Next <ChevronRight className="ml-1 size-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ChannelAnimation({ step }: { step: number }) {
  if (step === 0) {
    return (
      <div className="relative mb-5 h-8 overflow-hidden" aria-label="Quantum state travelling from Alice to Bob">
        <motion.div className="absolute left-[12%] top-1/2 -translate-y-1/2 text-primary" animate={{ x: [0, 250] }} transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}>
          <div className="flex items-center gap-1 rounded-full border border-primary/40 bg-background px-2 py-1 text-xs font-semibold shadow-sm">|ψ⟩ <ArrowRight className="size-3" /></div>
        </motion.div>
      </div>
    );
  }

  if (step === 1) {
    return (
      <div className="relative mb-5 h-8 overflow-hidden" aria-label="Eve measuring the quantum state">
        <motion.div className="absolute left-[12%] top-1/2 -translate-y-1/2 text-primary" animate={{ x: [0, 108], opacity: [1, 1, 0] }} transition={{ duration: 2.1, repeat: Infinity, ease: "easeIn" }}>|ψ⟩</motion.div>
        <motion.div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-destructive bg-destructive/15 px-2 py-1 text-[10px] font-semibold text-destructive" animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1.1, repeat: Infinity }}>measure</motion.div>
        <motion.div className="absolute left-[56%] top-1/2 -translate-y-1/2 text-destructive" animate={{ x: [0, 100], opacity: [0, 1, 1] }} transition={{ duration: 2.1, repeat: Infinity, ease: "easeOut" }}>|ψ′⟩ <ArrowRight className="inline size-3" /></motion.div>
      </div>
    );
  }

  return (
    <div className="relative mb-5 flex h-8 items-center justify-center gap-2 overflow-hidden text-xs font-semibold text-destructive" aria-label="Disturbance detected at Bob">
      <motion.span animate={{ opacity: [0.3, 1, 0.3], y: [2, -2, 2] }} transition={{ duration: 1, repeat: Infinity }}>✕</motion.span>
      <span>sample mismatch</span>
      <motion.span animate={{ opacity: [0.3, 1, 0.3], y: [2, -2, 2] }} transition={{ duration: 1, repeat: Infinity, delay: 0.25 }}>✕</motion.span>
    </div>
  );
}
