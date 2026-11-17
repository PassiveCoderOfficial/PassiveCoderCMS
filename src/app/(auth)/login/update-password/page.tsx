"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, CheckCircle, Eye, EyeOff } from "lucide-react";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPw, setShowPw] = useState(false);
  const [ready, setReady] = useState(false);

  // `?first=1` marks a forced change on first login after a site handover,
  // rather than arrival from a password-reset email. Same form, but the copy
  // has to differ — telling someone with a perfectly valid session that their
  // "reset link expired" is both wrong and alarming.
  const [firstLogin, setFirstLogin] = useState(false);

  useEffect(() => {
    setFirstLogin(new URLSearchParams(window.location.search).get("first") === "1");
    // Supabase embeds the session token in the URL hash after email link click
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
      else setError("Invalid or expired reset link. Request a new one.");
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (password !== confirm) { setError("Passwords do not match."); return; }
    setLoading(true);
    setError(null);
    const supabase = createClient();
    // Clearing the flag in the same call that sets the password keeps the two
    // atomic — the admin layout redirects here while it is set, so leaving it
    // behind after a successful change would trap the user in a loop.
    const { error } = await supabase.auth.updateUser({
      password,
      data: { must_change_password: false },
    });
    setLoading(false);
    if (error) { setError(error.message); return; }
    setDone(true);
    setTimeout(() => router.push("/dashboard"), 2000);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold">
            {firstLogin ? "Choose your password" : "Set new password"}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {firstLogin
              ? "Your site is ready. Pick a password only you know before you continue."
              : "Choose a strong password for your account."}
          </p>
        </div>
        <Card>
          <CardContent className="pt-6">
            {done ? (
              <div className="text-center space-y-3 py-4">
                <CheckCircle className="w-10 h-10 text-green-500 mx-auto" />
                <p className="font-semibold">Password updated!</p>
                <p className="text-sm text-muted-foreground">Redirecting to dashboard…</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">{error}</div>
                )}
                {!ready && !error && (
                  <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
                )}
                {ready && (
                  <>
                    <div className="space-y-1.5">
                      <Label>New Password</Label>
                      <div className="relative">
                        <Input
                          type={showPw ? "text" : "password"}
                          value={password}
                          onChange={e => setPassword(e.target.value)}
                          placeholder="Min. 8 characters"
                          className="pr-10"
                          autoFocus
                        />
                        <button type="button" className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground" onClick={() => setShowPw(v => !v)}>
                          {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Confirm Password</Label>
                      <Input
                        type="password"
                        value={confirm}
                        onChange={e => setConfirm(e.target.value)}
                        placeholder="Repeat password"
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Update Password
                    </Button>
                  </>
                )}
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
