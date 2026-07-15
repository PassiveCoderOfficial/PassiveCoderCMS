"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Droplet, Menu, X, UserCircle2, ShieldCheck } from "lucide-react";
import { DonorAvatar } from "./donor-avatar";
import { donorApi } from "@/app/(site)/donors/ui";

interface Me { id: string; name: string; photo_url: string | null; is_admin?: boolean }

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Find Donors", href: "/#donor-list" },
  { label: "Become a Donor", href: "/donors/add" },
];

/**
 * Sticky red-themed header used across the whole blood donor site — home
 * page and every /donors/* route (auth, add, me, admin, profile) — so the
 * menu and account state are always visible, including on login/signup.
 */
export function DonorSiteHeader() {
  const pathname = usePathname();
  const [me, setMe] = useState<Me | null | undefined>(undefined);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    donorApi("/api/donors/auth/me", "GET").then(r => setMe(r.data.donor ?? null)).catch(() => setMe(null));
  }, [pathname]);

  return (
    <header className="sticky top-0 z-30 bg-gradient-to-r from-red-700 to-red-600 text-white shadow-md">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2 font-extrabold text-lg shrink-0">
            <span className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center">
              <Droplet className="w-5 h-5 text-white" fill="currentColor" />
            </span>
            Blood Donors BD
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((l) => (
              <Link key={l.href} href={l.href}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname === l.href ? "bg-white/20" : "hover:bg-white/10"
                }`}>
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-2 shrink-0">
            {me === undefined ? null : me ? (
              <Link href="/donors/me"
                className="flex items-center gap-2 bg-white/15 hover:bg-white/25 rounded-full pl-1.5 pr-3 py-1 text-sm font-medium transition-colors">
                <DonorAvatar photoUrl={me.photo_url} name={me.name} size={28} />
                {me.name.split(" ")[0]}
                {me.is_admin && <ShieldCheck className="w-3.5 h-3.5" />}
              </Link>
            ) : (
              <Link href="/donors/auth"
                className="flex items-center gap-1.5 bg-white text-red-700 hover:bg-white/90 rounded-full px-4 py-2 text-sm font-semibold transition-colors">
                <UserCircle2 className="w-4 h-4" /> Log in
              </Link>
            )}
          </div>

          <button onClick={() => setMobileOpen(v => !v)} className="md:hidden p-2 -mr-2">
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-white/20 bg-red-700">
          <nav className="px-4 py-3 flex flex-col gap-1">
            {NAV_LINKS.map((l) => (
              <Link key={l.href} href={l.href} onClick={() => setMobileOpen(false)}
                className="px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-white/10">
                {l.label}
              </Link>
            ))}
            <div className="border-t border-white/20 mt-1 pt-2">
              {me ? (
                <Link href="/donors/me" onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-white/10">
                  <DonorAvatar photoUrl={me.photo_url} name={me.name} size={24} /> My account
                  {me.is_admin && <ShieldCheck className="w-3.5 h-3.5" />}
                </Link>
              ) : (
                <Link href="/donors/auth" onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-sm font-semibold bg-white/15">
                  <UserCircle2 className="w-4 h-4" /> Log in / Sign up
                </Link>
              )}
              {me?.is_admin && (
                <Link href="/donors/admin" onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-white/10">
                  <ShieldCheck className="w-4 h-4" /> Admin panel
                </Link>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
