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

export default function MarketingNav({ dark = false }: { dark?: boolean }) {
  const [open, setOpen] = useState(false);
  const d = dark;
  return (
    <header className={`sticky top-0 z-50 backdrop-blur border-b ${d ? "bg-gray-950/95 border-gray-800" : "bg-white/95 border-gray-100 shadow-sm"}`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={LOGO} alt="Passive Coder" className={`h-9 w-auto ${d ? "brightness-0 invert" : ""}`} />
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          {links.map(l => (
            <Link key={l.href} href={l.href} className={`text-sm font-medium transition-colors ${d ? "text-gray-300 hover:text-orange-400" : "text-gray-600 hover:text-orange-500"}`}>{l.label}</Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <Link href="/login" className={`text-sm px-3 py-1.5 font-medium transition-colors ${d ? "text-gray-300 hover:text-white" : "text-gray-600 hover:text-gray-900"}`}>Sign In</Link>
          <Link href="/onboarding" className="bg-gradient-to-r from-orange-500 to-rose-500 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:from-orange-600 hover:to-rose-600 transition-all shadow-md shadow-orange-200">
            Get Started Free
          </Link>
        </div>

        <button className={`md:hidden p-1 ${d ? "text-gray-300" : ""}`} onClick={() => setOpen(!open)}>
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {open && (
        <div className={`md:hidden border-t px-4 py-4 space-y-3 ${d ? "border-gray-800 bg-gray-950" : "border-gray-100 bg-white"}`}>
          {links.map(l => (
            <Link key={l.href} href={l.href} className={`block text-sm py-1.5 font-medium ${d ? "text-gray-300" : "text-gray-600"}`} onClick={() => setOpen(false)}>{l.label}</Link>
          ))}
          <div className={`pt-2 border-t flex flex-col gap-2 ${d ? "border-gray-800" : "border-gray-100"}`}>
            <Link href="/login" className={`text-sm text-center py-2 ${d ? "text-gray-300" : "text-gray-600"}`}>Sign In</Link>
            <Link href="/onboarding" className="bg-gradient-to-r from-orange-500 to-rose-500 text-white text-sm font-semibold px-4 py-2.5 rounded-xl text-center">Get Started Free</Link>
          </div>
        </div>
      )}
    </header>
  );
}
