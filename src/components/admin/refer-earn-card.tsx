"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Gift, Copy, Check, BadgeDollarSign, Loader2, ArrowRight, PenLine } from "lucide-react";
import { useLanguage } from "@/lib/i18n/language-provider";
import { useWhiteLabel } from "@/components/admin/white-label-context";

/**
 * Partner card on the dashboard (2026-10-18; reseller-only since 2026-10-26).
 * No referral link or referral credit any more: anyone who brings a client
 * does it as a reseller. Paying clients turn on reseller in one click;
 * others apply. Credit earned before 2026-10-26 shows only while some is
 * left. Hidden for white-label clients and on resold sites (API says so).
 */
type Card = {
  show: boolean; resellerLink?: string | null; reseller?: boolean;
  credit?: { available: { BDT: number; USD: number }; pending: { BDT: number; USD: number } };
  canTurnOnReseller?: boolean; resellerPending?: boolean; code?: string | null; customCode?: string | null;
};

const TXT = {
  en: {
    title: "Resell websites with Passive Coder", sub: "Bring a client, sell at our list price (or your own with white-label), keep your margin. You pay partner prices: 30% below list for builds, 15% off renewals and Care.",
    copy: "Copy link", copied: "Copied", credit: "Credit you earned before Oct 2026", creditHint: "Spend it on your website at checkout. It expires as shown in your partner account.", pending: "pending",
    resTitle: "Resell websites at partner prices", resSub: "You are a paying client, so you can turn on reseller now. No application. You pay partner prices on all your sites, your own included: 30% below list for builds, 15% off renewals and Care. Clients pay our list price; with white-label you set your own.",
    turnOn: "Turn on reseller", resOn: "Reseller is on", resOnSub: "Partner prices apply to all your sites. Clients who sign up with this link are resold by you:", account: "Partner account",
    afterFirst: "Reseller turns on in one click after your first paid order. Or apply now:", apply: "Apply as reseller", pendingApp: "Your reseller application is being reviewed.",
    pick: "Choose your own code", pickHint: "4 to 20 letters or numbers, e.g. your business name. You can set it once. Your current link keeps working.",
    save: "Save code", sure: (c: string) => `Set your code to ${c}? It cannot be changed later.`, saved: "Your code is set",
    both: (custom: string, old: string) => `Your code: ${custom}. Links with ${old} still count for you.`,
  },
  bn: {
    title: "Passive Coder-এর সাথে ওয়েবসাইট রিসেল করুন", sub: "ক্লায়েন্ট আনুন, আমাদের লিস্ট প্রাইসে বিক্রি করুন (হোয়াইট-লেবেলে নিজের প্রাইসে), মার্জিন আপনার। আপনি পার্টনার প্রাইস দেবেন: বিল্ডে লিস্ট প্রাইসের চেয়ে ৩০% কম, রিনিউয়াল আর কেয়ারে ১৫% কম।",
    copy: "লিংক কপি", copied: "কপি হয়েছে", credit: "অক্টোবর ২০২৬-এর আগে পাওয়া ক্রেডিট", creditHint: "চেকআউটে আপনার ওয়েবসাইটে খরচ করুন। মেয়াদ পার্টনার অ্যাকাউন্টে দেখানো আছে।", pending: "অপেক্ষমাণ",
    resTitle: "পার্টনার প্রাইসে ওয়েবসাইট রিসেল করুন", resSub: "আপনি আমাদের পেইড ক্লায়েন্ট, তাই এখনই রিসেলার চালু করতে পারেন। আবেদন লাগবে না। আপনার নিজের সহ সব সাইটে পার্টনার প্রাইস: বিল্ডে ৩০% কম, রিনিউয়াল আর কেয়ারে ১৫% কম। ক্লায়েন্টরা আমাদের লিস্ট প্রাইস দেবে; হোয়াইট-লেবেলে প্রাইস আপনি ঠিক করবেন।",
    turnOn: "রিসেলার চালু করুন", resOn: "রিসেলার চালু আছে", resOnSub: "আপনার সব সাইটে পার্টনার প্রাইস। এই লিংকে যারা সাইন আপ করবে, তারা আপনার রিসেল ক্লায়েন্ট:", account: "পার্টনার অ্যাকাউন্ট",
    afterFirst: "প্রথম পেইড অর্ডারের পর এক ক্লিকে রিসেলার চালু হয়। অথবা এখনই আবেদন করুন:", apply: "রিসেলার হিসেবে আবেদন করুন", pendingApp: "আপনার রিসেলার আবেদন রিভিউ হচ্ছে।",
    pick: "নিজের কোড বেছে নিন", pickHint: "৪ থেকে ২০টি অক্ষর বা সংখ্যা, যেমন আপনার ব্যবসার নাম। একবারই সেট করা যাবে। আগের লিংকও কাজ করবে।",
    save: "কোড সেভ করুন", sure: (c: string) => `আপনার কোড ${c} সেট করবেন? পরে আর বদলানো যাবে না।`, saved: "আপনার কোড সেট হয়েছে",
    both: (custom: string, old: string) => `আপনার কোড: ${custom}। ${old} দিয়ে শেয়ার করা লিংকও আপনার হিসেবেই গোনা হবে।`,
  },
};

const money = (minor: number, cur: "BDT" | "USD") => (cur === "BDT" ? `৳${Math.round(minor / 100).toLocaleString("en-BD")}` : `$${(minor / 100).toFixed(2)}`);

