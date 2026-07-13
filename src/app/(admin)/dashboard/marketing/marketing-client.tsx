"use client";

import { useState } from "react";
import {
  Megaphone, Plus, X, Loader2, Send, Trash2, Mail, MessageCircle,
  FlaskConical, Users, Pencil,
} from "lucide-react";

interface Stage { id: string; name: string }
interface Campaign {
  id: string; name: string; channel: "email" | "whatsapp";
  subject: string | null; body: string;
  audience: { all?: boolean; tags?: string[]; stage_ids?: string[] };
  status: "draft" | "sending" | "sent" | "failed" | "cancelled";
  recipient_count: number; sent_count: number; failed_count: number;
  sent_at: string | null; created_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-800 text-gray-400 border-gray-700",
  sending: "bg-yellow-900/50 text-yellow-300 border-yellow-700/50",
  sent: "bg-green-900/50 text-green-300 border-green-700/50",
  failed: "bg-red-900/50 text-red-300 border-red-700/50",
  cancelled: "bg-gray-800 text-gray-500 border-gray-700",
};

const inputCls = "w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40";
const btnPrimary = "inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50";
const btnGhost = "inline-flex items-center gap-2 border border-gray-700 hover:bg-gray-800 text-gray-300 px-3 py-2 rounded-lg text-sm transition-colors disabled:opacity-50";

function Composer({ campaign, stages, onClose, onSaved }: {
  campaign: Campaign | null; stages: Stage[];
  onClose: () => void; onSaved: (c: Campaign) => void;
}) {
  const [f, setF] = useState({
    name: campaign?.name ?? "",
    channel: campaign?.channel ?? "email",
    subject: campaign?.subject ?? "",
    body: campaign?.body ?? "Hi {{first_name}},\n\n",
    tags: (campaign?.audience.tags ?? []).join(", "),
    stage_ids: campaign?.audience.stage_ids ?? [],
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    if (!f.name.trim()) { setError("Name required"); return; }
    setSaving(true); setError(null);
    const audience: Record<string, unknown> = {};
    const tags = f.tags.split(",").map(t => t.trim()).filter(Boolean);
    if (tags.length) audience.tags = tags;
    if (f.stage_ids.length) audience.stage_ids = f.stage_ids;
    if (!tags.length && !f.stage_ids.length) audience.all = true;

    const payload = { name: f.name, channel: f.channel, subject: f.subject, body: f.body, audience };
    const res = campaign
      ? await fetch(`/api/marketing/campaigns/${campaign.id}`, {
          method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
      : await fetch("/api/marketing/campaigns", {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const d = await res.json();
    setSaving(false);
    if (!res.ok) { setError(d.error ?? "Failed"); return; }
    onSaved(d); onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto bg-gray-950 border border-gray-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">{campaign ? "Edit campaign" : "New campaign"}</h2>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800"><X className="w-4 h-4" /></button>
        </div>

        <input className={inputCls} placeholder="Campaign name (internal)" value={f.name}
          onChange={(e) => setF(p => ({ ...p, name: e.target.value }))} />

        <div className="flex gap-2">
          <button type="button" onClick={() => setF(p => ({ ...p, channel: "email" }))}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border text-sm transition-colors ${
              f.channel === "email" ? "bg-indigo-600 border-indigo-600 text-white" : "border-gray-700 text-gray-400"
            }`}><Mail className="w-4 h-4" /> Email</button>
          <button type="button" disabled title="WhatsApp broadcast needs the Meta Cloud API — coming soon"
            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border border-gray-800 text-sm text-gray-600 cursor-not-allowed">
            <MessageCircle className="w-4 h-4" /> WhatsApp <span className="text-[10px] uppercase">soon</span>
          </button>
        </div>

        <input className={inputCls} placeholder="Email subject" value={f.subject}
          onChange={(e) => setF(p => ({ ...p, subject: e.target.value }))} />

        <div>
          <textarea className={inputCls} rows={8} value={f.body}
            onChange={(e) => setF(p => ({ ...p, body: e.target.value }))} />
          <p className="text-[11px] text-gray-500 mt-1">
            Personalize with {"{{first_name}}"}, {"{{name}}"}, {"{{email}}"}.
          </p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-3 space-y-2">
          <p className="text-xs font-semibold text-gray-400 uppercase">Audience (leave empty = everyone with email consent)</p>
          <input className={inputCls} placeholder="Tags, comma separated (e.g. newsletter, customer)" value={f.tags}
            onChange={(e) => setF(p => ({ ...p, tags: e.target.value }))} />
          {stages.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {stages.map(s => (
                <button key={s.id} type="button"
                  onClick={() => setF(p => ({
                    ...p,
                    stage_ids: p.stage_ids.includes(s.id)
                      ? p.stage_ids.filter(x => x !== s.id)
                      : [...p.stage_ids, s.id],
                  }))}
                  className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${
                    f.stage_ids.includes(s.id) ? "bg-indigo-600 border-indigo-600 text-white" : "border-gray-700 text-gray-400"
                  }`}>{s.name}</button>
              ))}
            </div>
          )}
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}
        <button onClick={save} disabled={saving} className={`${btnPrimary} w-full justify-center`}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          {campaign ? "Save changes" : "Create draft"}
        </button>
      </div>
    </div>
  );
}

