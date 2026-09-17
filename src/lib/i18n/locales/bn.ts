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

  // ── Dashboard / Analytics home ────────────────────────────────────────
  "dashboard.title": "ড্যাশবোর্ড",
  "dashboard.welcome": "আপনার CMS-এ স্বাগতম — সাইটের সারসংক্ষেপ এবং ট্রাফিক, একসাথে।",
  "dashboard.newPage": "নতুন পেজ",
  "dashboard.newPost": "নতুন পোস্ট",
  "dashboard.totalPages": "মোট পেজ",
  "dashboard.blogPosts": "ব্লগ পোস্ট",
  "dashboard.products": "পণ্য",
  "dashboard.orders": "অর্ডার",
  "dashboard.users": "ব্যবহারকারী",
  "dashboard.recentOrders": "সাম্প্রতিক অর্ডার",
  "dashboard.recentTransactions": "সাম্প্রতিক লেনদেন",
  "dashboard.viewAll": "সব দেখুন",
  "dashboard.noOrdersYet": "এখনও কোনো অর্ডার নেই",
  "dashboard.noTransactionsYet": "এখনও কোনো লেনদেন নেই",
  "dashboard.quickActions": "দ্রুত পদক্ষেপ",
  "dashboard.addProduct": "পণ্য যোগ করুন",
  "dashboard.uploadMedia": "মিডিয়া আপলোড",
  "dashboard.manageThemes": "থিম পরিচালনা",
  "dashboard.manageModules": "মডিউল পরিচালনা",
  "dashboard.siteSettings": "সাইট সেটিংস",
  "dashboard.traffic": "ট্রাফিক",
  "dashboard.trafficSubtitle": "আপনার সাইটে ভিজিট, স্বয়ংক্রিয়ভাবে ট্র্যাক করা হয় — কোনো সেটআপ প্রয়োজন নেই।",
  "dashboard.visitsLast": "গত {range} দিনের ভিজিট",
  "dashboard.pagesWithTraffic": "ট্রাফিকসহ পেজ",
  "dashboard.referringSites": "রেফারিং সাইট",
  "dashboard.visitsOverTime": "সময়ের সাথে ভিজিট",
  "dashboard.topPages": "শীর্ষ পেজ",
  "dashboard.topReferrers": "শীর্ষ রেফারার",
  "dashboard.devices": "ডিভাইস",
  "dashboard.topCountries": "শীর্ষ দেশ",
  "dashboard.noReferrersYet": "এখনও কোনো রেফারিং সাইট নেই — ভিজিট সরাসরি বা সার্চ থেকে আসছে।",
  "dashboard.noLocationYet": "এখনও কোনো অবস্থানের তথ্য নেই।",
  "dashboard.noDataYet": "এখনও কোনো তথ্য নেই।",
  "dashboard.noVisitsInRange": "এই সময়সীমায় এখনও কোনো ভিজিট রেকর্ড হয়নি।",
} satisfies Record<TranslationKey, string>;
