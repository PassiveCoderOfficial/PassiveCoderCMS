"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, CheckCircle, Users, DollarSign, Globe, Zap } from "lucide-react";
import Link from "next/link";

const PERKS = [
  { icon: DollarSign, title: "20% Commission", desc: "Earn on every site you bring to the platform." },
  { icon: Users, title: "Manage Client Sites", desc: "Log into any site you referred from your dashboard." },
  { icon: Globe, title: "Referral Link", desc: "Unique code — track every signup from your audience." },
  { icon: Zap, title: "Instant Access", desc: "Auto-approved. No waiting, no gatekeeping." },
];

export default function BecomeAgentPage() {
  const [form, setForm] = useState({ full_name: "", email: "", company: "", website: "", bio: "" });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const update = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.full_name.trim() || !form.email.trim()) return;
    setLoading(true);
    try {
      const supabase = createClient();
      // Check if already signed in
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        // Sign up new account
        const { data: signupData, error: signupError } = await supabase.auth.signUp({
          email: form.email.trim(),
          password: Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2) + "Aa1!",
          options: { emailRedirectTo: `${window.location.origin}/agent` },
        });
        if (signupError) throw signupError;
        if (!signupData.user) throw new Error("Signup failed");
        // Insert agent row
        const { error: agentError } = await supabase.from("agents").insert({
          user_id: signupData.user.id,
          full_name: form.full_name.trim(),
          email: form.email.trim(),
          company: form.company.trim() || null,
          website: form.website.trim() || null,
          bio: form.bio.trim() || null,
          status: "active",
        });
        if (agentError) throw agentError;
      } else {
        // Already logged in — just create agent row
        const { error: agentError } = await supabase.from("agents").upsert({
          user_id: user.id,
          full_name: form.full_name.trim(),
          email: form.email.trim(),
          company: form.company.trim() || null,
          website: form.website.trim() || null,
          bio: form.bio.trim() || null,
          status: "active",
        }, { onConflict: "user_id" });
        if (agentError) throw agentError;
      }

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
          <p className="text-muted-foreground">Check your email to confirm your account, then log in to access your Agent dashboard.</p>
          <Link href="/agent"><Button className="w-full">Go to Agent Dashboard</Button></Link>
          <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground block">Sign in instead</Link>
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
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1.5">
                <Label>Full Name <span className="text-destructive">*</span></Label>
                <Input placeholder="Jane Smith" value={form.full_name} onChange={e => update("full_name", e.target.value)} required />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Email Address <span className="text-destructive">*</span></Label>
                <Input type="email" placeholder="jane@example.com" value={form.email} onChange={e => update("email", e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label>Company <span className="text-muted-foreground text-xs">(optional)</span></Label>
                <Input placeholder="Acme Agency" value={form.company} onChange={e => update("company", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Website <span className="text-muted-foreground text-xs">(optional)</span></Label>
                <Input placeholder="https://yoursite.com" value={form.website} onChange={e => update("website", e.target.value)} />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Tell us about yourself <span className="text-muted-foreground text-xs">(optional)</span></Label>
                <textarea
                  rows={3}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Who are your clients? How do you plan to use the platform?"
                  value={form.bio}
                  onChange={e => update("bio", e.target.value)}
                />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading || !form.full_name.trim() || !form.email.trim()}>
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
