"use client";

import { ChevronDown, Phone, Mail, MapPin } from "lucide-react";

// ─── TEAM ─────────────────────────────────────────────────────────────────────

interface TeamMember { name: string; role: string; bio: string; initials: string; color: string }
interface TeamData { team: TeamMember[]; primaryColor: string; accentHex: string }

export function TeamAvatarCards({ d }: { d: TeamData }) {
  return (
    <section className="bg-white px-8 py-14 border-y border-gray-100">
      <div className="text-center mb-8">
        <div className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: d.accentHex }}>The Team</div>
        <h2 className="text-2xl font-extrabold text-gray-900">Meet Our Experts</h2>
      </div>
      <div className="grid grid-cols-3 gap-6 max-w-3xl mx-auto">
        {d.team.slice(0, 3).map(m => (
          <div key={m.name} className="text-center">
            <div className="w-20 h-20 rounded-2xl mx-auto flex items-center justify-center text-white font-extrabold text-xl mb-3 shadow-lg" style={{ backgroundColor: m.color }}>
              {m.initials}
            </div>
            <div className="font-bold text-sm text-gray-900">{m.name}</div>
            <div className="text-xs font-medium mb-1" style={{ color: d.accentHex }}>{m.role}</div>
            <div className="text-[10px] text-gray-400 leading-relaxed line-clamp-2">{m.bio}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function TeamHorizontalList({ d }: { d: TeamData }) {
  return (
    <section className="px-8 py-14" style={{ backgroundColor: `${d.primaryColor}08` }}>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: d.accentHex }}>Our People</div>
          <h2 className="text-2xl font-extrabold text-gray-900">The Team Behind the Work</h2>
        </div>
        <div className="space-y-4">
          {d.team.slice(0, 3).map(m => (
            <div key={m.name} className="flex items-center gap-5 bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
              <div className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0" style={{ backgroundColor: m.color }}>
                {m.initials}
              </div>
              <div className="flex-1">
                <div className="font-bold text-sm text-gray-900">{m.name}</div>
                <div className="text-xs font-medium mb-1" style={{ color: d.accentHex }}>{m.role}</div>
                <div className="text-xs text-gray-500 line-clamp-1">{m.bio}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── FAQ ──────────────────────────────────────────────────────────────────────

interface FaqItem { q: string; a: string }
interface FaqData { faqItems: FaqItem[]; primaryColor: string; accentHex: string }

export function FaqAccordion({ d }: { d: FaqData }) {
  return (
    <section className="bg-white px-8 py-14">
      <div className="text-center mb-8">
        <div className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: d.accentHex }}>FAQ</div>
        <h2 className="text-2xl font-extrabold text-gray-900">Common Questions</h2>
      </div>
      <div className="space-y-3 max-w-3xl mx-auto">
        {d.faqItems.slice(0, 4).map((f, i) => (
          <div key={i} className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 bg-gray-50 cursor-pointer">
              <span className="text-sm font-semibold text-gray-900 pr-4">{f.q}</span>
              <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
            </div>
            {i === 0 && (
              <div className="px-5 py-4 text-sm text-gray-600 leading-relaxed border-t border-gray-100">{f.a}</div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

export function FaqTwoColumn({ d }: { d: FaqData }) {
  return (
    <section className="px-8 py-14" style={{ backgroundColor: `${d.primaryColor}06` }}>
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <div className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: d.accentHex }}>FAQ</div>
          <h2 className="text-2xl font-extrabold text-gray-900">Frequently Asked Questions</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {d.faqItems.slice(0, 4).map((f, i) => (
            <div key={i} className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
              <div className="font-bold text-sm text-gray-900 mb-2">{f.q}</div>
              <div className="text-xs text-gray-500 leading-relaxed">{f.a}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── CTA ──────────────────────────────────────────────────────────────────────

interface CtaData { cta: string; ctaSecondary: string; tagline: string; primaryColor: string; accentHex: string; secondaryColor: string }

export function CtaBanner({ d }: { d: CtaData }) {
  return (
    <section className="px-8 py-14" style={{ background: `linear-gradient(135deg, ${d.primaryColor}, ${d.secondaryColor})` }}>
      <div className="text-center max-w-2xl mx-auto">
        <h2 className="text-2xl font-extrabold text-white mb-3">Ready to get started?</h2>
        <p className="text-white/70 text-sm mb-8">{d.tagline}</p>
        <div className="flex gap-3 justify-center">
          <button className="bg-white text-sm font-bold px-8 py-3.5 rounded-xl cursor-pointer shadow-xl" style={{ color: d.primaryColor }}>
            {d.cta}
          </button>
          <button className="border-2 border-white/30 text-white text-sm font-semibold px-8 py-3.5 rounded-xl cursor-pointer">
            {d.ctaSecondary}
          </button>
        </div>
      </div>
    </section>
  );
}

export function CtaMinimal({ d }: { d: CtaData }) {
  return (
    <section className="bg-white px-8 py-14 border-y border-gray-100">
      <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Ready to get started?</h2>
          <p className="text-gray-500 text-sm">{d.tagline}</p>
        </div>
        <div className="flex gap-3 flex-shrink-0">
          <button className="text-white text-sm font-bold px-7 py-3.5 rounded-xl cursor-pointer" style={{ backgroundColor: d.accentHex }}>
            {d.cta}
          </button>
          <button className="border border-gray-200 text-gray-700 text-sm font-semibold px-7 py-3.5 rounded-xl cursor-pointer">
            {d.ctaSecondary}
          </button>
        </div>
      </div>
    </section>
  );
}

// ─── CONTACT FOOTER ──────────────────────────────────────────────────────────

interface ContactData { phone: string; email: string; address: string; cta: string; primaryColor: string; accentHex: string; secondaryColor: string; siteName: string }

export function ContactFooterDark({ d }: { d: ContactData }) {
  return (
    <section style={{ background: `linear-gradient(135deg, ${d.primaryColor}, ${d.secondaryColor})` }} className="px-8 py-14">
      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
          <div>
            <div className="font-bold text-white text-lg mb-4">{d.siteName}</div>
            <button className="bg-white text-xs font-bold px-6 py-3 rounded-xl cursor-pointer" style={{ color: d.primaryColor }}>
              {d.cta}
            </button>
          </div>
          <div className="space-y-3">
            <div className="text-[11px] font-bold uppercase tracking-widest text-white/40 mb-3">Contact</div>
            <div className="flex items-center gap-2 text-white/75 text-sm"><Phone className="w-3.5 h-3.5" /> {d.phone}</div>
            <div className="flex items-center gap-2 text-white/75 text-sm"><Mail className="w-3.5 h-3.5" /> {d.email}</div>
            <div className="flex items-start gap-2 text-white/75 text-sm"><MapPin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" /> {d.address}</div>
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-widest text-white/40 mb-3">Hours</div>
            <div className="text-white/70 text-sm space-y-1">
              <div>Mon – Fri: 8am – 6pm</div>
              <div>Sat: 9am – 4pm</div>
              <div>24/7 Emergency Line</div>
            </div>
          </div>
        </div>
        <div className="border-t border-white/10 pt-6 text-center text-white/30 text-xs">
          © {new Date().getFullYear()} {d.siteName}. All rights reserved.
        </div>
      </div>
    </section>
  );
}

export function ContactFooterLight({ d }: { d: ContactData }) {
  return (
    <section className="bg-gray-50 px-8 py-14 border-t border-gray-200">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Get in Touch</h2>
        <p className="text-gray-500 text-sm mb-8">We&apos;d love to hear from you</p>
        <div className="flex flex-wrap justify-center gap-6 mb-8">
          <a className="flex items-center gap-2 text-gray-600 text-sm hover:text-gray-900"><Phone className="w-4 h-4" style={{ color: d.accentHex }} /> {d.phone}</a>
          <a className="flex items-center gap-2 text-gray-600 text-sm hover:text-gray-900"><Mail className="w-4 h-4" style={{ color: d.accentHex }} /> {d.email}</a>
          <a className="flex items-center gap-2 text-gray-600 text-sm hover:text-gray-900"><MapPin className="w-4 h-4" style={{ color: d.accentHex }} /> {d.address}</a>
        </div>
        <button className="text-white text-sm font-bold px-10 py-3.5 rounded-xl cursor-pointer shadow-lg" style={{ backgroundColor: d.accentHex }}>
          {d.cta}
        </button>
        <div className="mt-8 text-gray-300 text-xs">© {new Date().getFullYear()} {d.siteName}</div>
      </div>
    </section>
  );
}
