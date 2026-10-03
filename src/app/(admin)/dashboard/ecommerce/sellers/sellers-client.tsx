"use client";

import { useState } from "react";
import {
  Store, Plus, X, Loader2, Phone, Mail, CheckCircle2, Ban, Clock, Percent, MapPin, Search,
} from "lucide-react";
import { useT } from "@/lib/i18n/language-provider";

export interface Seller {
  id: string;
  name: string;
  slug: string | null;
  contact_name: string | null;
  phone: string | null;
  email: string | null;
  status: "pending" | "approved" | "suspended";
  commission_rate: number;
  logo: string | null;
  description: string | null;
  bkash_number: string | null;
  payout_hold_days: number;
  pickup_address: string | null;
  pickup_area: string | null;
  trade_license: string | null;
  created_at: string;
}

type TFn = ReturnType<typeof useT>;
function statusMeta(t: TFn): Record<Seller["status"], { label: string; cls: string }> {
  return {
    pending: { label: t("sellers.statusPending"), cls: "bg-yellow-900/50 text-yellow-300 border-yellow-700/50" },
    approved: { label: t("sellers.statusApproved"), cls: "bg-green-900/50 text-green-300 border-green-700/50" },
    suspended: { label: t("sellers.statusSuspended"), cls: "bg-red-900/50 text-red-300 border-red-700/50" },
  };
}

const inputCls =
  "w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/40";
const btnPrimary =
  "inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50";
const btnGhost =
  "inline-flex items-center gap-2 border border-border hover:bg-muted text-foreground/80 px-3 py-2 rounded-lg text-sm transition-colors";

function NewSellerModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (s: Seller) => void;
}) {
  const t = useT();
  const [f, setF] = useState({
    name: "", contact_name: "", phone: "", email: "", description: "",
    pickup_address: "", pickup_area: "Dhaka", bkash_number: "", trade_license: "",
    commission_rate: "15",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    if (!f.name.trim()) { setError(t("sellers.shopNameRequired")); return; }
    setSaving(true); setError(null);
    const res = await fetch("/api/marketplace-ecom/vendors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(f),
    });
    const d = await res.json();
    setSaving(false);
    if (!res.ok) { setError(d.error ?? t("sellers.failedToCreate")); return; }
    onCreated(d);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-background border border-border rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">{t("sellers.newSellerTitle")}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground/80">
            <X className="w-5 h-5" />
          </button>
        </div>

        <input className={inputCls} placeholder={t("sellers.shopNamePlaceholder")}
          value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
        <div className="grid grid-cols-2 gap-2">
          <input className={inputCls} placeholder={t("sellers.ownerNamePlaceholder")}
            value={f.contact_name} onChange={(e) => setF({ ...f, contact_name: e.target.value })} />
          <input className={inputCls} placeholder={t("sellers.phonePlaceholder")}
            value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
        </div>
        <input className={inputCls} placeholder={t("sellers.emailPlaceholder")}
          value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
        <textarea className={inputCls} rows={2} placeholder={t("sellers.descriptionPlaceholder")}
          value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />
        <input className={inputCls} placeholder={t("sellers.pickupAddressPlaceholder")}
          value={f.pickup_address} onChange={(e) => setF({ ...f, pickup_address: e.target.value })} />
        <div className="grid grid-cols-2 gap-2">
          <input className={inputCls} placeholder={t("sellers.pickupAreaPlaceholder")}
            value={f.pickup_area} onChange={(e) => setF({ ...f, pickup_area: e.target.value })} />
          <input className={inputCls} placeholder={t("sellers.bkashPlaceholder")}
            value={f.bkash_number} onChange={(e) => setF({ ...f, bkash_number: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <input className={inputCls} placeholder={t("sellers.tradeLicensePlaceholder")}
            value={f.trade_license} onChange={(e) => setF({ ...f, trade_license: e.target.value })} />
          <input className={inputCls} type="number" placeholder={t("sellers.commissionPlaceholder")}
            value={f.commission_rate} onChange={(e) => setF({ ...f, commission_rate: e.target.value })} />
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}
        <div className="flex justify-end gap-2 pt-1">
          <button onClick={onClose} className={btnGhost}>{t("sellers.cancel")}</button>
          <button onClick={save} disabled={saving} className={btnPrimary}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {t("sellers.createSeller")}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SellersClient({ initialSellers }: { initialSellers: Seller[] }) {
  const t = useT();
  const [sellers, setSellers] = useState<Seller[]>(initialSellers);
  const [showNew, setShowNew] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | Seller["status"]>("all");

  async function patch(id: string, fields: Partial<Seller>) {
    setBusy(id);
    const res = await fetch("/api/marketplace-ecom/vendors", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...fields }),
    });
    const d = await res.json();
    setBusy(null);
    if (res.ok) setSellers((prev) => prev.map((s) => (s.id === id ? { ...s, ...d } : s)));
  }

  const shown = sellers.filter((s) => {
    if (filter !== "all" && s.status !== filter) return false;
    if (!q.trim()) return true;
    const needle = q.toLowerCase();
    return (
      s.name.toLowerCase().includes(needle) ||
      (s.phone ?? "").includes(needle) ||
      (s.contact_name ?? "").toLowerCase().includes(needle)
    );
  });

  const counts = {
    all: sellers.length,
    pending: sellers.filter((s) => s.status === "pending").length,
    approved: sellers.filter((s) => s.status === "approved").length,
    suspended: sellers.filter((s) => s.status === "suspended").length,
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Store className="w-6 h-6 text-primary" /> {t("sellers.title")}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t("sellers.subtitle")}
          </p>
        </div>
        <button onClick={() => setShowNew(true)} className={btnPrimary}>
          <Plus className="w-4 h-4" /> {t("sellers.addSeller")}
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {(["all", "pending", "approved", "suspended"] as const).map((k) => {
          const label = k === "all" ? t("sellers.filterAll") : statusMeta(t)[k].label;
          return (
            <button
              key={k}
              onClick={() => setFilter(k)}
              className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                filter === k
                  ? "bg-indigo-600 border-primary text-white"
                  : "border-border text-muted-foreground hover:bg-muted"
              }`}
            >
              {label} ({counts[k]})
            </button>
          );
        })}
        <div className="relative ml-auto">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            className={`${inputCls} pl-9 w-64`}
            placeholder={t("sellers.searchPlaceholder")}
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </div>

      {shown.length === 0 ? (
        <div className="border border-border rounded-xl p-10 text-center text-muted-foreground">
          {t("sellers.noSellersYet")}
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {shown.map((s) => {
            const meta = statusMeta(t)[s.status];
            return (
              <div key={s.id} className="border border-border rounded-xl p-4 bg-card space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-foreground truncate">{s.name}</h3>
                    {s.slug && <p className="text-xs text-muted-foreground truncate">/shop/{s.slug}</p>}
                  </div>
                  <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full border ${meta.cls}`}>
                    {meta.label}
                  </span>
                </div>

                {s.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">{s.description}</p>
                )}

                <div className="space-y-1 text-sm text-muted-foreground">
                  {s.contact_name && <p className="truncate">{s.contact_name}</p>}
                  {s.phone && (
                    <p className="flex items-center gap-2 truncate">
                      <Phone className="w-3.5 h-3.5 shrink-0" /> {s.phone}
                    </p>
                  )}
                  {s.email && (
                    <p className="flex items-center gap-2 truncate">
                      <Mail className="w-3.5 h-3.5 shrink-0" /> {s.email}
                    </p>
                  )}
                  {s.pickup_area && (
                    <p className="flex items-center gap-2 truncate">
                      <MapPin className="w-3.5 h-3.5 shrink-0" /> {s.pickup_area}
                    </p>
                  )}
                  <p className="flex items-center gap-2">
                    <Percent className="w-3.5 h-3.5 shrink-0" /> {Number(s.commission_rate)}{t("sellers.commissionSuffix")}
                    <span className="text-muted-foreground">·</span>
                    <Clock className="w-3.5 h-3.5 shrink-0" /> {s.payout_hold_days}{t("sellers.holdSuffix")}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  {s.status !== "approved" && (
                    <button
                      onClick={() => patch(s.id, { status: "approved" })}
                      disabled={busy === s.id}
                      className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-green-900/40 border border-green-700/50 text-green-300 hover:bg-green-900/60 disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> {t("sellers.approve")}
                    </button>
                  )}
                  {s.status !== "suspended" && (
                    <button
                      onClick={() => patch(s.id, { status: "suspended" })}
                      disabled={busy === s.id}
                      className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-red-900/40 border border-red-700/50 text-red-300 hover:bg-red-900/60 disabled:opacity-50"
                    >
                      <Ban className="w-3.5 h-3.5" /> {t("sellers.suspend")}
                    </button>
                  )}
                  <label className="inline-flex items-center gap-1.5 text-xs text-muted-foreground ml-auto">
                    {t("sellers.commissionLabel")}
                    <input
                      type="number"
                      defaultValue={Number(s.commission_rate)}
                      onBlur={(e) => {
                        const v = Number(e.target.value);
                        if (v !== Number(s.commission_rate)) patch(s.id, { commission_rate: v });
                      }}
                      className="w-16 bg-muted border border-border rounded px-2 py-1 text-foreground text-xs"
                    />
                    %
                  </label>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showNew && (
        <NewSellerModal
          onClose={() => setShowNew(false)}
          onCreated={(s) => setSellers((prev) => [s, ...prev])}
        />
      )}
    </div>
  );
}
