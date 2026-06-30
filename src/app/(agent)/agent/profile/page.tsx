"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface Agent {
  id: string;
  full_name: string;
  email: string;
  company: string | null;
  website: string | null;
  bio: string | null;
  referral_code: string;
  commission_rate: number;
  status: string;
}

export default function AgentProfilePage() {
  const [agent, setAgent] = useState<Agent | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("agents").select("*").eq("user_id", user.id).single();
      if (data) setAgent(data as Agent);
    })();
  }, []);

  const update = (k: keyof Agent, v: string) => setAgent(a => a ? { ...a, [k]: v } : a);

  async function save() {
    if (!agent) return;
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.from("agents").update({
      full_name: agent.full_name,
      company: agent.company,
      website: agent.website,
      bio: agent.bio,
    }).eq("id", agent.id);
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Profile updated");
  }

  if (!agent) return <div className="p-6 text-sm text-muted-foreground flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Loading...</div>;

  return (
    <div className="p-6 max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Staff Profile</h1>

      <div className="rounded-xl border bg-card p-5 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 space-y-1.5">
            <Label>Full Name</Label>
            <Input value={agent.full_name} onChange={e => update("full_name", e.target.value)} />
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label>Email</Label>
            <Input value={agent.email} disabled className="opacity-60" />
            <p className="text-xs text-muted-foreground">Email cannot be changed here.</p>
          </div>
          <div className="space-y-1.5">
            <Label>Company</Label>
            <Input value={agent.company ?? ""} onChange={e => update("company", e.target.value)} placeholder="Optional" />
          </div>
          <div className="space-y-1.5">
            <Label>Website</Label>
            <Input value={agent.website ?? ""} onChange={e => update("website", e.target.value)} placeholder="https://" />
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label>Bio</Label>
            <textarea
              rows={3}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              value={agent.bio ?? ""}
              onChange={e => update("bio", e.target.value)}
              placeholder="Tell us about yourself..."
            />
          </div>
        </div>
        <Button onClick={save} disabled={saving}>
          {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
          Save Profile
        </Button>
      </div>

      <div className="rounded-xl border bg-muted/30 p-5 space-y-3">
        <h2 className="font-semibold text-sm">Account Details</h2>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Referral Code</p>
            <p className="font-mono font-bold text-primary">{agent.referral_code}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Commission Rate</p>
            <p className="font-bold">{agent.commission_rate}%</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Account Status</p>
            <p className={`font-semibold capitalize ${agent.status === "active" ? "text-green-600" : "text-amber-600"}`}>{agent.status}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