export default function MarketingClient({ initialCampaigns, audienceCount, stages }: {
  initialCampaigns: Campaign[]; audienceCount: number; stages: Stage[];
}) {
  const [campaigns, setCampaigns] = useState(initialCampaigns);
  const [composer, setComposer] = useState<{ open: boolean; campaign: Campaign | null }>({ open: false, campaign: null });
  const [busy, setBusy] = useState<string | null>(null);

  const patchLocal = (c: Campaign) =>
    setCampaigns(l => l.some(x => x.id === c.id) ? l.map(x => x.id === c.id ? c : x) : [c, ...l]);

  async function act(c: Campaign, action: "send" | "test") {
    if (action === "send" && !confirm(`Send "${c.name}" to all matching consented contacts?`)) return;
    setBusy(c.id);
    const res = await fetch(`/api/marketing/campaigns/${c.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const d = await res.json();
    if (!res.ok) alert(d.error ?? "Failed");
    else if (action === "send") patchLocal(d);
    else alert("Test email sent to your account address.");
    setBusy(null);
  }

  async function del(c: Campaign) {
    if (!confirm(`Delete campaign "${c.name}"?`)) return;
    const res = await fetch(`/api/marketing/campaigns/${c.id}`, { method: "DELETE" });
    if (res.ok) setCampaigns(l => l.filter(x => x.id !== c.id));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Megaphone className="w-6 h-6 text-indigo-400" /> Marketing
        </h1>
        <button onClick={() => setComposer({ open: true, campaign: null })} className={btnPrimary}>
          <Plus className="w-4 h-4" /> New campaign
        </button>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 max-w-xs">
        <p className="text-xs text-gray-500 mb-1 flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> Email audience</p>
        <p className="text-xl font-bold text-white">{audienceCount}</p>
        <p className="text-[11px] text-gray-500 mt-1">Contacts with email + consent. Newsletter signups land here automatically.</p>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        {campaigns.length === 0 ? (
          <div className="text-center py-16 text-gray-500 text-sm">
            No campaigns yet. Create one, send yourself a test, then send it to your list.
          </div>
        ) : (
          <div className="divide-y divide-gray-800">
            {campaigns.map((c) => (
              <div key={c.id} className="flex items-center gap-4 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    {c.channel === "email"
                      ? <Mail className="w-4 h-4 text-gray-500 shrink-0" />
                      : <MessageCircle className="w-4 h-4 text-gray-500 shrink-0" />}
                    <span className="text-sm font-medium text-white truncate">{c.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full border capitalize shrink-0 ${STATUS_COLORS[c.status]}`}>{c.status}</span>
                  </div>
                  <div className="text-xs text-gray-500 truncate">
                    {c.subject || "No subject"}
                    {c.status !== "draft" && ` · ${c.sent_count}/${c.recipient_count} sent${c.failed_count ? `, ${c.failed_count} failed` : ""}`}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {c.status === "draft" && (
                    <>
                      <button title="Edit" onClick={() => setComposer({ open: true, campaign: c })}
                        className="p-2 text-gray-500 hover:text-white rounded-lg hover:bg-gray-800"><Pencil className="w-4 h-4" /></button>
                      <button title="Send test to me" disabled={busy === c.id} onClick={() => act(c, "test")}
                        className="p-2 text-gray-500 hover:text-yellow-300 rounded-lg hover:bg-gray-800"><FlaskConical className="w-4 h-4" /></button>
                      <button title="Send campaign" disabled={busy === c.id} onClick={() => act(c, "send")}
                        className="p-2 text-gray-500 hover:text-indigo-400 rounded-lg hover:bg-gray-800">
                        {busy === c.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      </button>
                    </>
                  )}
                  <button title="Delete" onClick={() => del(c)}
                    className="p-2 text-gray-500 hover:text-red-400 rounded-lg hover:bg-gray-800"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {composer.open && (
        <Composer campaign={composer.campaign} stages={stages}
          onClose={() => setComposer({ open: false, campaign: null })}
          onSaved={patchLocal} />
      )}
    </div>
  );
}
