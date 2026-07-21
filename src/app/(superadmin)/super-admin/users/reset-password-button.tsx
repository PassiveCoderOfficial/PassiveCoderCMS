"use client";

import { useState } from "react";
import { KeyRound, Loader2, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";

export default function ResetPasswordButton({ userId, email }: { userId: string; email: string }) {
  const [loading, setLoading] = useState(false);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function reset() {
    if (!confirm(`Reset password for ${email}? Their current password will stop working immediately.`)) return;
    setLoading(true);
    const res = await fetch(`/api/super-admin/users/${userId}/reset-password`, { method: "POST" });
    const d = await res.json().catch(() => ({}));
    if (res.ok) {
      setTempPassword(d.tempPassword);
    } else {
      toast.error(d.error ?? "Failed to reset password");
    }
    setLoading(false);
  }

  function copy() {
    if (!tempPassword) return;
    navigator.clipboard.writeText(tempPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <>
      <Button size="sm" variant="outline" onClick={reset} disabled={loading}>
        {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <KeyRound className="w-3 h-3" />}
        Reset Password
      </Button>

      <Dialog open={!!tempPassword} onOpenChange={(open) => !open && setTempPassword(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Password reset</DialogTitle>
            <DialogDescription>
              New temporary password for {email}. Shown once — copy it now and share it securely.
              The user should change it after logging in.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2.5 font-mono text-sm">
            <span className="flex-1 select-all">{tempPassword}</span>
            <Button size="sm" variant="ghost" onClick={copy}>
              {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
