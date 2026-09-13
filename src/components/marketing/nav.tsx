"use client";
import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";

const LOGO = process.env.NEXT_PUBLIC_LOGO_URL ?? "https://mljchiaabgvdzdsfobxs.supabase.co/storage/v1/object/public/media/uploads/1777257556858_Passive_Coder_Web_logo.png";

const links = [
  { label: "Home", href: "/" },
  { label: "Features", href: "/#features" },
  { label: "Templates", href: "/#templates" },
  { label: "Pricing", href: "/#pricing" },
  { label: "FAQ", href: "/#faq" },
  { label: "Contact", href: "/contact" },
];

// dark prop kept for any caller still relying on it (e.g. embedded on a
// light page) but the homepage itself is dark end to end now, so this
// mostly just always renders the dark variant in practice.
export default function MarketingNav({ dark = true }: { dark?: boolean }) {
  const [open, setOpen] = useState(false);
  const d = dark;
  return (
    <header className={`sticky top-0 z-50 backdrop-blur-md border-b ${d ? "bg-[#05060a]/90 border-white/[0.06]" : "bg-white/95 border-gray-100 shadow-sm"}`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={LOGO} alt="Passive Coder" className={`h-9 w-auto ${d ? "brightness-0 invert" : ""}`} />
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          {links.map(l => (
            <Link key={l.href} href={l.href} className={`text-sm font-medium transition-colors ${d ? "text-slate-400 hover:text-white" : "text-gray-600 hover:text-orange-500"}`}>{l.label}</Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <Link href="/login" className={`text-sm px-3 py-1.5 font-medium transition-colors ${d ? "text-slate-400 hover:text-white" : "text-gray-600 hover:text-gray-900"}`}>Sign In</Link>
          <Link
            href="/website-for-bangladeshi-businesses"
            className={`text-sm font-medium px-4 py-2.5 rounded-xl border transition-colors ${d ? "border-white/10 text-slate-300 hover:bg-white/[0.06]" : "border-gray-200 text-gray-700 hover:bg-gray-50"}`}
          >
            For BD Expats
          </Link>
          <Link href="/onboarding" className={d
            ? "bg-white text-slate-950 text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-slate-100 transition-all"
            : "bg-gradient-to-r from-orange-500 to-rose-500 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:from-orange-600 hover:to-rose-600 transition-all shadow-md shadow-orange-200"}>
            Get Started
          </Link>
        </div>

        <button className={`md:hidden p-1 ${d ? "text-slate-300" : ""}`} onClick={() => setOpen(!open)}>
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {open && (
        <div className={`md:hidden border-t px-4 py-4 space-y-3 ${d ? "border-white/[0.06] bg-[#05060a]" : "border-gray-100 bg-white"}`}>
          {links.map(l => (
            <Link key={l.href} href={l.href} className={`block text-sm py-1.5 font-medium ${d ? "text-slate-400" : "text-gray-600"}`} onClick={() => setOpen(false)}>{l.label}</Link>
          ))}
          <div className={`pt-2 border-t flex flex-col gap-2 ${d ? "border-white/[0.06]" : "border-gray-100"}`}>
            <Link href="/login" className={`text-sm text-center py-2 ${d ? "text-slate-400" : "text-gray-600"}`}>Sign In</Link>
            <Link
              href="/website-for-bangladeshi-businesses"
              className={`text-sm font-medium px-4 py-2.5 rounded-xl border text-center ${d ? "border-white/10 text-slate-300" : "border-gray-200 text-gray-700"}`}
              onClick={() => setOpen(false)}
            >
              For BD Expats
            </Link>
            <Link href="/onboarding" className={d
              ? "bg-white text-slate-950 text-sm font-semibold px-4 py-2.5 rounded-xl text-center"
              : "bg-gradient-to-r from-orange-500 to-rose-500 text-white text-sm font-semibold px-4 py-2.5 rounded-xl text-center"} onClick={() => setOpen(false)}>Get Started</Link>
          </div>
        </div>
      )}
    </header>
  );
}
