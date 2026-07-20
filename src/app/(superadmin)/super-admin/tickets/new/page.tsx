"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { TicketIcon, Loader2, Check, X, Search, ImageIcon, Trash2, Globe, Mail, Phone, User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
const supabase = createClient(); // used only for storage uploads

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
    fetch("/api/super-admin/tickets")
      .then(r => r.json())
      .then(({ depts: d }) => {
        const deps = (d ?? []).filter((dept: { id: string }) => dept.id);
        setDepts(deps);
        if (deps.length) setForm(f => ({ ...f, department: deps[0].slug }));
        setLoading(false);
      });
  }, []);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim() || q.length < 2) { setResults([]); return; }
    setSearching(true);
    fetch(`/api/super-admin/search?q=${encodeURIComponent(q)}`)
      .then(r => r.json())
      .then(({ results: r }) => { setResults(r ?? []); setSearching(false); })
      .catch(() => setSearching(false));
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

    const res = await fetch("/api/super-admin/tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    const result = await res.json();
    if (!res.ok) { toast.error(result.error ?? "Failed to create ticket"); return; }
    toast.success("Ticket created");
    router.push(`/super-admin/tickets/${result.id}`);
  }

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <TicketIcon className="w-6 h-6 text-amber-400" />
        <h1 className="text-2xl font-bold">Open Support Ticket</h1>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">

          {/* Customer search */}
          <div className="space-y-1.5">
            <Label className="text-xs">
              Find Customer <span className="text-muted-foreground font-normal">— search by domain, subdomain, email, name, or phone</span>
            </Label>

            {selected ? (
              <div className="flex items-center gap-3 bg-indigo-600/10 border border-indigo-500/20 rounded-lg px-3 py-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-600/20 flex items-center justify-center shrink-0">
                  {selected.tenant_slug ? <Globe className="w-3.5 h-3.5 text-indigo-400" /> : <User className="w-3.5 h-3.5 text-indigo-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">{selected.tenant_name ?? selected.user_name ?? selected.user_email}</p>
                  <div className="flex items-center gap-3 flex-wrap mt-0.5">
                    {selected.tenant_slug && (
                      <span className="text-xs text-muted-foreground font-mono">{selected.tenant_slug}.passivecoder.com</span>
                    )}
                    {selected.user_email && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1"><Mail className="w-3 h-3" />{selected.user_email}</span>
                    )}
                    {selected.phone && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="w-3 h-3" />{selected.phone}</span>
                    )}
                  </div>
                </div>
                <button onClick={clearSelection} className="text-muted-foreground hover:text-red-400 p-1 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                </div>
                <Input
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="e.g. emiratescurtain.com, john@, +971..."
                  className="pl-9 pr-8"
                />
                {query && (
                  <button type="button" onClick={() => { setQuery(""); setResults([]); }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    <X className="w-4 h-4" />
                  </button>
                )}

                {results.length > 0 && (
                  <Card className="absolute z-20 w-full mt-1 overflow-hidden shadow-2xl divide-y">
                    {results.map(r => (
                      <button
                        key={r.key}
                        type="button"
                        onClick={() => selectResult(r)}
                        className="w-full flex items-start gap-3 px-4 py-3 hover:bg-accent transition-colors text-left"
                      >
                        <div className="w-8 h-8 rounded-lg bg-indigo-600/15 border border-indigo-500/15 flex items-center justify-center shrink-0 mt-0.5">
                          {r.tenant_slug ? <Globe className="w-3.5 h-3.5 text-indigo-400" /> : <User className="w-3.5 h-3.5 text-indigo-400" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            {r.tenant_name && <span className="font-semibold text-sm">{r.tenant_name}</span>}
                            {!r.tenant_name && r.user_name && <span className="font-semibold text-sm">{r.user_name}</span>}
                            {r.tenant_slug && (
                              <span className="text-xs text-muted-foreground font-mono bg-accent px-1.5 py-0.5 rounded">
                                {r.tenant_slug}.passivecoder.com
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                            {r.user_email && <span className="text-xs text-muted-foreground flex items-center gap-1"><Mail className="w-2.5 h-2.5" />{r.user_email}</span>}
                            {r.phone && <span className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="w-2.5 h-2.5" />{r.phone}</span>}
                            {r.tenant_domain && <span className="text-xs text-muted-foreground flex items-center gap-1"><Globe className="w-2.5 h-2.5" />{r.tenant_domain}</span>}
                          </div>
                        </div>
                      </button>
                    ))}
                  </Card>
                )}

                {query.length >= 2 && !searching && results.length === 0 && (
                  <Card className="absolute z-20 w-full mt-1 px-4 py-3 text-sm text-muted-foreground">
                    No matches found — you can still open a guest ticket below.
                  </Card>
                )}
              </div>
            )}
          </div>

          {/* Guest fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Guest / Contact Name</Label>
              <Input value={guestName} onChange={e => setGuestName(e.target.value)} placeholder="Full name" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Guest / Contact Email</Label>
              <Input value={guestEmail} onChange={e => setGuestEmail(e.target.value)} placeholder="email@example.com" type="email" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Department</Label>
              <Select value={form.department} onValueChange={v => setField("department", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {depts.map(d => <SelectItem key={d.id} value={d.slug}>{d.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Priority</Label>
              <Select value={form.priority} onValueChange={v => setField("priority", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["low", "normal", "high", "urgent"].map(p => (
                    <SelectItem key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Subject *</Label>
            <Input value={form.subject} onChange={e => setField("subject", e.target.value)} placeholder="Brief description of the issue" />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Message *</Label>
            <Textarea rows={5} value={form.body} onChange={e => setField("body", e.target.value)} placeholder="Describe the issue in detail…" />
          </div>

          {/* Attachments */}
          <div className="space-y-2">
            <Label className="text-xs">Screenshots (max {MAX_ATTACH} images)</Label>
            <div className="flex flex-wrap gap-2">
              {attachments.map((url, i) => (
                <div key={i} className="relative group w-20 h-20 rounded-lg overflow-hidden border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  <button onClick={() => setAttachments(prev => prev.filter((_, j) => j !== i))}
                    className="absolute top-0.5 right-0.5 bg-black/70 hover:bg-red-900/80 rounded-full p-1 transition-colors">
                    <Trash2 className="w-3 h-3 text-white" />
                  </button>
                </div>
              ))}
              {attachments.length < MAX_ATTACH && (
                <button onClick={() => fileRef.current?.click()} disabled={uploading}
                  className="w-20 h-20 rounded-lg border-2 border-dashed hover:border-indigo-500 flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-indigo-400 transition-colors">
                  {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><ImageIcon className="w-5 h-5" /><span className="text-[10px]">Add</span></>}
                </button>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) uploadAttachment(f); e.target.value = ""; }} />
          </div>

          <div className="flex gap-2 pt-1">
            <Button onClick={save} disabled={saving || !form.subject.trim() || !form.body.trim()}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Create Ticket
            </Button>
            <Button variant="secondary" onClick={() => router.push("/super-admin/tickets")}>
              <X className="w-4 h-4" /> Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
