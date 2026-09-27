"use client";

import React, { useState } from "react";
import { MessageCircle, Phone, FileDown, X, ChevronLeft, ChevronRight, Images, BadgeCheck } from "lucide-react";
import { GenericMap } from "@/components/map/generic-map";
import { LeadForm, logWhatsappClick, PrefsToggle, useDisplayPrefs } from "@/components/blocks/real-estate/shared";
import { priceLabel, areaLabel, convertPrice, formatMoney, type ReProperty } from "@/lib/real-estate/format";

export interface AgentInfo {
  agent_name: string | null; agent_title: string | null; agent_photo: string | null;
  whatsapp: string | null; phone: string | null; licence_text: string | null; brochure_gate: boolean;
}

export function Gallery({ images, title }: { images: string[]; title: string }) {
  const [open, setOpen] = useState<number | null>(null);
  if (!images.length) return null;
  const show = images.slice(0, 5);
  const go = (d: number) => setOpen((i) => (i == null ? i : (i + d + images.length) % images.length));

  return (
    <>
      <div className="grid gap-2 grid-cols-4 grid-rows-2 h-[300px] sm:h-[460px] rounded-3xl overflow-hidden relative">
        {show.map((src, i) => (
          <button key={i} type="button" onClick={() => setOpen(i)}
            className={`relative overflow-hidden bg-muted ${i === 0 ? "col-span-4 row-span-2 sm:col-span-2" : "hidden sm:block"}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt={`${title} ${i + 1}`} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
          </button>
        ))}
        <button type="button" onClick={() => setOpen(0)} className="absolute bottom-4 right-4 px-4 py-2 rounded-full bg-background/95 text-foreground text-sm font-medium shadow flex items-center gap-2">
          <Images className="w-4 h-4" />{images.length} photos
        </button>
      </div>
      {open != null && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center" onClick={() => setOpen(null)}>
          <button type="button" className="absolute top-4 right-4 p-2 text-white" onClick={() => setOpen(null)}><X className="w-7 h-7" /></button>
          <button type="button" className="absolute left-2 sm:left-6 p-3 text-white" onClick={(e) => { e.stopPropagation(); go(-1); }}><ChevronLeft className="w-8 h-8" /></button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={images[open]} alt="" className="max-h-[85vh] max-w-[90vw] object-contain" onClick={(e) => e.stopPropagation()} />
          <button type="button" className="absolute right-2 sm:right-6 p-3 text-white" onClick={(e) => { e.stopPropagation(); go(1); }}><ChevronRight className="w-8 h-8" /></button>
          <p className="absolute bottom-5 text-white/70 text-sm">{open + 1} / {images.length}</p>
        </div>
      )}
    </>
  );
}

export function PriceHeader({ p }: { p: ReProperty }) {
  const prefs = useDisplayPrefs({ currency: p.currency, unit: p.area_unit });
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <p className="text-3xl sm:text-4xl font-bold text-primary">{priceLabel(p, prefs.currency, false)}</p>
        {p.area != null && p.price != null && !p.price_on_request && p.listing_type !== "rent" && (
          <p className="text-sm text-muted-foreground mt-1">
            ≈ {formatMoney((convertPrice(Number(p.price), p.currency, prefs.currency) ?? Number(p.price)) / (prefs.unit === p.area_unit ? Number(p.area) : prefs.unit === "sqft" ? Number(p.area) * 10.7639 : Number(p.area) / 10.7639), prefs.currency)} per {prefs.unit} · {areaLabel(p.area, p.area_unit, prefs.unit)}
          </p>
        )}
      </div>
      <PrefsToggle prefs={prefs} />
    </div>
  );
}

export function PaymentPlan({ plan }: { plan: { label: string; percent: number }[] }) {
  if (!plan?.length) return null;
  return (
    <div>
      <div className="flex h-3 rounded-full overflow-hidden bg-muted">
        {plan.map((s, i) => <div key={i} style={{ width: `${s.percent}%`, opacity: 1 - i * (0.6 / plan.length) }} className="bg-primary" />)}
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {plan.map((s, i) => (
          <div key={i} className="rounded-2xl border bg-card p-4">
            <p className="text-3xl font-bold text-primary">{s.percent}%</p>
            <p className="text-sm text-muted-foreground mt-1">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function LocationMap({ lat, lng, title }: { lat: number; lng: number; title: string }) {
  return (
    <div className="rounded-2xl overflow-hidden border">
      <GenericMap height={340} defaultCenter={{ lat, lng }} defaultZoom={14}
        pins={[{ id: "p", lat, lng, label: title, render: () => <p className="text-black text-sm font-medium">{title}</p> }]} />
    </div>
  );
}

export function AgentCard({ p, agent, siteName }: { p: ReProperty; agent: AgentInfo; siteName: string }) {
  const [brochureMode, setBrochureMode] = useState(false);
  const [brochureUrl, setBrochureUrl] = useState<string | null>(null);
  const url = typeof window !== "undefined" ? window.location.href : "";
  const waNumber = (agent.whatsapp ?? "").replace(/[^\d]/g, "");
  const wa = waNumber.length >= 8
    ? `https://wa.me/${waNumber}?text=${encodeURIComponent(`Hi, I'm interested in "${p.title}"${p.reference ? ` (Ref ${p.reference})` : ""}. ${url}`)}`
    : null;
  const tel = (agent.phone || agent.whatsapp || "").replace(/[^\d+]/g, "");

  return (
    <div className="bg-card border rounded-3xl shadow-xl p-6 space-y-5">
      <div className="flex items-center gap-3">
        {agent.agent_photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={agent.agent_photo} alt="" className="w-14 h-14 rounded-full object-cover" />
        ) : (
          <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xl font-bold">{(agent.agent_name ?? siteName).charAt(0)}</div>
        )}
        <div>
          <p className="font-semibold flex items-center gap-1">{agent.agent_name ?? siteName}<BadgeCheck className="w-4 h-4 text-primary" /></p>
          <p className="text-sm text-muted-foreground">{agent.agent_title ?? "Property Advisor"}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {wa && (
          <a href={wa} target="_blank" rel="noreferrer" onClick={() => logWhatsappClick(p.id)}
            className="h-12 rounded-xl bg-[#25D366] text-white font-semibold flex items-center justify-center gap-2 hover:opacity-90">
            <MessageCircle className="w-5 h-5" />WhatsApp
          </a>
        )}
        {tel && (
          <a href={`tel:${tel}`} className={`h-12 rounded-xl border font-semibold flex items-center justify-center gap-2 hover:bg-muted ${wa ? "" : "col-span-2"}`}>
            <Phone className="w-5 h-5" />Call
          </a>
        )}
      </div>

      {p.brochure_url && (
        brochureUrl ? (
          <a href={brochureUrl} target="_blank" rel="noreferrer" className="h-11 rounded-xl bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2"><FileDown className="w-4 h-4" />Open brochure</a>
        ) : !agent.brochure_gate ? (
          <a href={p.brochure_url} target="_blank" rel="noreferrer" className="h-11 rounded-xl border font-semibold flex items-center justify-center gap-2 hover:bg-muted"><FileDown className="w-4 h-4" />Download brochure</a>
        ) : !brochureMode ? (
          <button type="button" onClick={() => setBrochureMode(true)} className="w-full h-11 rounded-xl border font-semibold flex items-center justify-center gap-2 hover:bg-muted"><FileDown className="w-4 h-4" />Download brochure</button>
        ) : null
      )}

      <div className="border-t pt-5">
        {brochureMode && !brochureUrl ? (
          <>
            <p className="font-semibold mb-3">Get the brochure</p>
            <LeadForm kind="brochure" propertyId={p.id} submitLabel="Send me the brochure" showMessage={false} compact
              successMessage="Your brochure is ready above." onBrochure={(u) => setBrochureUrl(u)} />
          </>
        ) : (
          <>
            <p className="font-semibold mb-3">Request details or a viewing</p>
            <LeadForm kind="enquiry" propertyId={p.id} submitLabel="Send enquiry" compact
              defaultMessage={`I'm interested in ${p.title}. Please share more details.`} />
          </>
        )}
      </div>

      {(p.permit_number || agent.licence_text) && (
        <p className="text-[11px] text-muted-foreground border-t pt-4">
          {p.permit_number && <>Ad permit: {p.permit_number}<br /></>}
          {agent.licence_text}
        </p>
      )}
    </div>
  );
}
