"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Droplet, Menu, X, UserCircle2, ShieldCheck, ChevronDown, LogOut } from "lucide-react";
import { DonorAvatar } from "./donor-avatar";
import { donorApi } from "@/app/(site)/donors/ui";
import { LanguageSwitch } from "@/components/site/language-switch";

interface Me { id: string; name: string; photo_url: string | null; is_admin?: boolean }

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Find Donors", href: "/#donor-list" },
  { label: "List Requests", href: "/donors/requests" },
  { label: "Add Donor", href: "/donors/add" },
];

/**
 * Sticky red-themed header used across the whole blood donor site — home
 * page and every /donors/* route (auth, add, me, admin, profile) — so the
 * menu and account state are always visible, including on login/signup.
 */
export function DonorSiteHeader({ showTranslate = false }: { showTranslate?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const [me, setMe] = useState<Me | null | undefined>(undefined);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    donorApi("/api/donors/auth/me", "GET").then(r => setMe(r.data.donor ?? null)).catch(() => setMe(null));
  }, [pathname]);

  // Close the profile dropdown on an outside click.
  useEffect(() => {
    if (!menuOpen) return;
    function onDown(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [menuOpen]);

  async function logout() {
    setMenuOpen(false);
    setMobileOpen(false);
    await donorApi("/api/donors/auth/logout", "POST", {});
    setMe(null);
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-30 bg-gradient-to-r from-red-700 to-red-600 text-white shadow-md">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2 shrink-0">
            <Link href="/" className="flex items-center gap-2 font-extrabold text-lg">
              <span className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center">
                <Droplet className="w-5 h-5 text-white" fill="currentColor" />
              </span>
              Blood Donors BD
            </Link>
            <a href="https://passivecoder.com" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 pl-2 ml-1 border-l border-white/25 text-white/80 hover:text-white transition-colors">
              <span className="hidden sm:inline text-[10px] leading-none">powered by</span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="https://mljchiaabgvdzdsfobxs.supabase.co/storage/v1/object/public/media/uploads/1777257556858_Passive_Coder_Web_logo.png"
                alt="Passive Coder" className="h-6 sm:h-8 w-auto rounded bg-white px-1 py-0.5" />
            </a>
          </div>

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
            {showTranslate && <LanguageSwitch />}
            {me === undefined ? null : me ? (
              <div className="relative" ref={menuRef}>
                <button onClick={() => setMenuOpen(v => !v)}
                  className="flex items-center gap-2 bg-white/15 hover:bg-white/25 rounded-full pl-1.5 pr-2.5 py-1 text-sm font-medium transition-colors">
                  <DonorAvatar photoUrl={me.photo_url} name={me.name} size={28} />
                  {me.name.split(" ")[0]}
                  {me.is_admin && <ShieldCheck className="w-3.5 h-3.5" />}
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${menuOpen ? "rotate-180" : ""}`} />
                </button>
                {menuOpen && (
                  <div className="absolute right-0 top-full mt-1.5 w-48 overflow-hidden rounded-xl border bg-white py-1 text-gray-700 shadow-lg">
                    <Link href="/donors/me" onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-gray-50">
                      <UserCircle2 className="w-4 h-4 text-gray-400" /> My account
                    </Link>
                    <Link href={`/donors/${me.id}`} onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-gray-50">
                      <DonorAvatar photoUrl={me.photo_url} name={me.name} size={16} /> My profile
                    </Link>
                    {me.is_admin && (
                      <Link href="/donors/admin" onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-gray-50">
                        <ShieldCheck className="w-4 h-4 text-gray-400" /> Admin panel
                      </Link>
                    )}
                    <button onClick={logout}
                      className="flex w-full items-center gap-2 border-t px-3 py-2.5 text-left text-sm text-red-600 hover:bg-red-50">
                      <LogOut className="w-4 h-4" /> Log out
                    </button>
                  </div>
                )}
              </div>
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
              {showTranslate && (
                <div className="px-3 py-1.5">
                  <LanguageSwitch className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold bg-white/15" />
                </div>
              )}
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
              {me && (
                <button onClick={logout}
                  className="flex w-full items-center gap-1.5 rounded-lg px-3 py-2.5 text-left text-sm font-medium hover:bg-white/10">
                  <LogOut className="w-4 h-4" /> Log out
                </button>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
