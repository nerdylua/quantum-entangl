"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Lock,
  Shield,
  Users,
  Activity,
  ArrowRight,
  Zap,
  Eye,
  KeyRound,
} from "lucide-react";

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
                Parties measure qubits in compatible bases to extract a shared 128-bit secret key.
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
                Messages are encrypted with AES-128-CTR using the quantum-derived key.
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
