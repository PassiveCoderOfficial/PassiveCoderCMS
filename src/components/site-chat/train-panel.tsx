"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Trash2, Upload, FileText, ListChecks, MessageCircleQuestion, Sparkles, Pencil, Check, X } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";

type Item = { id: string; kind: "rule" | "qa" | "file"; title: string; content: string; pages: number | null; truncated: boolean; source: string; created_at: string; chars?: number };
type Data = { items: Item[]; limits: { files: number; entries: number | null }; canEdit: boolean; maxPages: number };

const API = "/api/site-chat/training";
async function post(body: unknown) {
  const res = await fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const j = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(j.error ?? "Failed");
  return j;
}

/**
 * Chat > Train AI: what the website chat assistant knows beyond the public
 * site. Rules (do / don't, offers), fixed answers, and files (PDF, Word, text).
 * The right-side AI assistant saves into the same list after asking.
 */
export function TrainPanel() {
  const [d, setD] = useState<Data | null>(null);
  const load = useCallback(async () => {
    const res = await fetch(API, { cache: "no-store" });
    if (res.ok) setD(await res.json());
  }, []);
  useEffect(() => { load(); }, [load]);

  if (!d) return <div className="p-10 flex justify-center"><Loader2 className="w-5 h-5 animate-spin" /></div>;
  const rules = d.items.filter((i) => i.kind === "rule");
  const qa = d.items.filter((i) => i.kind === "qa");
  const files = d.items.filter((i) => i.kind === "file");
  const entries = rules.length + qa.length;
  const entriesFull = d.limits.entries != null && entries >= d.limits.entries;

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-5 text-sm space-y-2">
          <p>Teach your website chat what is not on the website: offers, policies, prices, how to talk to visitors. It uses this from its next answer.</p>
          <p className="text-muted-foreground flex items-start gap-1.5">
            <Sparkles className="w-4 h-4 mt-0.5 shrink-0 text-violet-500" />
            <span>You can also tell the AI assistant (right side of the dashboard), for example &quot;if anyone asks for a discount, offer 10% when they book today&quot;. It asks before saving it here.</span>
          </p>
          <p className="text-xs text-muted-foreground">
            Rules and answers: {entries}{d.limits.entries != null ? ` of ${d.limits.entries}` : ""} · Files: {files.length} of {d.limits.files}
            {!d.canEdit && " · Only the site owner or an admin can change this."}
          </p>
        </CardContent>
      </Card>

      <Section icon={<ListChecks className="w-4 h-4" />} title="Rules: what to do and not do"
        hint="One instruction each. Examples: Always offer a free site visit. Never promise same-day delivery. Reply politely and short.">
        <List items={rules} canEdit={d.canEdit} reload={load} />
        {d.canEdit && !entriesFull && <AddRule onAdded={load} />}
        {d.canEdit && entriesFull && <Full />}
      </Section>

      <Section icon={<MessageCircleQuestion className="w-4 h-4" />} title="Answers to common questions"
        hint="The chat gives this answer when a visitor asks this or something similar.">
        <List items={qa} canEdit={d.canEdit} reload={load} />
        {d.canEdit && !entriesFull && <AddQa onAdded={load} />}
        {d.canEdit && entriesFull && <Full />}
      </Section>

      <Section icon={<FileText className="w-4 h-4" />} title="Files"
        hint={`Company profile, price list, brochure, policies. PDF, Word (.docx) or text, up to ${d.maxPages} pages each. Scanned pages (photos) can't be read.`}>
        <List items={files} canEdit={d.canEdit} reload={load} />
        {d.canEdit && (files.length < d.limits.files ? <UploadFile onAdded={load} /> : <Full files />)}
      </Section>
    </div>
  );
}

function Section({ icon, title, hint, children }: { icon: React.ReactNode; title: string; hint: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">{icon}{title}</CardTitle>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </CardHeader>
      <CardContent className="space-y-3">{children}</CardContent>
    </Card>
  );
}

function Full({ files }: { files?: boolean }) {
  return <p className="text-xs text-amber-700 dark:text-amber-400">Your plan&apos;s limit for {files ? "files" : "rules and answers"} is reached. Delete one or upgrade your plan to add more.</p>;
}

function List({ items, canEdit, reload }: { items: Item[]; canEdit: boolean; reload: () => void }) {
  if (!items.length) return <p className="text-xs text-muted-foreground">Nothing yet.</p>;
  return <div className="divide-y rounded-md border">{items.map((i) => <Row key={i.id} item={i} canEdit={canEdit} reload={reload} />)}</div>;
}

