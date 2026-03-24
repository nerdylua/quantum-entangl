"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import {
  Lock,
  Shield,
  Users,
  Activity,
  ArrowRight,
  Zap,
  Eye,
  KeyRound,
  Check,
  Loader2,
} from "lucide-react";

const QKD_STEPS = [
  { label: "Initializing quantum channel", detail: "Establishing entangled qubit pairs between parties" },
  { label: "Generating entangled states", detail: "Creating Bell/GHZ states via quantum circuits" },
  { label: "Measuring in random bases", detail: "Alice and Bob independently choose measurement bases" },
  { label: "Sifting key bits", detail: "Discarding bits where bases didn't match" },
  { label: "Calculating QBER", detail: "Estimating error rate to detect eavesdroppers" },
  { label: "Distributing encrypted key", detail: "256-bit AES key delivered via RSA-OAEP" },
];

function QKDAnimation() {
  const [step, setStep] = useState(0);
  const [phase, setPhase] = useState<"running" | "done">("running");

  useEffect(() => {
    const interval = setInterval(() => {
      setStep((prev) => {
        if (prev < QKD_STEPS.length - 1) {
          return prev + 1;
        }
        // All done — pause, then restart
        setPhase("done");
        setTimeout(() => {
          setStep(0);
          setPhase("running");
        }, 3000);
        return prev;
      });
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="rounded-xl border bg-card/50 backdrop-blur p-6">
        <div className="flex items-center gap-2.5 mb-5">
          {phase === "done" ? (
            <div className="h-5 w-5 rounded-full bg-green-500/20 flex items-center justify-center">
              <Check className="h-3 w-3 text-green-500" />
            </div>
          ) : (
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          )}
          <span className="text-sm font-semibold">
            {phase === "done" ? "Key Exchange Complete" : "Quantum Key Exchange"}
          </span>
        </div>
        <div className="space-y-3">
          {QKD_STEPS.map((s, i) => {
            const isDone = i < step || phase === "done";
            const isActive = i === step && phase === "running";
            return (
              <div key={s.label} className="flex items-start gap-3">
                <div className="mt-0.5 shrink-0">
                  {isDone ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="h-4 w-4 rounded-full bg-primary/20 flex items-center justify-center"
                    >
                      <Check className="h-2.5 w-2.5 text-primary" />
                    </motion.div>
                  ) : isActive ? (
                    <div className="h-4 w-4 rounded-full border-2 border-primary flex items-center justify-center">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                    </div>
                  ) : (
                    <div className="h-4 w-4 rounded-full border border-muted-foreground/30" />
                  )}
                </div>
                <div className="min-w-0">
                  <p
                    className={`text-xs font-medium transition-colors duration-300 ${
                      isDone
                        ? "text-foreground/70"
                        : isActive
                          ? "text-primary"
                          : "text-muted-foreground/50"
                    }`}
                  >
                    {s.label}
                  </p>
                  <AnimatePresence>
                    {isActive && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="text-[11px] text-muted-foreground mt-0.5"
                      >
                        {s.detail}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            );
          })}
        </div>
        {phase === "done" && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 rounded-lg bg-green-500/10 border border-green-500/20 px-3 py-2 text-center"
          >
            <p className="text-xs font-medium text-green-600 dark:text-green-400">
              256-bit quantum key secured — QBER 0.0%
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default function LandingPage() {
  const router = useRouter();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Nav */}
      <header className="flex items-center justify-between px-6 py-4 border-b">
        <div className="flex items-center gap-2">
          <Lock className="h-5 w-5 text-primary" />
          <span className="font-bold text-lg">Entangl</span>
        </div>
        <Button variant="outline" size="sm" onClick={() => router.push("/login")}>
          Login
        </Button>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-16">
        <div className="max-w-3xl text-center space-y-6">
          <Badge variant="secondary" className="text-xs">
            Powered by Quantum Key Distribution
          </Badge>

          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight leading-tight">
            Quantum-Secured{" "}
            <span className="text-primary">Multi-Party Chat</span>
          </h1>

          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Generate cryptographic keys using real quantum protocols.
            Detect eavesdroppers in real-time. Communicate with
            unbreakable encryption.
          </p>

          <div className="flex items-center justify-center gap-3 pt-2">
            <Button size="lg" onClick={() => router.push("/login")} className="gap-2">
              Start Chatting
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* QKD Animation */}
        <div className="mt-16 w-full max-w-4xl">
          <QKDAnimation />
        </div>

        {/* How it works */}
        <div className="max-w-4xl w-full mt-20">
          <h2 className="text-center text-sm font-semibold uppercase text-muted-foreground tracking-wider mb-8">
            How Quantum Key Distribution Works
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-center">
            <div className="rounded-lg border bg-card p-5 space-y-3">
              <div className="mx-auto w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold text-sm">1. Quantum Channel</h3>
              <p className="text-xs text-muted-foreground">
                Entangled qubits are prepared using Bell State, BB84, E91, or GHZ protocols.
              </p>
            </div>
            <div className="rounded-lg border bg-card p-5 space-y-3">
              <div className="mx-auto w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <KeyRound className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold text-sm">2. Key Extraction</h3>
              <p className="text-xs text-muted-foreground">
                Parties measure qubits in compatible bases to extract a shared 256-bit secret key.
              </p>
            </div>
            <div className="rounded-lg border bg-card p-5 space-y-3">
              <div className="mx-auto w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Eye className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold text-sm">3. Eve Detection</h3>
              <p className="text-xs text-muted-foreground">
                Any eavesdropper disturbs the quantum state, causing QBER to spike above threshold.
              </p>
            </div>
            <div className="rounded-lg border bg-card p-5 space-y-3">
              <div className="mx-auto w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Lock className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold text-sm">4. Secure Chat</h3>
              <p className="text-xs text-muted-foreground">
                Messages are encrypted with AES-256-CTR using the quantum-derived key.
              </p>
            </div>
          </div>
        </div>

        {/* Feature cards */}
        <div className="max-w-4xl w-full mt-16">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-lg border bg-card p-6 space-y-2">
              <Shield className="h-6 w-6 text-primary" />
              <h3 className="font-semibold">4 QKD Protocols</h3>
              <p className="text-sm text-muted-foreground">
                Bell State (T22), BB84, E91 for 2-party, and GHZ for multi-party key agreement.
              </p>
            </div>
            <div className="rounded-lg border bg-card p-6 space-y-2">
              <Activity className="h-6 w-6 text-primary" />
              <h3 className="font-semibold">Live QBER Monitoring</h3>
              <p className="text-sm text-muted-foreground">
                Real-time quantum bit error rate gauge with eavesdropper simulation and auto-rekey.
              </p>
            </div>
            <div className="rounded-lg border bg-card p-6 space-y-2">
              <Users className="h-6 w-6 text-primary" />
              <h3 className="font-semibold">N-Party Groups</h3>
              <p className="text-sm text-muted-foreground">
                Group chats secured with GHZ state-based key agreement. Auto-selected for 3+ members.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t px-6 py-4 text-center text-xs text-muted-foreground">
        Built with Next.js, Qiskit, and real quantum circuit simulation.
      </footer>
    </div>
  );
}
