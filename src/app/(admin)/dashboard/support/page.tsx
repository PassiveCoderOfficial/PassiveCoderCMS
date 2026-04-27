"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Plus, MessageSquare, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Ticket {
  id: string;
  subject: string;
  body: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
}

const STATUS_CONFIG: Record<string, { color: string; icon: React.ReactNode }> = {
  open:        { color: "text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400", icon: <MessageSquare className="w-3 h-3" /> },
  in_progress: { color: "text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400", icon: <Clock className="w-3 h-3" /> },
  resolved:    { color: "text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400", icon: <CheckCircle className="w-3 h-3" /> },
  closed:      { color: "text-gray-500 bg-gray-100 dark:bg-gray-800", icon: null },
};

const PRIORITY_CONFIG: Record<string, string> = {
  low:      "text-gray-500",
  normal:   "text-blue-500",
  high:     "text-amber-500",
  urgent:   "text-red-500",
};

export default function SupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [form, setForm] = useState({ subject: "", body: "", priority: "normal" });

  const supabase = createClient();

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: membership } = await supabase.from("tenant_members").select("tenant_id").eq("user_id", user.id).single();
      if (!membership) { setLoading(false); return; }
      setTenantId(membership.tenant_id);
      const { data } = await supabase
        .from("support_tickets")
        .select("*")
        .eq("tenant_id", membership.tenant_id)
        .order("created_at", { ascending: false });
      setTickets(data ?? []);
      setLoading(false);
    })();
  }, []);

  async function submitTicket() {
    if (!form.subject.trim() || !form.body.trim() || !tenantId) return;
    setSubmitting(true);
    const { error } = await supabase.from("support_tickets").insert({
      tenant_id: tenantId,
      subject: form.subject.trim(),
      body: form.body.trim(),
      priority: form.priority,
      status: "open",
    });
    if (error) { toast.error(error.message); setSubmitting(false); return; }
    toast.success("Ticket submitted. We'll respond within 1 business day.");
    setForm({ subject: "", body: "", priority: "normal" });
    setShowForm(false);
    // Refresh
    const { data } = await supabase.from("support_tickets").select("*").eq("tenant_id", tenantId).order("created_at", { ascending: false });
    setTickets(data ?? []);
    setSubmitting(false);
  }

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Support</h1>
          <p className="text-muted-foreground text-sm mt-1">Submit tickets and track responses from our team.</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Ticket
        </Button>
      </div>

      {showForm && (
        <div className="rounded-xl border bg-card p-5 space-y-4">
          <h2 className="font-semibold">Submit a Support Ticket</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label className="text-xs mb-1 block">Subject</Label>
              <Input placeholder="Brief description of your issue" value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs mb-1 block">Priority</Label>
              <select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>
          <div>
            <Label className="text-xs mb-1 block">Message</Label>
            <textarea rows={4} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring" placeholder="Describe your issue in detail..." value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} />
          </div>
          <div className="flex gap-2">
            <Button onClick={submitTicket} disabled={submitting || !form.subject.trim() || !form.body.trim()}>
              {submitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Submit Ticket
            </Button>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
      ) : tickets.length === 0 ? (
        <div className="rounded-xl border bg-muted/30 p-12 text-center space-y-3">
          <MessageSquare className="w-10 h-10 text-muted-foreground mx-auto" />
          <p className="font-semibold">No support tickets yet</p>
          <p className="text-sm text-muted-foreground">Submit a ticket and our team will respond within 1 business day.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map(ticket => {
            const cfg = STATUS_CONFIG[ticket.status] ?? STATUS_CONFIG.open;
            return (
              <div key={ticket.id} className="rounded-xl border bg-card p-4 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-semibold text-sm">{ticket.subject}</p>
                  <span className={cn("flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap", cfg.color)}>
                    {cfg.icon}{ticket.status.replace("_", " ")}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">{ticket.body}</p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className={cn("font-medium", PRIORITY_CONFIG[ticket.priority])}>
                    <AlertCircle className="w-3 h-3 inline mr-0.5" />{ticket.priority}
                  </span>
                  <span>Submitted {new Date(ticket.created_at).toLocaleDateString()}</span>
                  {ticket.updated_at !== ticket.created_at && (
                    <span>Updated {new Date(ticket.updated_at).toLocaleDateString()}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
