"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, UserPlus, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function NewUserPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "", full_name: "" });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.email.trim() || !form.password) return;
    if (form.password.length < 8) { toast.error("Password min 8 chars"); return; }
    setLoading(true);
    const res = await fetch("/api/super-admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: form.email.trim(),
        password: form.password,
        full_name: form.full_name.trim() || undefined,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) { toast.error(data.error ?? "Failed to create user"); return; }
    toast.success("User created");
    router.push("/super-admin/users");
    router.refresh();
  }

  return (
    <div className="p-6 max-w-md mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <UserPlus className="w-6 h-6 text-purple-400" />
        <h1 className="text-2xl font-bold">New User</h1>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Full Name <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Input
                type="text"
                placeholder="Jane Smith"
                value={form.full_name}
                onChange={e => set("full_name", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Email <span className="text-red-400">*</span></Label>
              <Input
                type="email"
                placeholder="jane@example.com"
                value={form.email}
                onChange={e => set("email", e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Password <span className="text-red-400">*</span></Label>
              <div className="relative">
                <Input
                  type={showPass ? "text" : "password"}
                  placeholder="Min 8 characters"
                  value={form.password}
                  onChange={e => set("password", e.target.value)}
                  required
                  className="pr-10"
                />
                <button type="button" onClick={() => setShowPass(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={loading || !form.email.trim() || !form.password}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                Create User
              </Button>
              <Button variant="ghost" asChild>
                <Link href="/super-admin/users">Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
