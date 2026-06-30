"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Plus, MessageSquare, Clock, CheckCircle, AlertCircle, Image as ImageIcon, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Ticket {
  id: string;
  subject: string;
  body: string;
  status: string;
  priority: string;
  department: string;
  attachments: string[];
  created_at: string;
  updated_at: string;
}

interface Department { id: string; name: string; slug: string; }

const STATUS_CONFIG: Record<string, { color: string; icon: React.ReactNode }> = {
  open:        { color: "text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400", icon: <MessageSquare className="w-3 h-3" /> },
  in_progress: { color: "text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400", icon: <Clock className="w-3 h-3" /> },
  resolved:    { color: "text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400", icon: <CheckCircle className="w-3 h-3" /> },
  closed:      { color: "text-gray-500 bg-gray-100 dark:bg-gray-800", icon: null },
};

const MAX_ATTACH = 5;
const supabase = createClient();

export default function SupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [form, setForm] = useState({ subject: "", body: "", priority: "normal", department: "support" });
  const [attachments, setAttachments] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  // Deep-link support: /dashboard/support?new=1&dept=custom_dev opens the form
  // with the department preselected (used by the subscription "Contact Support" CTA).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const dept = params.get("dept");
    if (params.get("new")) setShowForm(true);
    if (dept) setForm(f => ({ ...f, department: dept }));
  }, []);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const [{ data: membership }, { data: depts }] = await Promise.all([
        supabase.from("tenant_members").select("tenant_id").eq("user_id", user.id).single(),
        supabase.from("support_departments").select("id,name,slug").eq("is_active", true).order("sort_order"),
      ]);
      setDepartments(depts ?? []);
      if (!membership) { setLoading(false); return; }
      setTenantId(membership.tenant_id);
      const { data } = await supabase
        .from("support_tickets")
        .select("id,subject,body,status,priority,department,attachments,created_at,updated_at")
        .eq("tenant_id", membership.tenant_id)
        .order("created_at", { ascending: false });
      setTickets(data ?? []);
      setLoading(false);
    })();
  }, []);

  async function uploadAttachment(file: File) {
    if (attachments.length >= MAX_ATTACH) { toast.error(`Max ${MAX_ATTACH} attachments`); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error("Max file size 10MB"); return; }
    if (!file.type.startsWith("image/")) { toast.error("Images only"); return; }
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `ticket-attachments/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from("media").upload(path, file, { contentType: file.type });
    if (error) { toast.error(error.message); setUploading(false); return; }
    const { data: { publicUrl } } = supabase.storage.from("media").getPublicUrl(path);
    setAttachments(prev => [...prev, publicUrl]);
    setUploading(false);
  }

  async function submitTicket() {
    if (!form.subject.trim() || !form.body.trim() || !tenantId) return;
    setSubmitting(true);
    const { error } = await supabase.from("support_tickets").insert({
      tenant_id: tenantId, subject: form.subject.trim(), body: form.body.trim(),
      priority: form.priority, department: form.department || "support",
      status: "open", attachments,
    });
    if (error) { toast.error(error.message); setSubmitting(false); return; }
    toast.success("Ticket submitted.");
    setForm({ subject: "", body: "", priority: "normal", department: "support" });
    setAttachments([]); setShowForm(false);
    const { data } = await supabase.from("support_tickets")
      .select("id,subject,body,status,priority,department,attachments,created_at,updated_at")
      .eq("tenant_id", tenantId).order("created_at", { ascending: false });
    setTickets(data ?? []);
    setSubmitting(false);
  }

  const deptLabel = (slug: string) => departments.find(d => d.slug === slug)?.name ?? slug;

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Support</h1>
          <p className="text-muted-foreground text-sm mt-1">Submit tickets and track responses from our team.</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}><Plus className="w-4 h-4 mr-2" /> New Ticket</Button>
      </div>

      {showForm && (
        <div className="rounded-xl border bg-card p-5 space-y-4">
          <h2 className="font-semibold">Submit a Support Ticket</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label className="text-xs mb-1 block">Subject</Label>
              <Input placeholder="Brief description" value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs mb-1 block">Department</Label>
              <select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))}>
                {(departments.length > 0 ? departments : [{ id: "s", name: "Support", slug: "support" }, { id: "sa", name: "Sales", slug: "sales" }, { id: "b", name: "Billing", slug: "billing" }, { id: "g", name: "General", slug: "general" }])
                  .map(d => <option key={d.id} value={d.slug}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <Label className="text-xs mb-1 block">Priority</Label>
              <select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>
          <div>
            <Label className="text-xs mb-1 block">Message</Label>
            <textarea rows={4} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Describe your issue in detail..." value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} />
          </div>

          {/* Attachments */}
          <div>
            <Label className="text-xs mb-2 block">
              Screenshots <span className="text-muted-foreground">(max {MAX_ATTACH} images, 10MB each)</span>
            </Label>
            <div className="flex flex-wrap gap-2">
              {attachments.map((url, i) => (
                <div key={i} className="relative group w-20 h-20 rounded-lg overflow-hidden border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  <button onClick={() => setAttachments(prev => prev.filter((_, j) => j !== i))}
                    className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <Trash2 className="w-4 h-4 text-white" />
                  </button>
                </div>
              ))}
              {attachments.length < MAX_ATTACH && (
                <button onClick={() => fileRef.current?.click()} disabled={uploading}
                  className="w-20 h-20 rounded-lg border-2 border-dashed border-input hover:border-primary flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-primary transition-colors">
                  {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><ImageIcon className="w-5 h-5" /><span className="text-[10px]">Add</span></>}
                </button>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) uploadAttachment(f); e.target.value = ""; }} />
          </div>

          <div className="flex gap-2">
            <Button onClick={submitTicket} disabled={submitting || !form.subject.trim() || !form.body.trim()}>
              {submitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />} Submit Ticket
            </Button>
            <Button variant="outline" onClick={() => { setShowForm(false); setAttachments([]); }}>Cancel</Button>
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
                {ticket.attachments?.length > 0 && (
                  <div className="flex gap-1.5 flex-wrap">
                    {ticket.attachments.map((url, i) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img key={i} src={url} alt="" className="w-10 h-10 rounded object-cover border" />
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className={cn("font-medium", ticket.priority === "urgent" ? "text-red-500" : ticket.priority === "high" ? "text-amber-500" : "")}>
                    <AlertCircle className="w-3 h-3 inline mr-0.5" />{ticket.priority}
                  </span>
                  <span className="bg-muted px-1.5 py-0.5 rounded text-[10px]">{deptLabel(ticket.department)}</span>
                  <span>Submitted {new Date(ticket.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
