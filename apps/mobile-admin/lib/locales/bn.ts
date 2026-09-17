// Bangla strings — Banglish register (Wali's explicit direction), mirrors
// cms/src/lib/i18n/locales/bn.ts word for word on every shared key. See
// that file's header comment for the full rule: technical/product terms
// stay transliterated ("Danger Zone" -> "ডেঞ্জার জোন"), everyday verbs/
// connectors stay natural Bangla ("করুন", "থেকে", "এবং").
//
// MUST have exactly the same keys as en.ts — the `satisfies` below
// enforces that.

import type { TranslationKey } from "./en";

export const bn = {
  // ── Common / shared across many screens ─────────────────────────────
  "common.save": "সেভ করুন",
  "common.cancel": "ক্যান্সেল করুন",
  "common.delete": "ডিলিট করুন",
  "common.edit": "এডিট করুন",
  "common.close": "ক্লোজ করুন",
  "common.back": "ফিরে যান",
  "common.loading": "লোড হচ্ছে…",
  "common.retry": "আবার চেষ্টা করুন",
  "common.search": "সার্চ করুন",
  "common.submit": "সাবমিট করুন",
  "common.confirm": "কনফার্ম করুন",
  "common.yes": "হ্যাঁ",
  "common.no": "না",
  "common.send": "সেন্ড করুন",
  "common.reply": "রিপ্লাই দিন",
  "common.status": "স্ট্যাটাস",
  "common.priority": "প্রায়োরিটি",
  "common.department": "ডিপার্টমেন্ট",
  "common.subject": "সাবজেক্ট",
  "common.message": "মেসেজ",

  // ── Language switcher ────────────────────────────────────────────────
  "language.label": "ভাষা",
  "language.english": "English",
  "language.bangla": "বাংলা",

  // ── Tab bar / navigation ──────────────────────────────────────────────
  "nav.dashboard": "ড্যাশবোর্ড",
  "nav.sites": "সাইট",
  "nav.tenants": "টেন্যান্ট",
  "nav.profile": "প্রোফাইল",

  // ── Support tickets ───────────────────────────────────────────────────
  "support.title": "সাপোর্ট",
  "support.newTicket": "নতুন টিকিট",
  "support.submit": "সাবমিট করুন",
  "support.subjectPlaceholder": "সংক্ষিপ্ত বিবরণ লিখুন",
  "support.messagePlaceholder": "আপনার সমস্যাটি বিস্তারিত লিখুন...",
  "support.noTickets": "এখনও কোনো সাপোর্ট টিকিট নেই",
  "support.noTicketsHint": "একটি টিকিট সাবমিট করুন — আমাদের টিম ১ কার্যদিবসের মধ্যে রিপ্লাই দেবে।",
  "support.conversation": "কনভারসেশন",
  "support.noReplies": "এখনও কোনো রিপ্লাই আসেনি — সাধারণত ১ কার্যদিবসের মধ্যে রিপ্লাই পাবেন।",
  "support.replyPlaceholder": "রিপ্লাই লিখুন...",
  "support.sendReply": "রিপ্লাই সেন্ড করুন",
  "support.backToTickets": "টিকিট লিস্টে ফিরুন",
  "support.you": "আপনি",

  // ── Priority values ───────────────────────────────────────────────────
  "priority.low": "লো",
  "priority.normal": "নরমাল",
  "priority.high": "হাই",
  "priority.urgent": "আর্জেন্ট",

  // ── Ticket status values ──────────────────────────────────────────────
  "ticketStatus.open": "ওপেন",
  "ticketStatus.in_progress": "ইন প্রগ্রেস",
  "ticketStatus.resolved": "রিজলভড",
  "ticketStatus.closed": "ক্লোজড",

  // ── Profile screen ────────────────────────────────────────────────────
  "profile.appearance": "থিম",
  "profile.system": "ডিভাইস অনুযায়ী",
  "profile.light": "লাইট",
  "profile.dark": "ডার্ক",
  "profile.logOut": "লগ আউট করুন",
  "profile.yourSites": "আপনার সাইট",
} satisfies Record<TranslationKey, string>;
