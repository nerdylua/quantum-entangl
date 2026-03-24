"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { generateKeyPair } from "@/lib/encryption";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Lock, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const [nickname, setNickname] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const setAuth = useAppStore((s) => s.setAuth);
  const loginError = useAppStore((s) => s.loginError);
  const setLoginError = useAppStore((s) => s.setLoginError);
  const router = useRouter();

  // Clear error when user starts typing
  useEffect(() => {
    if (loginError && nickname) {
      setLoginError(null);
    }
  }, [nickname, loginError, setLoginError]);

  const handleLogin = async () => {
    const trimmed = nickname.trim();
    if (!trimmed) return;

    setIsGenerating(true);
    setLoginError(null);
    // RSA keygen is CPU-intensive; yield to the event loop
    await new Promise((r) => setTimeout(r, 50));

    try {
      const { publicKey, privateKey } = generateKeyPair();
      setAuth(trimmed, publicKey, privateKey);
      router.push("/chat");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 relative overflow-hidden grid-mask monolith-theme">
      {/* Background cyberpunk elements */}
      <div className="absolute inset-0 scanlines opacity-30 mix-blend-screen pointer-events-none z-0" />
      
      <Card className="w-full max-w-md relative z-10 border-[#474747] border bg-[#0e0e0e] shadow-[0_0_40px_rgba(255,0,0,0.05)] group transition-transform duration-500 hover:shadow-[0_0_50px_rgba(255,0,0,0.1)]">
        {/* Tech Corner Accents */}
        <div className="absolute -top-[1px] -left-[1px] w-3 h-3 border-t-2 border-l-2 border-[#FF0000] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-20" />
        <div className="absolute -bottom-[1px] -right-[1px] w-3 h-3 border-b-2 border-r-2 border-[#FF0000] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-20" />

        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center bg-[#FF0000]/10 border border-[#FF0000]/20 shadow-[0_0_20px_rgba(255,0,0,0.1)]">
            <Lock className="h-6 w-6 text-[#FF0000]" />
          </div>
          <CardTitle className="text-4xl font-headline font-bold uppercase tracking-tight text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">Entangl</CardTitle>
          <CardDescription className="text-[#919191] font-mono text-[11px] tracking-widest uppercase mt-4">
            Quantum-secured chat with live eavesdropper detection
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleLogin();
            }}
            className="space-y-4"
          >
            {loginError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{loginError}</AlertDescription>
              </Alert>
            )}
            <Input
              placeholder="Enter your nickname"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              disabled={isGenerating}
              autoFocus
            />
            <Button
              type="submit"
              className="w-full font-headline font-bold tracking-widest uppercase transition-all duration-300 hover:shadow-[0_0_20px_rgba(255,0,0,0.3)] bg-[#FF0000] text-black hover:bg-white border border-transparent hover:border-[#FF0000]"
              disabled={!nickname.trim() || isGenerating}
            >
              {isGenerating ? "GENERATING RSA KEYS..." : "START CHATTING ->"}
            </Button>
          </form>
          <div className="mt-8 pt-4 border-t border-[#474747] flex flex-col items-center">
             <p className="text-center text-[10px] font-mono text-[#474747] uppercase tracking-widest">
               Local RSA-2048 Keygen
             </p>
             <p className="mt-1 text-center text-xs text-[#919191] font-mono leading-relaxed max-w-[90%]">
               An unbreakable RSA-2048 key pair will be generated in your browser for absolute end-to-end encryption.
             </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
