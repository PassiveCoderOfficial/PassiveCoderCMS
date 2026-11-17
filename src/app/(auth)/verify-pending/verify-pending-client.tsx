"use client";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Mail, LogOut } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

export function VerifyPendingClient() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function resend() {
    setLoading(true);
    const res = await fetch("/api/auth/resend-verification", { method: "POST" });
    setLoading(false);
    if (res.ok) {
      setSent(true);
      toast.success("Verification email sent — check your inbox.");
    } else {
      const d = await res.json().catch(() => ({}));
      toast.error(d.error ?? "Failed to send email");
    }
  }

  async function signOut() {
    await createClient().auth.signOut();
    window.location.href = "/login";
  }

  return (
    <Card>
      <CardContent className="pt-6 space-y-4 text-center">
        <Mail className="w-10 h-10 text-primary mx-auto" />
        <p className="text-sm text-muted-foreground">
          {sent ? "Email sent. Click the link inside to restore full access." : "Click below to resend your verification email."}
        </p>
        <Button className="w-full" onClick={resend} disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Resend Verification Email
        </Button>
        <button onClick={signOut} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mx-auto">
          <LogOut className="w-3.5 h-3.5" /> Sign out
        </button>
      </CardContent>
    </Card>
  );
}
