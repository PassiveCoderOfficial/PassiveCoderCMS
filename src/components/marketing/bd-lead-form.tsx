"use client";

import { useState } from "react";
import { Loader2, CheckCircle } from "lucide-react";

const BUSINESS_TYPES = [
  "কনস্ট্রাকশন / রেনোভেশন",
  "ট্রেডিং / ইমপোর্ট-এক্সপোর্ট",
  "সার্ভিস (ক্লিনিং, মুভিং, রিপেয়ার)",
  "রেস্টুরেন্ট / ফুড",
  "রিটেইল / শপ",
  "অন্যান্য",
];

const COUNTRIES = ["সৌদি আরব", "UAE", "কাতার", "সিঙ্গাপুর", "মালয়েশিয়া", "বাংলাদেশ", "অন্য দেশ"];

/**
 * Capture on the Bangladesh landing page.
 *
 * Every call to action here used to be WhatsApp or signup, so anyone who read
 * the page and was not ready for either left no trace. This asks for the one
 * thing that lets us follow up — a WhatsApp number — and treats the rest as
 * optional, because each extra required field costs replies.
 */
export function BdLeadForm({ source = "bd-landing" }: { source?: string }) {
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [country, setCountry] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!whatsapp.trim()) { setError("WhatsApp নম্বর দিন"); return; }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/marketing-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name, whatsapp, business_type: businessType, country, source,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "সমস্যা হয়েছে");
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "সমস্যা হয়েছে, WhatsApp-এ মেসেজ দিন");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-green-700/40 bg-green-950/30 p-6 text-center">
        <CheckCircle className="w-10 h-10 text-green-400 mx-auto mb-3" />
        <p className="text-white font-bold text-lg">পেয়েছি, ধন্যবাদ</p>
        <p className="text-gray-300 text-sm mt-2">
          ১ কর্মদিবসের মধ্যে আপনার WhatsApp-এ মেসেজ দেব — আপনার ব্যবসার জন্য
          কী কী লাগবে, সেটা নিয়ে কথা বলব। কোনো পেমেন্ট লাগবে না।
        </p>
      </div>
    );
  }

  const field = "w-full h-11 rounded-lg bg-gray-900 border border-gray-700 px-3 text-white text-sm placeholder-gray-500 focus:border-orange-500 outline-none";

  return (
    <form onSubmit={submit} className="rounded-2xl border border-gray-800 bg-gray-900/60 p-6 space-y-3">
      <div>
        <p className="text-white font-bold text-lg">ফ্রি পরামর্শ নিন</p>
        <p className="text-gray-400 text-sm mt-1">
          নম্বরটা দিয়ে রাখুন — ১ কর্মদিবসের মধ্যে আমরা নিজেরাই মেসেজ দেব।
          এখনই সিদ্ধান্ত নিতে হবে না, কোনো পেমেন্টও লাগবে না।
        </p>
      </div>

      <input className={field} value={name} onChange={e => setName(e.target.value)} placeholder="আপনার নাম" />

      <input
        className={field}
        value={whatsapp}
        onChange={e => setWhatsapp(e.target.value)}
        placeholder="WhatsApp নম্বর (দেশের কোড সহ) *"
        inputMode="tel"
        required
      />

      <select className={field} value={businessType} onChange={e => setBusinessType(e.target.value)}>
        <option value="">ব্যবসার ধরন</option>
        {BUSINESS_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
      </select>

      <select className={field} value={country} onChange={e => setCountry(e.target.value)}>
        <option value="">কোন দেশে আছেন</option>
        {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
      </select>

      {error && <p className="text-red-400 text-xs">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full h-11 rounded-lg bg-gradient-to-r from-orange-500 to-amber-400 text-white font-bold text-sm disabled:opacity-60 flex items-center justify-center gap-2"
      >
        {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> পাঠানো হচ্ছে…</> : "পরামর্শ চাই"}
      </button>
    </form>
  );
}
