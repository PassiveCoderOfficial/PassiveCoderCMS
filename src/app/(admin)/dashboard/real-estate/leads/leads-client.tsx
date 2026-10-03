"use client";

import { useMemo, useState } from "react";
import { MessageCircle, Mail, FileDown, Home, CalendarCheck, Calculator, Inbox } from "lucide-react";

interface Lead {
  id: string; kind: string; name: string | null; phone: string | null; email: string | null; message: string | null;
  budget: string | null; status: string; created_at: string; property: { title: string; slug: string } | null;
}

const KIND_META: Record<string, { label: string; icon: typeof Inbox }> = {
  enquiry: { label: "Enquiry", icon: Home },
  brochure: { label: "Brochure", icon: FileDown },
  valuation: { label: "Valuation", icon: Calculator },
  viewing: { label: "Viewing", icon: CalendarCheck },
  consultation: { label: "Consultation", icon: Inbox },
  whatsapp: { label: "WhatsApp click", icon: MessageCircle },
};
const STATUSES = ["new", "contacted", "qualified", "won", "lost"];

export function LeadsClient({ initial }: { initial: Lead[] }) {
  const [leads, setLeads] = useState(initial);
  const [kind, setKind] = useState("");

  const counts = useMemo(() => {
    const m: Record<string, number> = {};
    for (const l of leads) m[l.kind] = (m[l.kind] ?? 0) + 1;
    return m;
  }, [leads]);
  const shown = kind ? leads.filter((l) => l.kind === kind) : leads.filter((l) => l.kind !== "whatsapp");

  const setStatus = async (id: string, status: string) => {
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)));
    await fetch("/api/real-estate/leads", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status }) });
  };

  const wa = (phone: string, l: Lead) =>
    `https://wa.me/${phone.replace(/[^\d]/g, "")}?text=${encodeURIComponent(`Hi ${l.name ?? ""}, thanks for your interest${l.property ? ` in ${l.property.title}` : ""}.`)}`;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Property Leads</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Every enquiry, brochure download and consultation request. Also saved to your CRM contacts.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button onClick={() => setKind("")} className={`px-3 py-1.5 rounded-full text-sm border ${kind === "" ? "bg-indigo-600 border-primary text-white" : "border-border text-foreground/80"}`}>
          All leads ({leads.filter((l) => l.kind !== "whatsapp").length})
        </button>
        {Object.entries(KIND_META).map(([k, m]) => counts[k] ? (
          <button key={k} onClick={() => setKind(k)} className={`px-3 py-1.5 rounded-full text-sm border flex items-center gap-1.5 ${kind === k ? "bg-indigo-600 border-primary text-white" : "border-border text-foreground/80"}`}>
            <m.icon className="w-3.5 h-3.5" />{m.label} ({counts[k]})
          </button>
        ) : null)}
      </div>

      {shown.length === 0 ? (
        <div className="text-center py-16 bg-card border border-border rounded-2xl text-muted-foreground">No leads yet. They appear here the moment a visitor submits a form.</div>
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-muted-foreground uppercase border-b border-border">
              <tr>
                <th className="text-left px-4 py-3">Lead</th><th className="text-left px-4 py-3">Type</th><th className="text-left px-4 py-3">Property</th>
                <th className="text-left px-4 py-3">Message</th><th className="text-left px-4 py-3">Status</th><th className="text-left px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {shown.map((l) => {
                const M = KIND_META[l.kind] ?? KIND_META.enquiry;
                return (
                  <tr key={l.id} className="align-top">
                    <td className="px-4 py-3">
                      <p className="text-foreground font-medium">{l.name ?? (l.kind === "whatsapp" ? "Anonymous visitor" : "—")}</p>
                      <div className="flex gap-3 mt-1">
                        {l.phone && <a href={wa(l.phone, l)} target="_blank" rel="noreferrer" className="text-green-400 hover:text-green-300 text-xs flex items-center gap-1"><MessageCircle className="w-3 h-3" />{l.phone}</a>}
                        {l.email && <a href={`mailto:${l.email}`} className="text-primary text-xs flex items-center gap-1"><Mail className="w-3 h-3" />{l.email}</a>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-foreground/80 whitespace-nowrap"><span className="flex items-center gap-1.5"><M.icon className="w-3.5 h-3.5" />{M.label}</span></td>
                    <td className="px-4 py-3">{l.property ? <a href={`/properties/${l.property.slug}`} target="_blank" rel="noreferrer" className="text-primary hover:underline">{l.property.title}</a> : <span className="text-muted-foreground">—</span>}</td>
                    <td className="px-4 py-3 text-foreground/80 max-w-xs">
                      {l.budget && <span className="block text-xs text-amber-300">Budget: {l.budget}</span>}
                      <span className="line-clamp-3">{l.message}</span>
                    </td>
                    <td className="px-4 py-3">
                      {l.kind !== "whatsapp" && (
                        <select value={l.status} onChange={(e) => setStatus(l.id, e.target.value)} className="bg-muted border border-border rounded-lg px-2 py-1 text-xs text-foreground">
                          {STATUSES.map((s) => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}
                        </select>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">{new Date(l.created_at).toLocaleString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
