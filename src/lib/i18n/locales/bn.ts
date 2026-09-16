// Bangla strings. Machine-translated first pass (Wali's explicit call —
// ship the infrastructure + switcher now, refine phrasing with a native
// speaker later). MUST have exactly the same keys as en.ts — the
// `satisfies Record<TranslationKey, string>` below is what enforces that;
// a missing or extra key here is a compile error, not a silent runtime gap.

import type { TranslationKey } from "./en";

export const bn = {
  // ── Common / shared across many screens ─────────────────────────────
  "common.save": "সংরক্ষণ করুন",
  "common.cancel": "বাতিল",
  "common.delete": "মুছুন",
  "common.edit": "সম্পাদনা",
  "common.close": "বন্ধ করুন",
  "common.back": "ফিরে যান",
  "common.loading": "লোড হচ্ছে…",
  "common.retry": "আবার চেষ্টা করুন",
  "common.search": "অনুসন্ধান",
  "common.submit": "জমা দিন",
  "common.confirm": "নিশ্চিত করুন",
  "common.yes": "হ্যাঁ",
  "common.no": "না",
  "common.send": "পাঠান",
  "common.reply": "উত্তর দিন",
  "common.status": "অবস্থা",
  "common.priority": "অগ্রাধিকার",
  "common.department": "বিভাগ",
  "common.subject": "বিষয়",
  "common.message": "বার্তা",

  // ── Language switcher ────────────────────────────────────────────────
  "language.label": "ভাষা",
  "language.english": "English",
  "language.bangla": "বাংলা",

  // ── Support tickets (tenant dashboard) ───────────────────────────────
  "support.title": "সহায়তা",
  "support.subtitle": "টিকেট জমা দিন এবং আমাদের দলের প্রতিক্রিয়া দেখুন।",
  "support.newTicket": "নতুন টিকেট",
  "support.submitTicket": "একটি সহায়তা টিকেট জমা দিন",
  "support.subjectPlaceholder": "সংক্ষিপ্ত বিবরণ",
  "support.messagePlaceholder": "আপনার সমস্যাটি বিস্তারিত লিখুন...",
  "support.screenshots": "স্ক্রিনশট",
  "support.screenshotsHint": "(সর্বোচ্চ {max}টি ছবি, প্রতিটি ১০MB পর্যন্ত)",
  "support.noTickets": "এখনও কোনো সহায়তা টিকেট নেই",
  "support.noTicketsHint": "একটি টিকেট জমা দিন, আমাদের দল ১ কার্যদিবসের মধ্যে উত্তর দেবে।",
  "support.conversation": "কথোপকথন",
  "support.noReplies": "এখনও কোনো উত্তর নেই — আমাদের দল সাধারণত ১ কার্যদিবসের মধ্যে উত্তর দেয়।",
  "support.replyPlaceholder": "একটি উত্তর লিখুন...",
  "support.sendReply": "উত্তর পাঠান",
  "support.backToTickets": "টিকেট তালিকায় ফিরে যান",
  "support.you": "আপনি",
  "support.submitted": "জমা দেওয়া হয়েছে {date}",

  // ── Priority values ───────────────────────────────────────────────────
  "priority.low": "কম",
  "priority.normal": "স্বাভাবিক",
  "priority.high": "উচ্চ",
  "priority.urgent": "জরুরি",

  // ── Ticket status values ──────────────────────────────────────────────
  "ticketStatus.open": "খোলা",
  "ticketStatus.in_progress": "চলমান",
  "ticketStatus.resolved": "সমাধান হয়েছে",
  "ticketStatus.closed": "বন্ধ",
} satisfies Record<TranslationKey, string>;
