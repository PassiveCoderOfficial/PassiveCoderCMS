"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, CheckCircle, Users, DollarSign, Globe, Zap, Eye, EyeOff } from "lucide-react";
import Link from "next/link";

const PERKS = [
  { icon: DollarSign, title: "Commission Earnings", desc: "Earn recurring or one-time commission on every site you bring." },
  { icon: Users, title: "Manage Client Sites", desc: "Access and manage all sites referred or assigned to you." },
  { icon: Globe, title: "Referral Link", desc: "Unique code — track every signup from your audience." },
  { icon: Zap, title: "Instant Access", desc: "Auto-approved. No waiting, no gatekeeping." },
];

export default function BecomeAgentPage() {
  const [form, setForm] = useState({ full_name: "", email: "", password: "", company: "", website: "", bio: "" });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [referralCode, setReferralCode] = useState("");

  const update = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.full_name.trim() || !form.email.trim() || !form.password) return;
    if (form.password.length < 8) { toast.error("Password must be at least 8 characters"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/become-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: form.full_name.trim(),
          email: form.email.trim(),
          password: form.password,
          company: form.company.trim() || undefined,
          website: form.website.trim() || undefined,
          bio: form.bio.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      setReferralCode(data.referral_code ?? "");
      setDone(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="max-w-md w-full text-center space-y-4">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold">You&apos;re in!</h1>
          <p className="text-muted-foreground">Check your email to confirm your account, then sign in to access your Agent dashboard.</p>
          {referralCode && (
            <div className="bg-muted rounded-lg px-4 py-3 text-sm">
              Your referral code: <span className="font-mono font-bold text-primary">{referralCode}</span>
            </div>
          )}
          <Link href="/login"><Button className="w-full">Sign In to Agent Dashboard</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-6 py-16 space-y-12">
        {/* Header */}
        <div className="text-center space-y-3">
          <span className="inline-block bg-primary/10 text-primary text-xs font-semibold px-3 py-1 rounded-full">Free to Join</span>
          <h1 className="text-4xl font-bold">Become a Passive Coder Agent</h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Refer clients, earn commissions, and manage their sites — all from one dashboard. Auto-approved, no fees, no gatekeeping.
          </p>
        </div>

        {/* Perks */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {PERKS.map(perk => (
            <div key={perk.title} className="rounded-xl border bg-card p-4 text-center space-y-2">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mx-auto">
                <perk.icon className="w-5 h-5 text-primary" />
              </div>
              <p className="font-semibold text-sm">{perk.title}</p>
              <p className="text-xs text-muted-foreground">{perk.desc}</p>
            </div>
          ))}
        </div>

        {/* Form */}
        <div className="max-w-lg mx-auto rounded-2xl border bg-card p-8 space-y-6">
          <h2 className="font-bold text-xl">Apply Now — It&apos;s Free</h2>
          <form onSubmit={submit} className="space-y-4">
            <div className="col-span-2 space-y-1.5">
              <Label>Full Name <span className="text-destructive">*</span></Label>
              <Input placeholder="Jane Smith" value={form.full_name} onChange={e => update("full_name", e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label>Email Address <span className="text-destructive">*</span></Label>
              <Input type="email" placeholder="jane@example.com" value={form.email} onChange={e => update("email", e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label>Password <span className="text-destructive">*</span></Label>
              <div className="relative">
                <Input
                  type={showPass ? "text" : "password"}
                  placeholder="Min 8 characters"
                  value={form.password}
                  onChange={e => update("password", e.target.value)}
                  required
                  className="pr-10"
                />
                <button type="button" onClick={() => setShowPass(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Company <span className="text-muted-foreground text-xs">(optional)</span></Label>
                <Input placeholder="Acme Agency" value={form.company} onChange={e => update("company", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Website <span className="text-muted-foreground text-xs">(optional)</span></Label>
                <Input placeholder="https://yoursite.com" value={form.website} onChange={e => update("website", e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Tell us about yourself <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <textarea
                rows={3}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Who are your clients? How do you plan to use the platform?"
                value={form.bio}
                onChange={e => update("bio", e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading || !form.full_name.trim() || !form.email.trim() || !form.password}>
              {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Join as Agent — Free
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Already have an account?{" "}
              <Link href="/login" className="text-primary hover:underline">Sign in</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
