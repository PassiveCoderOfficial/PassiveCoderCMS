"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, Store, CheckCircle2, ArrowLeft } from "lucide-react";

const AREAS = [
  "Dhaka", "Savar", "Keraniganj", "Narayanganj", "Gazipur",
  "Chattogram", "Sylhet", "Rajshahi", "Khulna", "Barishal", "Rangpur", "Mymensingh",
];

const label = "block text-sm font-medium text-[#1A1330] mb-1.5";
const input =
  "w-full border border-[#EAECF0] rounded-xl px-3.5 py-2.5 text-sm bg-white text-[#1A1330] placeholder-[#98A2B3] focus:outline-none focus:ring-2 focus:ring-[#FF5A1F]/25 focus:border-[#FF5A1F] transition-all";

export default function VendorSignupForm() {
  const [f, setF] = useState({
    shop_name: "", owner_name: "", phone: "", email: "", password: "",
    description: "", pickup_address: "", pickup_area: "Dhaka",
    bkash_number: "", trade_license: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setF({ ...f, [k]: e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const res = await fetch("/api/vendor/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(f),
    });
    const d = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      setError(d.error ?? "Could not submit your application");
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <div className="w-14 h-14 rounded-2xl bg-[#FFF6F2] flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-7 h-7 text-[#FF5A1F]" />
        </div>
        <h1 className="mt-5 text-2xl font-bold text-[#1A1330]">Application received</h1>
        <p className="mt-3 text-[#667085] leading-relaxed">
          We&apos;ll check your details and get back to you, usually within one to two
          working days. You can sign in with your email once your shop is approved.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 mt-7 bg-[#FF5A1F] hover:bg-[#E64A0F] text-white px-6 py-3 rounded-full font-semibold transition-colors"
        >
          Back to shop
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <Link
        href="/vendor"
        className="inline-flex items-center gap-1.5 text-sm text-[#667085] hover:text-[#FF5A1F] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </Link>

      <div className="mt-4 flex items-center gap-3">
        <span className="w-11 h-11 rounded-xl bg-[#FFF6F2] flex items-center justify-center shrink-0">
          <Store className="w-5 h-5 text-[#FF5A1F]" />
        </span>
        <div>
          <h1 className="text-2xl font-bold text-[#1A1330]">Become a seller</h1>
          <p className="text-sm text-[#667085]">
            Tell us about your shop. Approval usually takes 1–2 working days.
          </p>
        </div>
      </div>

      <form onSubmit={submit} className="mt-8 space-y-6">
        <section className="rounded-2xl border border-[#EAECF0] p-5 space-y-4">
          <h2 className="font-semibold text-[#1A1330]">Your shop</h2>
          <div>
            <label className={label} htmlFor="shop_name">Shop name *</label>
            <input id="shop_name" className={input} value={f.shop_name} onChange={set("shop_name")}
              placeholder="e.g. Rahim Electronics" required />
          </div>
          <div>
            <label className={label} htmlFor="description">What do you sell?</label>
            <textarea id="description" rows={2} className={input} value={f.description}
              onChange={set("description")} placeholder="Short description buyers will see on your shop page" />
          </div>
        </section>

        <section className="rounded-2xl border border-[#EAECF0] p-5 space-y-4">
          <h2 className="font-semibold text-[#1A1330]">Contact &amp; login</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={label} htmlFor="owner_name">Your name *</label>
              <input id="owner_name" className={input} value={f.owner_name} onChange={set("owner_name")} required />
            </div>
            <div>
              <label className={label} htmlFor="phone">Mobile number *</label>
              <input id="phone" className={input} value={f.phone} onChange={set("phone")}
                placeholder="01XXXXXXXXX" inputMode="numeric" required />
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={label} htmlFor="email">Email *</label>
              <input id="email" type="email" className={input} value={f.email} onChange={set("email")} required />
            </div>
            <div>
              <label className={label} htmlFor="password">Password *</label>
              <input id="password" type="password" className={input} value={f.password}
                onChange={set("password")} placeholder="At least 8 characters" minLength={8} required />
              <p className="text-xs text-[#98A2B3] mt-1">You&apos;ll use this to sign in to your Seller Centre.</p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-[#EAECF0] p-5 space-y-4">
          <h2 className="font-semibold text-[#1A1330]">Pickup &amp; payout</h2>
          <div>
            <label className={label} htmlFor="pickup_address">Pickup address</label>
            <input id="pickup_address" className={input} value={f.pickup_address}
              onChange={set("pickup_address")} placeholder="Where couriers collect your parcels" />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={label} htmlFor="pickup_area">Area</label>
              <select id="pickup_area" className={input} value={f.pickup_area} onChange={set("pickup_area")}>
                {AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div>
              <label className={label} htmlFor="bkash_number">bKash number for payouts</label>
              <input id="bkash_number" className={input} value={f.bkash_number}
                onChange={set("bkash_number")} placeholder="01XXXXXXXXX" inputMode="numeric" />
            </div>
          </div>
          <div>
            <label className={label} htmlFor="trade_license">Trade licence number</label>
            <input id="trade_license" className={input} value={f.trade_license}
              onChange={set("trade_license")} placeholder="Optional, but speeds up approval" />
          </div>
        </section>

        {error && (
          <p className="text-sm text-[#B42318] bg-[#FEF3F2] border border-[#FECDCA] rounded-xl px-4 py-3">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#FF5A1F] hover:bg-[#E64A0F] text-white px-8 py-3.5 rounded-full font-semibold disabled:opacity-50 transition-colors"
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          Submit application
        </button>

        <p className="text-xs text-[#98A2B3]">
          By applying you agree to the marketplace seller terms. Commission is confirmed
          when your shop is approved.
        </p>
      </form>
    </div>
  );
}