export function ReferEarnCard() {
  const { language } = useLanguage();
  const wl = useWhiteLabel();
  const L = TXT[language === "bn" ? "bn" : "en"];
  const [c, setC] = useState<Card | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = () => fetch("/api/partners/me").then((r) => r.json()).then(setC).catch(() => setC({ show: false }));
  useEffect(() => { if (!wl) void load(); }, [wl]);
  if (wl || !c?.show) return null;

  const root = (process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "passivecoder.com").split(":")[0];
  async function copy(text: string) {
    try { await navigator.clipboard.writeText(text); setCopied(text); setTimeout(() => setCopied(null), 1500); } catch { toast.error(text); }
  }
  async function turnOn() {
    setBusy(true);
    const r = await fetch("/api/partners/me", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "reseller" }) });
    setBusy(false);
    if (!r.ok) { toast.error((await r.json().catch(() => ({}))).error ?? "Could not turn it on"); return; }
    toast.success(L.resOn);
    void load();
  }
  const credits = (["BDT", "USD"] as const).filter((k) => (c.credit?.available[k] ?? 0) > 0 || (c.credit?.pending[k] ?? 0) > 0);

  return (
    <div className="grid gap-4 rounded-xl border bg-card p-4 md:grid-cols-[1.2fr_1fr]">
      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-500/10 text-orange-600"><Gift className="h-5 w-5" /></span>
          <div>
            <p className="font-semibold">{L.title}</p>
            <p className="text-sm text-muted-foreground">{L.sub}</p>
          </div>
        </div>
        {credits.length > 0 && (
          <div className="text-sm">
            <span className="text-muted-foreground">{L.credit}:{" "}</span>
            {credits.map((k) => (
              <strong key={k} className="mr-2 text-foreground">{money(c.credit!.available[k], k)}{c.credit!.pending[k] > 0 && <span className="font-normal text-muted-foreground"> (+{money(c.credit!.pending[k], k)} {L.pending})</span>}</strong>
            ))}
            <p className="text-xs text-muted-foreground">{L.creditHint}</p>
          </div>
        )}
      </div>

      <div className="space-y-2 rounded-lg bg-muted/40 p-3">
        <p className="flex items-center gap-1.5 text-sm font-semibold"><BadgeDollarSign className="h-4 w-4 text-emerald-600" /> {c.reseller ? L.resOn : L.resTitle}</p>
        {c.reseller ? (
          <>
            <p className="text-xs text-muted-foreground">{L.resOnSub}</p>
            {c.resellerLink && <LinkRow link={c.resellerLink} copied={copied === c.resellerLink} onCopy={() => void copy(c.resellerLink!)} label={copied === c.resellerLink ? L.copied : L.copy} />}
            {c.customCode
              ? <p className="text-xs text-muted-foreground">{L.both(c.customCode, c.code ?? "")}</p>
              : <CustomCode L={L} onSaved={() => void load()} />}
          </>
        ) : c.canTurnOnReseller ? (
          <>
            <p className="text-xs text-muted-foreground">{L.resSub}</p>
            <button type="button" onClick={() => void turnOn()} disabled={busy} className="flex items-center gap-1.5 rounded-full bg-emerald-600 px-4 py-1.5 text-sm font-semibold text-white disabled:opacity-60">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <BadgeDollarSign className="h-4 w-4" />} {L.turnOn}
            </button>
          </>
        ) : c.resellerPending ? (
          <p className="text-xs text-muted-foreground">{L.pendingApp}</p>
        ) : (
          <>
            <p className="text-xs text-muted-foreground">{L.afterFirst}</p>
            <a href={`https://${root}/partners/apply?type=reseller${language === "bn" ? "&lang=bn" : ""}`} className="inline-block rounded-full bg-orange-500 px-4 py-1.5 text-sm font-semibold text-white hover:bg-orange-600">{L.apply}</a>
          </>
        )}
        <a href={`https://${root}/partners/account`} className="flex items-center gap-1 text-xs font-medium text-primary hover:underline">{L.account} <ArrowRight className="h-3 w-3" /></a>
      </div>
    </div>
  );
}

/** Resellers pick a custom code for their signup link once; the random one keeps working. */
function CustomCode({ L, onSaved }: { L: (typeof TXT)["en"]; onSaved: () => void }) {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const clean = code.trim().toUpperCase().replace(/[^A-Z0-9-]/g, "");
  async function save() {
    if (!window.confirm(L.sure(clean))) return;
    setBusy(true);
    const r = await fetch("/api/partners/me", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "set_code", code: clean }) });
    setBusy(false);
    if (!r.ok) { toast.error((await r.json().catch(() => ({}))).error ?? "Could not save"); return; }
    toast.success(L.saved);
    onSaved();
  }
  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="flex items-center gap-1 text-xs font-medium text-primary hover:underline">
        <PenLine className="h-3.5 w-3.5" /> {L.pick}
      </button>
    );
  }
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <input value={code} onChange={(e) => setCode(e.target.value)} maxLength={20} placeholder="YOURNAME" aria-label={L.pick}
          className="min-w-0 flex-1 rounded-md border bg-background px-2.5 py-1.5 font-mono text-xs uppercase" />
        <button type="button" onClick={() => void save()} disabled={busy || clean.length < 4}
          className="flex shrink-0 items-center gap-1 rounded-md bg-primary px-2.5 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-50">
          {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />} {L.save}
        </button>
      </div>
      <p className="text-xs text-muted-foreground">{L.pickHint}</p>
    </div>
  );
}

function LinkRow({ link, copied, onCopy, label }: { link: string; copied: boolean; onCopy: () => void; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <code className="min-w-0 flex-1 truncate rounded-md border bg-background px-2.5 py-1.5 text-xs">{link}</code>
      <button type="button" onClick={onCopy} className="flex shrink-0 items-center gap-1 rounded-md border px-2.5 py-1.5 text-xs hover:bg-muted">
        {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />} {label}
      </button>
    </div>
  );
}
