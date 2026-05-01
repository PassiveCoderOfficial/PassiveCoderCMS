"use client";

import { useState } from "react";
import { Phone, MapPin, Mail, MessageSquare, Plus, Trash2, Pencil, Check, X, Loader2, Inbox, Eye } from "lucide-react";
import { PhoneInput } from "@/components/ui/phone-input";

interface ContactDetail {
  id: string;
  label: string;
  address: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  maps_embed_url: string | null;
  floating_whatsapp: boolean;
  floating_call: boolean;
  floating_email: boolean;
  floating_position: string;
  floating_color: string;
  sort_order: number;
  is_primary: boolean;
}

interface ContactForm {
  id: string;
  name: string;
  recipient_email: string | null;
  success_message: string;
}

interface Submission {
  id: string;
  form_id: string;
  data: Record<string, unknown>;
  ip: string | null;
  read: boolean;
  created_at: string;
}

function api(method: string, body?: unknown, params?: Record<string, string>) {
  const url = params ? `/api/contact?${new URLSearchParams(params)}` : "/api/contact";
  return fetch(url, { method, headers: body ? { "Content-Type": "application/json" } : {}, body: body ? JSON.stringify(body) : undefined });
}

const EMPTY_DETAIL: Omit<ContactDetail, "id"> = {
  label: "Main Office", address: "", phone: "", whatsapp: "", email: "", maps_embed_url: "",
  floating_whatsapp: false, floating_call: false, floating_email: false,
  floating_position: "bottom-right", floating_color: "#25D366", sort_order: 0, is_primary: false,
};

