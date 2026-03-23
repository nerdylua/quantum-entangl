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
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Entangl</CardTitle>
          <CardDescription>
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
              className="w-full"
              disabled={!nickname.trim() || isGenerating}
            >
              {isGenerating ? "Generating RSA keys..." : "Start Chatting"}
            </Button>
          </form>
          <p className="mt-4 text-center text-xs text-muted-foreground">
            An RSA-2048 key pair will be generated in your browser for
            end-to-end encryption.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
