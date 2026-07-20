"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { TicketIcon, ArrowLeft, Loader2, Save, CheckCircle } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Ticket {
  id: string;
  subject: string;
  body: string;
  department: string;
  priority: string;
  status: string;
  guest_name: string | null;
  guest_email: string | null;
  user_id: string | null;
  tenant_id: string | null;
  attachments: string[];
  source: string | null;
  created_at: string;
  updated_at: string;
}

interface PendingSub { id: string; plan_id: string; payment_provider: string; amount_cents: number; currency: string; }

interface Dept { id: string; name: string; slug: string; }

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [depts, setDepts] = useState<Dept[]>([]);
  const [pendingSub, setPendingSub] = useState<PendingSub | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [approving, setApproving] = useState(false);

  const [editDept, setEditDept] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [editPriority, setEditPriority] = useState("");

  useEffect(() => {
    fetch(`/api/super-admin/tickets?id=${id}`)
      .then(r => r.json())
      .then(({ ticket: t, depts: d }) => {
        if (t) {
          setTicket(t as Ticket);
          setEditDept(t.department);
          setEditStatus(t.status);
          setEditPriority(t.priority);
          // Check for pending subscription linked to this ticket
          fetch(`/api/super-admin/subscriptions?ticketId=${t.id}`)
            .then(r => r.json())
            .then(({ subscription }) => {
              if (subscription?.status === "pending") setPendingSub(subscription as PendingSub);
            })
            .catch(() => {});
        }
        setDepts(d ?? []);
        setLoading(false);
      });
  }, [id]);

  async function save() {
    if (!ticket) return;
    setSaving(true);
    const res = await fetch("/api/super-admin/tickets", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, department: editDept, status: editStatus, priority: editPriority }),
    });
    setSaving(false);
    if (!res.ok) { const d = await res.json().catch(() => ({})); toast.error(d.error ?? "Failed"); return; }
    setTicket(prev => prev ? { ...prev, department: editDept, status: editStatus, priority: editPriority } : prev);
    toast.success("Ticket updated");
  }

  async function approve() {
    if (!pendingSub) return;
    setApproving(true);
    const res = await fetch("/api/super-admin/subscriptions/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subscriptionId: pendingSub.id }),
    });
    setApproving(false);
    if (!res.ok) { const d = await res.json().catch(() => ({})); toast.error(d.error ?? "Approval failed"); return; }
    setPendingSub(null);
    setEditStatus("resolved");
    setTicket(prev => prev ? { ...prev, status: "resolved" } : prev);
    toast.success("Subscription approved — site is now active");
  }

  const deptLabel = (slug: string) => depts.find(d => d.slug === slug)?.name ?? slug;

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;
  if (!ticket) return <div className="p-6 text-muted-foreground">Ticket not found.</div>;

  const changed = editDept !== ticket.department || editStatus !== ticket.status || editPriority !== ticket.priority;

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/super-admin/tickets" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <TicketIcon className="w-5 h-5 text-amber-400" />
        <h1 className="text-xl font-bold truncate">{ticket.subject}</h1>
      </div>

      {/* Ticket info */}
      <Card>
        <CardContent className="pt-6 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-xs text-muted-foreground font-mono">{ticket.id.slice(0, 8)}…</div>
            <div className="text-xs text-muted-foreground">{new Date(ticket.created_at).toLocaleString()}</div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">From</p>
            <p className="text-sm">{ticket.guest_name ?? "Site User"}</p>
            {ticket.guest_email && <p className="text-xs text-muted-foreground">{ticket.guest_email}</p>}
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Message</p>
            <p className="text-sm whitespace-pre-wrap">{ticket.body}</p>
          </div>
          {ticket.attachments?.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-2">Attachments</p>
              <div className="flex flex-wrap gap-2">
                {ticket.attachments.map((url, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                    <img src={url} alt="" className="w-16 h-16 object-cover rounded-lg border hover:border-indigo-500 transition-colors" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Billing approval panel */}
      {pendingSub && (
        <Card className="border-blue-500/30 bg-blue-900/20">
          <CardHeader>
            <CardTitle className="text-sm text-blue-300 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" /> Pending Payment Approval
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-blue-200/70">
              Plan: <strong>{pendingSub.plan_id}</strong> · Provider: <strong>{pendingSub.payment_provider}</strong> ·
              Amount: <strong>{(pendingSub.amount_cents / 100).toFixed(0)} {pendingSub.currency}</strong>
            </p>
            <Button onClick={approve} disabled={approving} className="bg-green-600 hover:bg-green-500 text-white">
              {approving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              Approve & Activate Site
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Management panel */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Ticket Management</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Department</Label>
              <Select value={editDept} onValueChange={setEditDept}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {depts.map(d => <SelectItem key={d.id} value={d.slug}>{d.name}</SelectItem>)}
                  {!depts.find(d => d.slug === editDept) && <SelectItem value={editDept}>{editDept}</SelectItem>}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Status</Label>
              <Select value={editStatus} onValueChange={setEditStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["open", "in_progress", "waiting", "resolved", "closed"].map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Priority</Label>
              <Select value={editPriority} onValueChange={setEditPriority}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["low", "normal", "high", "urgent"].map(p => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {ticket.department !== editDept && (
            <div className="text-xs text-amber-400 bg-amber-900/20 border border-amber-800 rounded-lg px-3 py-2">
              Reassigning from <strong>{deptLabel(ticket.department)}</strong> → <strong>{deptLabel(editDept)}</strong>
            </div>
          )}

          <Button onClick={save} disabled={saving || !changed}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Changes
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
