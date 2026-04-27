"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { TicketIcon, Loader2, Check, X, Search, ImageIcon, Trash2 } from "lucide-react";

interface Dept { id: string; name: string; slug: string; }
interface Tenant { id: string; name: string; slug: string; }
interface UserResult { user_id: string; full_name: string | null; email: string; }

const MAX_ATTACH = 5;
const supabase = createClient();

export default function NewSATicketPage() {
  const router = useRouter();
  const [depts, setDepts] = useState<Dept[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [attachments, setAttachments] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  // User search
  const [userQuery, setUserQuery] = useState("");
  const [userResults, setUserResults] = useState<UserResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [assignedUser, setAssignedUser] = useState<UserResult | null>(null);

  const [form, setForm] = useState({
    tenant_id: "",
    subject: "",
    body: "",
    priority: "normal",
    department: "support",
  });

  useEffect(() => {
    Promise.all([
      supabase.from("support_departments").select("id,name,slug").eq("is_active", true).order("sort_order"),
      supabase.from("tenants").select("id,name,slug").order("name"),
    ]).then(([{ data: d }, { data: t }]) => {
      const deps = d ?? [];
      setDepts(deps);
      setTenants(t ?? []);
      if (deps.length) setForm(f => ({ ...f, department: deps[0].slug }));
      setLoading(false);
    });
  }, []);

  async function searchUsers(q: string) {
    setUserQuery(q);
    if (q.length < 2) { setUserResults([]); return; }
    setSearching(true);
    const { data } = await supabase.from("profiles")
      .select("user_id,full_name,email")
      .or(`email.ilike.%${q}%,full_name.ilike.%${q}%`)
      .limit(8);
    setUserResults((data as UserResult[]) ?? []);
    setSearching(false);
  }

  async function uploadAttachment(file: File) {
    if (attachments.length >= MAX_ATTACH) { toast.error(`Max ${MAX_ATTACH}`); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error("Max 10MB"); return; }
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

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  async function save() {
    if (!form.subject.trim() || !form.body.trim()) { toast.error("Subject and message required"); return; }
    setSaving(true);
    const payload: Record<string, unknown> = {
      subject: form.subject.trim(),
      body: form.body.trim(),
      priority: form.priority,
      department: form.department,
      status: "open",
      attachments,
      source: "admin",
    };
    if (form.tenant_id) payload.tenant_id = form.tenant_id;
    if (assignedUser) {
      payload.user_id = assignedUser.user_id;
      payload.guest_name = assignedUser.full_name ?? assignedUser.email;
      payload.guest_email = assignedUser.email;
    }

    const { error } = await supabase.from("support_tickets").insert(payload);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Ticket created");
    router.push("/super-admin/tickets");
  }

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-5 h-5 animate-spin text-gray-500" /></div>;

  return (
    <div className="p-6 max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <TicketIcon className="w-6 h-6 text-amber-400" />
        <h1 className="text-2xl font-bold text-white">Open Support Ticket</h1>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">

        {/* Assign to user */}
        <div>
          <label className="text-xs text-gray-400 block mb-1">Assign To (search by email or name)</label>
          {assignedUser ? (
            <div className="flex items-center gap-2 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2">
              <div className="flex-1">
                <p className="text-sm text-white">{assignedUser.full_name ?? assignedUser.email}</p>
                <p className="text-xs text-gray-500">{assignedUser.email}</p>
              </div>
              <button onClick={() => { setAssignedUser(null); setUserQuery(""); setUserResults([]); }}
                className="text-gray-500 hover:text-red-400 p-1"><X className="w-3.5 h-3.5" /></button>
            </div>
          ) : (
            <div className="relative">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input value={userQuery} onChange={e => searchUsers(e.target.value)}
                  placeholder="Search user by email or name…"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-8 pr-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none" />
                {searching && <Loader2 className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 animate-spin" />}
              </div>
              {userResults.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg overflow-hidden shadow-xl">
                  {userResults.map(u => (
                    <button key={u.user_id} onClick={() => { setAssignedUser(u); setUserResults([]); setUserQuery(""); }}
                      className="w-full flex items-start gap-2 px-3 py-2.5 hover:bg-gray-700 text-left">
                      <div>
                        <p className="text-sm text-white">{u.full_name ?? "—"}</p>
                        <p className="text-xs text-gray-400">{u.email}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          <p className="text-xs text-gray-600 mt-1">Leave empty to create unassigned admin ticket</p>
        </div>

        {/* Site */}
        <div>
          <label className="text-xs text-gray-400 block mb-1">Site (optional)</label>
          <select value={form.tenant_id} onChange={e => set("tenant_id", e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none">
            <option value="">— no specific site —</option>
            {tenants.map(t => <option key={t.id} value={t.id}>{t.name} ({t.slug})</option>)}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-400 block mb-1">Department</label>
            <select value={form.department} onChange={e => set("department", e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none">
              {depts.map(d => <option key={d.id} value={d.slug}>{d.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">Priority</label>
            <select value={form.priority} onChange={e => set("priority", e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none">
              {["low","normal","high","urgent"].map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs text-gray-400 block mb-1">Subject *</label>
          <input value={form.subject} onChange={e => set("subject", e.target.value)}
            placeholder="Brief description of the issue"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none" />
        </div>

        <div>
          <label className="text-xs text-gray-400 block mb-1">Message *</label>
          <textarea rows={5} value={form.body} onChange={e => set("body", e.target.value)}
            placeholder="Describe the issue in detail…"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none resize-none" />
        </div>

        {/* Attachments */}
        <div>
          <label className="text-xs text-gray-400 block mb-2">Screenshots (max {MAX_ATTACH} images)</label>
          <div className="flex flex-wrap gap-2">
            {attachments.map((url, i) => (
              <div key={i} className="relative group w-20 h-20 rounded-lg overflow-hidden border border-gray-700">
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
                className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-700 hover:border-indigo-500 flex flex-col items-center justify-center gap-1 text-gray-500 hover:text-indigo-400 transition-colors">
                {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><ImageIcon className="w-5 h-5" /><span className="text-[10px]">Add</span></>}
              </button>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) uploadAttachment(f); e.target.value = ""; }} />
        </div>

        <div className="flex gap-2 pt-1">
          <button onClick={save} disabled={saving || !form.subject.trim() || !form.body.trim()}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm px-4 py-2 rounded-lg">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            Create Ticket
          </button>
          <button onClick={() => router.push("/super-admin/tickets")}
            className="flex items-center gap-1.5 bg-gray-800 hover:bg-gray-700 text-white text-sm px-4 py-2 rounded-lg">
            <X className="w-4 h-4" /> Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
