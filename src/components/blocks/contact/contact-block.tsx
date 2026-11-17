"use client";

import React, { useEffect, useRef } from "react";
import { LeadFormTrap, useLeadForm } from "@/components/blocks/_primitives/lead-form";
import type { ContactBlockProps } from "@/types/cms";
import { cn } from "@/lib/utils";
import { useSiteContact, mapLinks } from "@/components/site/site-contact-context";
import { mapEmbedSrc } from "@/lib/maps/embed";
import { uiText } from "@/modules/page-builder/ui-text";
import { Mail, Phone, MapPin, Send, CheckCircle, Clock, MessageCircle, Paperclip, Loader2 } from "lucide-react";

export function ContactBlock({ block }: { block: ContactBlockProps }) {
  const { data } = block;
  // Built-in words (Call us, Sending…): the block's own text when set, else exactly the old text.
  const tx = uiText("contact", data);
  const site = useSiteContact();
  const waAfter = data.whatsappAfterSubmit?.enabled
    ? { number: data.whatsappAfterSubmit.number || data.whatsapp || site.whatsapp || site.phone || "", intro: data.whatsappAfterSubmit.intro }
    : null;
  const { values, setValues, setSubmitted, submitted, loading, uploading, error, upload, toggle, handleSubmit, whatsappUrl } =
    useLeadForm(data.fields, { recipientEmail: data.recipientEmail, formName: data.title || "Contact", whatsappAfter: waAfter?.number ? waAfter : null });
  const rootRef = useRef<HTMLDivElement>(null);
  const quotePrefix = tx("quotePrefillText");

  // Deep-link prefill: a link to "#<anchor>?service=X&item=Y" (e.g. a
  // "tap to get a quote" item on a service page) scrolls to this form,
  // selects service X in the first select whose options include it, and
  // starts the message with item Y. A plain "#<anchor>" just scrolls.
  useEffect(() => {
    const anchor = block.anchor;
    if (!anchor) return;
    function apply() {
      // Split before decoding: an encoded "&" (%26) inside a value must not
      // become a parameter separator. URLSearchParams decodes each value.
      const raw = window.location.hash.slice(1);
      const cut = raw.indexOf("?");
      const name = decodeURIComponent(cut < 0 ? raw : raw.slice(0, cut));
      const query = cut < 0 ? "" : raw.slice(cut + 1);
      if (name !== anchor) return;
      const q = new URLSearchParams(query);
      const service = q.get("service");
      const item = q.get("item");
      if (service || item) {
        setSubmitted(false);
        setValues((v) => {
          const next = { ...v };
          const sel = service ? data.fields.find((f) => f.type === "select" && f.options?.includes(service)) : undefined;
          if (sel && service) next[sel.id] = service;
          const msg = data.fields.find((f) => f.type === "textarea");
          if (msg && item) next[msg.id] = `${quotePrefix} ${item}\n\n`;
          return next;
        });
      }
      rootRef.current?.closest("[data-pc-id]")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    apply();
    // A next/link click changes the hash with pushState, which fires no
    // hashchange and sent the page to the top because "quote?service=X" is no
    // element's id. Take clicks on links to this form before the router does.
    function onClick(e: MouseEvent) {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
      const href = (e.target as Element | null)?.closest?.("a[href^='#']")?.getAttribute("href");
      if (!href || (href !== `#${anchor}` && !href.startsWith(`#${anchor}?`))) return;
      e.preventDefault();
      e.stopPropagation();
      window.history.pushState(null, "", href);
      apply();
    }
    window.addEventListener("hashchange", apply);
    document.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("hashchange", apply);
      document.removeEventListener("click", onClick, true);
    };
  }, [block.anchor, data.fields, quotePrefix, setSubmitted, setValues]);
  // "filled": WooCommerce/Divi-style form — grey filled boxes, placeholders
  // instead of labels, no card frame, pill submit button on the right.
  const filled = data.formStyle === "filled";
  const inputCls = cn(filled
    ? "w-full border-0 bg-muted rounded-none px-4 py-3.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
    : "w-full border border-input bg-background rounded-lg px-3.5 py-2.5 text-sm transition-shadow focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/15",
    data.largeInputs && "min-h-12 text-base");
  const form = (
    <div className={cn("flex-1 w-full min-w-0", !filled && "rounded-2xl border bg-card text-card-foreground shadow-lg p-6 sm:p-8")}>
      {(data.title || data.subtitle) && data.layout !== "split" && (
        <div className={cn("mb-8", data.layout === "centered" ? "text-center" : "")}>
          {data.title && <h2 className="text-3xl font-bold mb-3">{data.title}</h2>}
          {data.subtitle && <p className="text-muted-foreground">{data.subtitle}</p>}
        </div>
      )}
      {submitted ? (
        <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
          <CheckCircle className="w-12 h-12 text-green-500" />
          <p className="font-semibold text-lg">{data.successMessage || "Message sent!"}</p>
          {whatsappUrl && (
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" data-pc-wa-after=""
              className="mt-2 inline-flex items-center gap-2 rounded-lg bg-[#25D366] text-white px-5 py-3 text-sm font-semibold hover:opacity-90">
              <MessageCircle className="w-4 h-4" />{` ${tx("whatsappContinueLabel")}`}
            </a>
          )}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className={cn("grid min-w-0 gap-4 [&>*]:min-w-0", filled && "sm:grid-cols-2")}>
          <LeadFormTrap />
          {data.fields.map(f => (
            <div key={f.id} className={cn(filled && (f.type === "textarea" ? "sm:col-span-2" : ""))}>
              {(!filled || f.type === "date") && <label className={cn("block text-sm font-medium mb-1", filled && "text-muted-foreground font-normal")}>{f.label}{f.required && <span className="text-red-500 ml-0.5">*</span>}</label>}
              {f.type === "textarea" ? (
                <textarea
                  required={f.required}
                  rows={filled ? 6 : 4}
                  placeholder={filled ? f.label : undefined}
                  aria-label={f.label}
                  value={values[f.id] ?? ""}
                  onChange={e => setValues(v => ({ ...v, [f.id]: e.target.value }))}
                  className={cn(inputCls, "resize-y")}
                />
              ) : f.type === "checkboxes" ? (
                <div className={cn("grid gap-2 sm:grid-cols-2", filled && "bg-muted p-3")} role="group" aria-label={f.label}>
                  {filled && <span className="sm:col-span-2 text-sm text-muted-foreground">{f.label}</span>}
                  {(f.options ?? []).map((o) => (
                    <label key={o} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="checkbox" className="w-4 h-4 accent-[hsl(var(--primary))]" checked={(values[f.id] ?? "").split(", ").includes(o)} onChange={() => toggle(f.id, o)} />
                      {o}
                    </label>
                  ))}
                </div>
              ) : f.type === "file" ? (
                <label className={cn(inputCls, "flex min-w-0 items-center gap-2 cursor-pointer text-muted-foreground")}>
                  {uploading === f.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
                  <span className="min-w-0 flex-1 truncate">{values[f.id] ? values[f.id].split(" — ")[0] : filled ? f.label : tx("filePlaceholder")}</span>
                  <input type="file" className="sr-only" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp,.txt" onChange={(e) => upload(f.id, e.target.files?.[0])} />
                </label>
              ) : f.type === "select" ? (
                <select
                  required={f.required}
                  value={values[f.id] ?? ""}
                  onChange={e => setValues(v => ({ ...v, [f.id]: e.target.value }))}
                  className={inputCls}
                >
                  <option value="">{tx("selectPlaceholder")}</option>
                  {f.options?.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              ) : (
                <input
                  type={f.type}
                  required={f.required}
                  placeholder={filled ? f.label : undefined}
                  aria-label={f.label}
                  value={values[f.id] ?? ""}
                  onChange={e => setValues(v => ({ ...v, [f.id]: e.target.value }))}
                  className={inputCls}
                />
              )}
            </div>
          ))}
          {error && <p className={cn("text-sm text-red-500", filled && "sm:col-span-2")}>{error}</p>}
          <button
            type="submit"
            disabled={loading || !!uploading}
            className={cn(
              "w-full sm:w-auto justify-center flex items-center gap-2 bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-50",
              filled ? "sm:col-span-2 sm:justify-self-end px-10 py-3.5 rounded-full uppercase tracking-wide hover:opacity-90" : "px-7 py-3 rounded-lg shadow-primary hover:-translate-y-0.5 transition-transform",
            )}
          >
            {!filled && <Send className="w-4 h-4" />}
            {loading ? tx("sendingLabel") : data.submitLabel || "Send Message"}
          </button>
        </form>
      )}
    </div>
  );

  const whatsappDigits = data.whatsapp?.replace(/[^\d]/g, "");
  const rows: { id: string; icon: React.ElementType; label: string; value: string; href?: string }[] = [
    ...(data.phone ? [{ id: "phone", icon: Phone, label: tx("callLabel"), value: data.phone, href: `tel:${data.phone.replace(/[^+\d]/g, "")}` }] : []),
    ...(data.email ? [{ id: "email", icon: Mail, label: tx("emailLabel"), value: data.email, href: `mailto:${data.email}` }] : []),
    ...(data.address ? [{ id: "address", icon: MapPin, label: tx("visitLabel"), value: data.address }] : []),
    ...(data.hours ? [{ id: "hours", icon: Clock, label: tx("hoursLabel"), value: data.hours }] : []),
  ];
  const split = data.layout === "split";
  // Map: the saved map (Map location control, or any Google Maps link /
  // embed code pasted before it existed, see mapEmbedSrc for the exact
  // rules); otherwise a search for the address, so "Show map" always shows
  // something. Embed URLs saved before render the same string as always.
  const savedMap = mapEmbedSrc(data.mapEmbedUrl, data.mapLocation, { fallbackQuery: data.address || site.address });
  const mapUrl = data.showMap ? savedMap ?? mapLinks(data.address || site.address)?.embed : undefined;
  const hideForm = !!data.hideForm;
  // Map height (px) from the settings; unset keeps each layout's own size.
  const mapH = typeof data.mapHeight === "number" && data.mapHeight > 0 ? data.mapHeight : undefined;
  const mapFrame = (cls: string, fixedCls: string) => mapUrl ? (
    <div className={cn("rounded-xl overflow-hidden border", mapH ? fixedCls : cls)} style={mapH ? { height: mapH } : undefined}>
      <iframe src={mapUrl} title="Map" className="w-full h-full border-0" allowFullScreen loading="lazy" />
    </div>
  ) : null;

  // Details panel. In the split layout it's a tinted brand panel carrying
  // the heading, so the section reads as designed even before any details
  // are filled in (the settings panel can pull them from the business profile).
  const infoPanel = data.showContactInfo && (
    <div className={cn("min-w-0", split && "rounded-2xl bg-primary/[0.06] border border-primary/10 p-6 sm:p-8 flex flex-col")}>
      {data.title && split && <h2 className="text-3xl font-bold mb-3">{data.title}</h2>}
      {data.subtitle && split && <p className="text-muted-foreground mb-8">{data.subtitle}</p>}
      {rows.length > 0 && (
        <div className="grid gap-5 min-w-0 [&>*]:min-w-0">
          {rows.map(({ id, icon: Icon, label, value, href }) => {
            const inner = (
              <>
                <span className="w-11 h-11 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shrink-0 shadow-sm">
                  <Icon className="w-5 h-5" />
                </span>
                <span className="min-w-0">
                  <span className="block text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
                  <span className="block font-medium break-words [overflow-wrap:anywhere]">{value}</span>
                </span>
              </>
            );
            return href ? (
              <a key={id} href={href} className="flex items-center gap-4 hover:text-primary transition-colors">{inner}</a>
            ) : (
              <div key={id} className="flex items-center gap-4">{inner}</div>
            );
          })}
        </div>
      )}
      {whatsappDigits && (
        <a
          href={`https://wa.me/${whatsappDigits}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-flex items-center justify-center gap-2 rounded-lg bg-[#25D366] text-white px-5 py-3 text-sm font-semibold hover:opacity-90 transition-opacity self-start"
        >
          <MessageCircle className="w-4 h-4" />{` ${tx("whatsappLabel")}`}
        </a>
      )}
      {data.note && <p className="mt-6 text-sm text-muted-foreground">{data.note}</p>}
      {!hideForm && mapFrame("mt-6 aspect-video", "mt-6")}
    </div>
  );
  // Details + map, no form: details beside a tall map (stacked on phones).
  if (hideForm) {
    const map = mapFrame("min-h-[320px] h-full", "");
    return (
      <div ref={rootRef} className="max-w-5xl mx-auto px-4 sm:px-0">
        {(data.title || data.subtitle) && !(split && infoPanel) && (
          <div className={cn("mb-8", data.layout === "centered" && "text-center")}>
            {data.title && <h2 className="text-3xl font-bold mb-3">{data.title}</h2>}
            {data.subtitle && <p className="text-muted-foreground">{data.subtitle}</p>}
          </div>
        )}
        <div className={cn("grid gap-8 lg:gap-12 items-stretch [&>*]:min-w-0", infoPanel && map && "md:grid-cols-2")}>
          {infoPanel}
          {map}
        </div>
      </div>
    );
  }
  // Map on with contact details off: the map takes the details' place.
  const side = infoPanel || mapFrame(split ? "min-h-[320px] h-full" : "aspect-video w-full", split ? "" : "w-full");

  return (
    <div ref={rootRef} className={cn("max-w-5xl mx-auto px-4 sm:px-0", data.layout === "centered" && "max-w-2xl")}>
      {data.layout === "split" ? (
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12 items-stretch [&>*]:min-w-0">
          {side}
          {form}
        </div>
      ) : data.layout === "left" ? (
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12 items-start [&>*]:min-w-0">
          {form}
          {side}
        </div>
      ) : (
        <div className="flex flex-col items-center">
          {side && <div className="w-full mb-8">{side}</div>}
          {form}
        </div>
      )}
    </div>
  );
}
