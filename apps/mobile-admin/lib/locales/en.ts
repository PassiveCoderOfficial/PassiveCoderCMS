// English strings — the default language and the source of truth for keys.
// Mirrors cms/src/lib/i18n/locales/en.ts exactly in shape (same key names
// where the same feature exists on both sides — the support-ticket keys
// below are IDENTICAL to web's, so the same t("support.title") means the
// same thing regardless of which app it's read from). Every key here MUST
// also exist in bn.ts — enforced by TypeScript, see bn.ts's `satisfies`.

export const en = {
  // ── Common / shared across many screens ─────────────────────────────
  "common.save": "Save",
  "common.cancel": "Cancel",
  "common.delete": "Delete",
  "common.edit": "Edit",
  "common.close": "Close",
  "common.back": "Back",
  "common.loading": "Loading…",
  "common.retry": "Retry",
  "common.search": "Search",
  "common.submit": "Submit",
  "common.confirm": "Confirm",
  "common.yes": "Yes",
  "common.no": "No",
  "common.send": "Send",
  "common.reply": "Reply",
  "common.status": "Status",
  "common.priority": "Priority",
  "common.department": "Department",
  "common.subject": "Subject",
  "common.message": "Message",

  // ── Language switcher ────────────────────────────────────────────────
  "language.label": "Language",
  "language.english": "English",
  "language.bangla": "বাংলা",

  // ── Tab bar / navigation ──────────────────────────────────────────────
  "nav.dashboard": "Dashboard",
  "nav.sites": "Sites",
  "nav.tenants": "Tenants",
  "nav.profile": "Profile",

  // ── Support tickets ───────────────────────────────────────────────────
  "support.title": "Support",
  "support.newTicket": "New ticket",
  "support.submit": "Submit",
  "support.subjectPlaceholder": "Brief description",
  "support.messagePlaceholder": "Describe your issue in detail...",
  "support.noTickets": "No support tickets yet",
  "support.noTicketsHint": "Submit a ticket and our team will respond within 1 business day.",
  "support.conversation": "Conversation",
  "support.noReplies": "No replies yet — our team typically responds within 1 business day.",
  "support.replyPlaceholder": "Write a reply...",
  "support.sendReply": "Send reply",
  "support.backToTickets": "Back to tickets",
  "support.you": "You",

  // ── Priority values ───────────────────────────────────────────────────
  "priority.low": "Low",
  "priority.normal": "Normal",
  "priority.high": "High",
  "priority.urgent": "Urgent",

  // ── Ticket status values ──────────────────────────────────────────────
  "ticketStatus.open": "Open",
  "ticketStatus.in_progress": "In Progress",
  "ticketStatus.resolved": "Resolved",
  "ticketStatus.closed": "Closed",

  // ── Profile screen ────────────────────────────────────────────────────
  "profile.appearance": "Appearance",
  "profile.system": "System",
  "profile.light": "Light",
  "profile.dark": "Dark",
  "profile.logOut": "Log out",
  "profile.yourSites": "Your sites",
} as const;

export type TranslationKey = keyof typeof en;