function Row({ item, canEdit, reload }: { item: Item; canEdit: boolean; reload: () => void }) {
  const [busy, setBusy] = useState(false);
  const [edit, setEdit] = useState(false);
  const [title, setTitle] = useState(item.title);
  const [content, setContent] = useState(item.content);
  const del = async () => {
    if (!confirm("Remove this from what the chat AI knows?")) return;
    setBusy(true);
    try { await post({ action: "delete", id: item.id }); reload(); } catch (e) { toast.error((e as Error).message); setBusy(false); }
  };
  const save = async () => {
    setBusy(true);
    try { await post({ action: "update", id: item.id, title: item.kind === "qa" ? title : content.slice(0, 80), content }); setEdit(false); reload(); }
    catch (e) { toast.error((e as Error).message); } finally { setBusy(false); }
  };
  if (edit) {
    return (
      <div className="p-3 space-y-2">
        {item.kind === "qa" && <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={300} />}
        <Textarea value={content} onChange={(e) => setContent(e.target.value)} maxLength={2000} rows={3} />
        <div className="flex gap-2 justify-end">
          <Button size="sm" variant="ghost" onClick={() => setEdit(false)}><X className="w-4 h-4" /></Button>
          <Button size="sm" onClick={save} disabled={busy}>{busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}</Button>
        </div>
      </div>
    );
  }
  return (
    <div className="p-3 flex gap-3 items-start text-sm">
      <div className="flex-1 min-w-0">
        {item.kind === "qa" && <p className="font-medium">{item.title}</p>}
        {item.kind === "file" ? (
          <>
            <p className="font-medium truncate">{item.title}</p>
            <p className="text-xs text-muted-foreground">{item.pages ?? "?"} {item.pages === 1 ? "page" : "pages"}{item.truncated ? " (only the first pages were read, split the file to add the rest)" : ""}</p>
          </>
        ) : (
          <p className="whitespace-pre-wrap text-muted-foreground">{item.content}</p>
        )}
        {item.source === "assistant" && <p className="text-[11px] text-violet-600 mt-1">Saved by the AI assistant</p>}
      </div>
      {canEdit && (
        <div className="flex gap-1 shrink-0">
          {item.kind !== "file" && <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEdit(true)} aria-label="Edit"><Pencil className="w-4 h-4" /></Button>}
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={del} disabled={busy} aria-label="Delete">{busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}</Button>
        </div>
      )}
    </div>
  );
}

function AddRule({ onAdded }: { onAdded: () => void }) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const add = async () => {
    setBusy(true);
    try { await post({ action: "add", kind: "rule", content: text }); setText(""); onAdded(); toast.success("Saved. The chat uses it from its next answer."); }
    catch (e) { toast.error((e as Error).message); } finally { setBusy(false); }
  };
  return (
    <div className="flex gap-2 items-start">
      <Textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="If a visitor asks for a discount, offer 10% when they book today." maxLength={2000} rows={2} />
      <Button onClick={add} disabled={busy || text.trim().length < 2}>{busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add"}</Button>
    </div>
  );
}

function AddQa({ onAdded }: { onAdded: () => void }) {
  const [q, setQ] = useState("");
  const [a, setA] = useState("");
  const [busy, setBusy] = useState(false);
  const add = async () => {
    setBusy(true);
    try { await post({ action: "add", kind: "qa", title: q, content: a }); setQ(""); setA(""); onAdded(); toast.success("Saved. The chat uses it from its next answer."); }
    catch (e) { toast.error((e as Error).message); } finally { setBusy(false); }
  };
  return (
    <div className="space-y-2">
      <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Question, e.g. Do you work on Fridays?" maxLength={300} />
      <div className="flex gap-2 items-start">
        <Textarea value={a} onChange={(e) => setA(e.target.value)} placeholder="Answer, e.g. Yes, from 2pm to 8pm." maxLength={2000} rows={2} />
        <Button onClick={add} disabled={busy || q.trim().length < 2 || a.trim().length < 2}>{busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add"}</Button>
      </div>
    </div>
  );
}

function UploadFile({ onAdded }: { onAdded: () => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const upload = async (f: File) => {
    if (f.size > 25 * 1024 * 1024) { toast.error("Files up to 25 MB."); return; }
    setBusy("Uploading...");
    try {
      const slot = await post({ action: "slot", name: f.name });
      const { error } = await createClient().storage.from("chat-training").uploadToSignedUrl(slot.path, slot.token, f, { contentType: f.type || "application/octet-stream" });
      if (error) throw new Error(error.message);
      setBusy("Reading the file...");
      const r = await post({ action: "file", path: slot.path, name: f.name, type: f.type });
      onAdded();
      toast.success(r.item?.truncated ? `Added. Only the first ${r.item.pages} pages were read.` : "Added. The chat can use it now.");
    } catch (e) { toast.error((e as Error).message); } finally { setBusy(null); if (ref.current) ref.current.value = ""; }
  };
  return (
    <div>
      <input ref={ref} type="file" className="hidden" accept=".pdf,.docx,.txt,.md,.csv,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); }} />
      <Button variant="outline" onClick={() => ref.current?.click()} disabled={!!busy}>
        {busy ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" />{busy}</> : <><Upload className="w-4 h-4 mr-1" />Upload a file</>}
      </Button>
    </div>
  );
}