function DetailEditor({ detail: initial, onSave, onCancel }: {
  detail: Partial<ContactDetail>;
  onSave: (d: ContactDetail, isNew: boolean) => void;
  onCancel: () => void;
}) {
  const [d, setD] = useState<Partial<ContactDetail>>({ ...EMPTY_DETAIL, ...initial });
  const [saving, setSaving] = useState(false);
  const isNew = !d.id;
  const set = (k: keyof ContactDetail, v: unknown) => setD(p => ({ ...p, [k]: v }));

  async function save() {
    setSaving(true);
    const res = await api(isNew ? "POST" : "PATCH", { _type: "detail", ...d });
    const data = isNew ? await res.json() : { ...d };
    setSaving(false);
    onSave(data as ContactDetail, isNew);
  }

  return (
    <div className="bg-gray-800/50 border border-indigo-500/30 rounded-xl p-5 space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-gray-400 mb-1">Label</label>
          <input value={d.label ?? ""} onChange={e => set("label", e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm text-white focus:border-indigo-500 focus:outline-none" placeholder="Head Office" />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Phone</label>
          <PhoneInput value={d.phone ?? ""} onChange={v => set("phone", v)} inputClassName="bg-gray-800 border-gray-700 text-white" />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">WhatsApp Number</label>
          <PhoneInput value={d.whatsapp ?? ""} onChange={v => set("whatsapp", v)} inputClassName="bg-gray-800 border-gray-700 text-white" />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Email</label>
          <input value={d.email ?? ""} onChange={e => set("email", e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm text-white focus:border-indigo-500 focus:outline-none" />
        </div>
      </div>
      <div>
        <label className="block text-xs text-gray-400 mb-1">Address</label>
        <textarea rows={2} value={d.address ?? ""} onChange={e => set("address", e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm text-white focus:border-indigo-500 focus:outline-none resize-none" />
      </div>
      <div>
        <label className="block text-xs text-gray-400 mb-1">Google Maps Embed URL</label>
        <input value={d.maps_embed_url ?? ""} onChange={e => set("maps_embed_url", e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm text-white focus:border-indigo-500 focus:outline-none" placeholder="https://maps.google.com/maps?..." />
      </div>

      <div className="border-t border-gray-700 pt-4">
        <p className="text-xs font-medium text-gray-300 mb-3">Floating Contact Buttons</p>
        <div className="grid grid-cols-3 gap-3 mb-3">
          {(["whatsapp", "call", "email"] as const).map(btn => (
            <label key={btn} className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox"
                checked={d[`floating_${btn}` as keyof ContactDetail] as boolean ?? false}
                onChange={e => set(`floating_${btn}` as keyof ContactDetail, e.target.checked)}
                className="w-4 h-4 rounded" />
              <span className="text-sm text-gray-300 capitalize">{btn}</span>
            </label>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Position</label>
            <select value={d.floating_position ?? "bottom-right"} onChange={e => set("floating_position", e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm text-white focus:border-indigo-500 focus:outline-none">
              {["bottom-right", "bottom-left", "top-right", "top-left"].map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Button Color</label>
            <div className="flex gap-2">
              <input type="color" value={d.floating_color ?? "#25D366"} onChange={e => set("floating_color", e.target.value)}
                className="w-8 h-8 rounded cursor-pointer border-0" />
              <input value={d.floating_color ?? "#25D366"} onChange={e => set("floating_color", e.target.value)}
                className="flex-1 bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm text-white focus:border-indigo-500 focus:outline-none" />
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={d.is_primary ?? false} onChange={e => set("is_primary", e.target.checked)} className="w-4 h-4 rounded" />
          <span className="text-sm text-gray-300">Primary location</span>
        </label>
      </div>

      <div className="flex gap-2">
        <button onClick={save} disabled={saving}
          className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs px-3 py-1.5 rounded">
          {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />} Save
        </button>
        <button onClick={onCancel} className="flex items-center gap-1.5 bg-gray-700 hover:bg-gray-600 text-white text-xs px-3 py-1.5 rounded">
          <X className="w-3 h-3" /> Cancel
        </button>
      </div>
    </div>
  );
}

function SubmissionDrawer({ submission, formName, onClose, onRead }: {
  submission: Submission; formName: string; onClose: () => void; onRead: (id: string) => void;
}) {
  async function markRead() {
    await api("PATCH", { _type: "read_submission", id: submission.id });
    onRead(submission.id);
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="font-medium text-white">{formName}</p>
            <p className="text-xs text-gray-400">{new Date(submission.created_at).toLocaleString()}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <div className="space-y-3">
          {Object.entries(submission.data).map(([k, v]) => (
            <div key={k}>
              <p className="text-xs text-gray-500 uppercase tracking-wide">{k}</p>
              <p className="text-sm text-white mt-0.5">{String(v)}</p>
            </div>
          ))}
        </div>
        {!submission.read && (
          <button onClick={markRead} className="mt-4 flex items-center gap-2 text-xs text-indigo-400 hover:text-indigo-300">
            <Eye className="w-3.5 h-3.5" /> Mark as read
          </button>
        )}
      </div>
    </div>
  );
}

export default function ContactClient({ initialDetails, initialForms, initialSubmissions }: {
  initialDetails: ContactDetail[];
  initialForms: ContactForm[];
  initialSubmissions: Submission[];
}) {
  const [tab, setTab] = useState<"details" | "forms" | "inbox">("details");
  const [details, setDetails] = useState(initialDetails);
  const [forms, setForms] = useState(initialForms);
  const [submissions, setSubmissions] = useState(initialSubmissions);
  const [addingDetail, setAddingDetail] = useState(false);
  const [editingDetail, setEditingDetail] = useState<string | null>(null);
  const [viewingSub, setViewingSub] = useState<Submission | null>(null);
  const [addingForm, setAddingForm] = useState(false);
  const [newFormName, setNewFormName] = useState("");
  const [newFormEmail, setNewFormEmail] = useState("");
  const [savingForm, setSavingForm] = useState(false);

  const unread = submissions.filter(s => !s.read).length;

  async function deleteDetail(id: string) {
    if (!confirm("Delete this contact record?")) return;
    await api("DELETE", undefined, { type: "detail", id });
    setDetails(prev => prev.filter(d => d.id !== id));
  }

  async function deleteForm(id: string) {
    if (!confirm("Delete this form and all its submissions?")) return;
    await api("DELETE", undefined, { type: "form", id });
    setForms(prev => prev.filter(f => f.id !== id));
  }

  async function createForm() {
    if (!newFormName.trim()) return;
    setSavingForm(true);
    const res = await api("POST", { _type: "form", name: newFormName.trim(), recipient_email: newFormEmail || null, success_message: "Thank you! We will be in touch soon." });
    const data = await res.json();
    setSavingForm(false);
    setForms(prev => [...prev, data]);
    setNewFormName(""); setNewFormEmail(""); setAddingForm(false);
  }

  function handleDetailSaved(d: ContactDetail, isNew: boolean) {
    if (isNew) { setDetails(prev => [...prev, d]); setAddingDetail(false); }
    else { setDetails(prev => prev.map(x => x.id === d.id ? d : x)); setEditingDetail(null); }
  }

  return (
    <div className="p-6 max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Phone className="w-6 h-6 text-indigo-400" /> Contact Management
          </h1>
          <p className="text-sm text-gray-400 mt-1">Contact details, forms, and submission inbox.</p>
        </div>
      </div>

      <div className="flex gap-1 border-b border-gray-800">
        {(["details", "forms", "inbox"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize transition-colors relative ${tab === t ? "text-indigo-400 border-b-2 border-indigo-400" : "text-gray-400 hover:text-white"}`}>
            {t}
            {t === "inbox" && unread > 0 && (
              <span className="ml-1.5 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">{unread}</span>
            )}
          </button>
        ))}
      </div>

      {tab === "details" && (
        <div className="space-y-4">
          {details.map(d => (
            editingDetail === d.id ? (
              <DetailEditor key={d.id} detail={d}
                onSave={(u, isNew) => handleDetailSaved(u, isNew)} onCancel={() => setEditingDetail(null)} />
            ) : (
              <div key={d.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white">{d.label}</span>
                      {d.is_primary && <span className="text-xs bg-indigo-900/50 text-indigo-300 px-1.5 py-0.5 rounded">Primary</span>}
                    </div>
                    <div className="mt-2 space-y-1 text-sm text-gray-400">
                      {d.phone && <p className="flex items-center gap-2"><Phone className="w-3.5 h-3.5" /> {d.phone}</p>}
                      {d.whatsapp && <p className="flex items-center gap-2"><MessageSquare className="w-3.5 h-3.5 text-green-400" /> {d.whatsapp}</p>}
                      {d.email && <p className="flex items-center gap-2"><Mail className="w-3.5 h-3.5" /> {d.email}</p>}
                      {d.address && <p className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5" /> {d.address}</p>}
                    </div>
                    {(d.floating_whatsapp || d.floating_call || d.floating_email) && (
                      <p className="text-xs text-gray-500 mt-2">
                        Floating: {[d.floating_whatsapp && "WhatsApp", d.floating_call && "Call", d.floating_email && "Email"].filter(Boolean).join(", ")} · {d.floating_position}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setEditingDetail(d.id)} className="text-gray-400 hover:text-white p-1"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => deleteDetail(d.id)} className="text-gray-400 hover:text-red-400 p-1"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              </div>
            )
          ))}

          {addingDetail ? (
            <DetailEditor detail={{}} onSave={(d, isNew) => handleDetailSaved(d, isNew)} onCancel={() => setAddingDetail(false)} />
          ) : (
            <button onClick={() => setAddingDetail(true)}
              className="w-full flex items-center gap-2 border border-dashed border-gray-700 hover:border-indigo-500 rounded-xl px-4 py-3 text-sm text-gray-400 hover:text-indigo-400 transition-colors">
              <Plus className="w-4 h-4" /> Add Contact Location
            </button>
          )}
        </div>
      )}

      {tab === "forms" && (
        <div className="space-y-4">
          {forms.map(f => (
            <div key={f.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-white">{f.name}</p>
                {f.recipient_email && <p className="text-xs text-gray-400 mt-0.5">Sends to: {f.recipient_email}</p>}
                <p className="text-xs text-gray-500 mt-0.5">{submissions.filter(s => s.form_id === f.id).length} submissions</p>
              </div>
              <button onClick={() => deleteForm(f.id)} className="text-gray-400 hover:text-red-400 p-1"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}

          {addingForm ? (
            <div className="bg-gray-900 border border-indigo-500/40 rounded-xl p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Form Name *</label>
                  <input value={newFormName} onChange={e => setNewFormName(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm text-white focus:border-indigo-500 focus:outline-none" placeholder="Contact Form" />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Recipient Email</label>
                  <input value={newFormEmail} onChange={e => setNewFormEmail(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm text-white focus:border-indigo-500 focus:outline-none" placeholder="info@example.com" />
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={createForm} disabled={savingForm || !newFormName.trim()}
                  className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs px-3 py-1.5 rounded">
                  {savingForm ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />} Create
                </button>
                <button onClick={() => setAddingForm(false)} className="flex items-center gap-1.5 bg-gray-700 text-white text-xs px-3 py-1.5 rounded">
                  <X className="w-3 h-3" /> Cancel
                </button>
              </div>
            </div>
          ) : (
            <button onClick={() => setAddingForm(true)}
              className="w-full flex items-center gap-2 border border-dashed border-gray-700 hover:border-indigo-500 rounded-xl px-4 py-3 text-sm text-gray-400 hover:text-indigo-400 transition-colors">
              <Plus className="w-4 h-4" /> Create Contact Form
            </button>
          )}
        </div>
      )}

      {tab === "inbox" && (
        <div className="space-y-2">
          {submissions.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-gray-800 rounded-xl">
              <Inbox className="w-10 h-10 text-gray-700 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">No submissions yet.</p>
            </div>
          ) : submissions.map(s => {
            const form = forms.find(f => f.id === s.form_id);
            return (
              <button key={s.id} onClick={() => setViewingSub(s)}
                className={`w-full text-left flex items-center gap-3 p-3 rounded-lg border transition-colors ${s.read ? "border-gray-800 bg-gray-900/50" : "border-indigo-800/50 bg-indigo-950/20"}`}>
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${s.read ? "bg-gray-600" : "bg-indigo-400"}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{String(Object.values(s.data)[0] ?? "Submission")}</p>
                  <p className="text-xs text-gray-400">{form?.name ?? "Unknown Form"} · {new Date(s.created_at).toLocaleDateString()}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {viewingSub && (
        <SubmissionDrawer
          submission={viewingSub}
          formName={forms.find(f => f.id === viewingSub.form_id)?.name ?? "Form"}
          onClose={() => setViewingSub(null)}
          onRead={id => {
            setSubmissions(prev => prev.map(s => s.id === id ? { ...s, read: true } : s));
            setViewingSub(prev => prev ? { ...prev, read: true } : null);
          }}
        />
      )}
    </div>
  );
}
