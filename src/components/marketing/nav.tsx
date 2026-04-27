"use client";
import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";

const LOGO = "https://mljchiaabgvdzdsfobxs.supabase.co/storage/v1/object/public/media/uploads/1777257556858_Passive_Coder_Web_logo.png";

const links = [
  { label: "Features", href: "#features" },
  { label: "Templates", href: "#templates" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Clients", href: "#clients" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
];

export default function MarketingNav() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <a href="https://passivecoder.com" className="flex items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={LOGO} alt="Passive Coder" className="h-9 w-auto" />
        </a>

        <nav className="hidden md:flex items-center gap-6">
          {links.map(l => (
            <a key={l.href} href={l.href} className="text-sm text-gray-600 hover:text-orange-500 transition-colors font-medium">{l.label}</a>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900 px-3 py-1.5 font-medium">Sign In</Link>
          <Link href="/onboarding" className="bg-gradient-to-r from-orange-500 to-rose-500 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:from-orange-600 hover:to-rose-600 transition-all shadow-md shadow-orange-200">
            Get Started Free
          </Link>
        </div>

        <button className="md:hidden p-1" onClick={() => setOpen(!open)}>
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-4 space-y-3">
          {links.map(l => (
            <a key={l.href} href={l.href} className="block text-sm text-gray-600 py-1.5 font-medium" onClick={() => setOpen(false)}>{l.label}</a>
          ))}
          <div className="pt-2 border-t border-gray-100 flex flex-col gap-2">
            <Link href="/login" className="text-sm text-center text-gray-600 py-2">Sign In</Link>
            <Link href="/onboarding" className="bg-gradient-to-r from-orange-500 to-rose-500 text-white text-sm font-semibold px-4 py-2.5 rounded-xl text-center">Get Started Free</Link>
          </div>
        </div>
      )}
    </header>
  );
}
