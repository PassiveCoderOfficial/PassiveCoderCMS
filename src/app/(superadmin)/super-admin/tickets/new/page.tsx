"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { TicketIcon, Loader2, Check, X, Search, ImageIcon, Trash2, Globe, Mail, Phone, User } from "lucide-react";

interface Dept { id: string; name: string; slug: string; }

interface SearchResult {
  key: string;
  tenant_id: string | null;
  tenant_name: string | null;
  tenant_slug: string | null;
  tenant_domain: string | null;
  user_id: string | null;
  user_email: string | null;
  user_name: string | null;
  phone: string | null;
}

const MAX_ATTACH = 5;
const supabase = createClient();

export default function NewSATicketPage() {
  const router = useRouter();
  const [depts, setDepts] = useState<Dept[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [attachments, setAttachments] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  // Search state
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selected, setSelected] = useState<SearchResult | null>(null);

  // Guest fallback
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");

  const [form, setForm] = useState({
    subject: "",
    body: "",
    priority: "normal",
    department: "support",
  });

  useEffect(() => {
    supabase.from("support_departments").select("id,name,slug").eq("is_active", true).order("sort_order").then(({ data }) => {
      const deps = data ?? [];
      setDepts(deps);
      if (deps.length) setForm(f => ({ ...f, department: deps[0].slug }));
      setLoading(false);
    });
  }, []);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim() || q.length < 2) { setResults([]); return; }
    setSearching(true);

    const qLike = `%${q}%`;

    const [tenantRes, profileRes] = await Promise.all([
      // Search tenants by name, slug, custom_domain, phone
      supabase.from("tenants")
        .select("id,name,slug,custom_domain,phone")
        .or(`name.ilike.${qLike},slug.ilike.${qLike},custom_domain.ilike.${qLike},phone.ilike.${qLike}`)
        .limit(8),
      // Search profiles by name, email, phone
      supabase.from("profiles")
        .select("id,full_name,email,phone")
        .or(`full_name.ilike.${qLike},email.ilike.${qLike},phone.ilike.${qLike}`)
        .limit(8),
    ]);

    const combined: SearchResult[] = [];

    // Tenant hits
    for (const t of (tenantRes.data ?? [])) {
      combined.push({
        key: `t:${t.id}`,
        tenant_id: t.id,
        tenant_name: t.name,
        tenant_slug: t.slug,
        tenant_domain: t.custom_domain ?? null,
        user_id: null,
        user_email: null,
        user_name: null,
        phone: t.phone ?? null,
      });
    }

    // Profile hits — enrich with tenant via owner membership
    if ((profileRes.data ?? []).length > 0) {
      const profileIds = (profileRes.data ?? []).map(p => p.id);
      const { data: memberships } = await supabase
        .from("tenant_members")
        .select("user_id,tenant_id,role,tenants(id,name,slug,custom_domain)")
        .in("user_id", profileIds)
        .eq("role", "owner");

      for (const p of (profileRes.data ?? [])) {
        const membership = memberships?.find(m => m.user_id === p.id);
        const t = membership?.tenants as { id: string; name: string; slug: string; custom_domain: string | null } | null ?? null;
        // Skip if already have this tenant from above
        const alreadyHasTenant = t && combined.some(c => c.tenant_id === t.id);
        if (alreadyHasTenant) continue;
        combined.push({
          key: `p:${p.id}`,
          tenant_id: t?.id ?? null,
          tenant_name: t?.name ?? null,
          tenant_slug: t?.slug ?? null,
          tenant_domain: t?.custom_domain ?? null,
          user_id: p.id,
          user_email: p.email,
          user_name: p.full_name,
          phone: p.phone ?? null,
        });
      }
    }

    setResults(combined);
    setSearching(false);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => doSearch(query), 300);
    return () => clearTimeout(t);
  }, [query, doSearch]);

  function selectResult(r: SearchResult) {
    setSelected(r);
    setQuery(r.tenant_name ?? r.user_name ?? r.user_email ?? "");
    setResults([]);
    if (r.user_email && !guestEmail) setGuestEmail(r.user_email);
    if (r.user_name && !guestName) setGuestName(r.user_name);
  }

  function clearSelection() {
    setSelected(null);
    setQuery("");
    setResults([]);
    setGuestName("");
    setGuestEmail("");
  }

  async function uploadAttachment(file: File) {
    if (attachments.length >= MAX_ATTACH) { toast.error(`Max ${MAX_ATTACH} attachments`); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error("Max 10 MB per file"); return; }
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

  const setField = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

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
      source: "site_admin",
    };

    if (selected?.tenant_id) payload.tenant_id = selected.tenant_id;
    if (selected?.user_id) payload.user_id = selected.user_id;
    if (guestName) payload.guest_name = guestName;
    if (guestEmail) payload.guest_email = guestEmail;

    const { data, error } = await supabase.from("support_tickets").insert(payload).select("id").single();
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Ticket created");
    router.push(`/super-admin/tickets/${data.id}`);
  }

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-5 h-5 animate-spin text-gray-500" /></div>;

  return (
    <div className="p-6 max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <TicketIcon className="w-6 h-6 text-amber-400" />
        <h1 className="text-2xl font-bold text-white">Open Support Ticket</h1>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">

        {/* Customer search */}
        <div>
          <label className="text-xs text-gray-400 block mb-1.5">
            Find Customer <span className="text-gray-600">— search by domain, subdomain, email, name, or phone</span>
          </label>

          {selected ? (
            <div className="flex items-center gap-3 bg-indigo-600/10 border border-indigo-500/20 rounded-lg px-3 py-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-600/20 flex items-center justify-center shrink-0">
                {selected.tenant_slug ? <Globe className="w-3.5 h-3.5 text-indigo-400" /> : <User className="w-3.5 h-3.5 text-indigo-400" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white">{selected.tenant_name ?? selected.user_name ?? selected.user_email}</p>
                <div className="flex items-center gap-3 flex-wrap mt-0.5">
                  {selected.tenant_slug && (
                    <span className="text-xs text-gray-500 font-mono">{selected.tenant_slug}.passivecoder.com</span>
                  )}
                  {selected.user_email && (
                    <span className="text-xs text-gray-500 flex items-center gap-1"><Mail className="w-3 h-3" />{selected.user_email}</span>
                  )}
                  {selected.phone && (
                    <span className="text-xs text-gray-500 flex items-center gap-1"><Phone className="w-3 h-3" />{selected.phone}</span>
                  )}
                </div>
              </div>
              <button onClick={clearSelection} className="text-gray-500 hover:text-red-400 p-1 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              </div>
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="e.g. emiratescurtain.com, john@, +971..."
                className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-9 pr-8 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500"
              />
              {query && (
                <button type="button" onClick={() => { setQuery(""); setResults([]); }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              )}

              {results.length > 0 && (
                <div className="absolute z-20 w-full mt-1 bg-gray-800 border border-gray-700 rounded-xl overflow-hidden shadow-2xl divide-y divide-gray-700/50">
                  {results.map(r => (
                    <button
                      key={r.key}
                      type="button"
                      onClick={() => selectResult(r)}
                      className="w-full flex items-start gap-3 px-4 py-3 hover:bg-gray-700/50 transition-colors text-left"
                    >
                      <div className="w-8 h-8 rounded-lg bg-indigo-600/15 border border-indigo-500/15 flex items-center justify-center shrink-0 mt-0.5">
                        {r.tenant_slug ? <Globe className="w-3.5 h-3.5 text-indigo-400" /> : <User className="w-3.5 h-3.5 text-indigo-400" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          {r.tenant_name && <span className="font-semibold text-white text-sm">{r.tenant_name}</span>}
                          {!r.tenant_name && r.user_name && <span className="font-semibold text-white text-sm">{r.user_name}</span>}
                          {r.tenant_slug && (
                            <span className="text-xs text-gray-500 font-mono bg-gray-700/50 px-1.5 py-0.5 rounded">
                              {r.tenant_slug}.passivecoder.com
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                          {r.user_email && <span className="text-xs text-gray-500 flex items-center gap-1"><Mail className="w-2.5 h-2.5" />{r.user_email}</span>}
                          {r.phone && <span className="text-xs text-gray-500 flex items-center gap-1"><Phone className="w-2.5 h-2.5" />{r.phone}</span>}
                          {r.tenant_domain && <span className="text-xs text-gray-500 flex items-center gap-1"><Globe className="w-2.5 h-2.5" />{r.tenant_domain}</span>}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {query.length >= 2 && !searching && results.length === 0 && (
                <div className="absolute z-20 w-full mt-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-500">
                  No matches found — you can still open a guest ticket below.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Guest fields */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-400 block mb-1">Guest / Contact Name</label>
            <input value={guestName} onChange={e => setGuestName(e.target.value)} placeholder="Full name"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500" />
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">Guest / Contact Email</label>
            <input value={guestEmail} onChange={e => setGuestEmail(e.target.value)} placeholder="email@example.com" type="email"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-400 block mb-1">Department</label>
            <select value={form.department} onChange={e => setField("department", e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none">
              {depts.map(d => <option key={d.id} value={d.slug}>{d.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">Priority</label>
            <select value={form.priority} onChange={e => setField("priority", e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none">
              {["low","normal","high","urgent"].map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs text-gray-400 block mb-1">Subject *</label>
          <input value={form.subject} onChange={e => setField("subject", e.target.value)}
            placeholder="Brief description of the issue"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none" />
        </div>

        <div>
          <label className="text-xs text-gray-400 block mb-1">Message *</label>
          <textarea rows={5} value={form.body} onChange={e => setField("body", e.target.value)}
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
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm px-5 py-2.5 rounded-lg transition-colors">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            Create Ticket
          </button>
          <button onClick={() => router.push("/super-admin/tickets")}
            className="flex items-center gap-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm px-5 py-2.5 rounded-lg transition-colors">
            <X className="w-4 h-4" /> Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
