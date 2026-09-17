// English strings — the default language and the source of truth for keys.
// Every key here MUST also exist in bn.ts (enforced by TypeScript via the
// Translations type derived from this file) — it is structurally impossible
// to ship a screen translated in English but silently missing in Bangla.
//
// Flat, dot-namespaced keys (e.g. "support.newTicket") rather than nested
// objects — easier to grep, easier to see at a glance which screen a key
// belongs to, and avoids deep-object typing headaches across two files that
// must stay in lockstep.

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

  // ── Support tickets (tenant dashboard) ───────────────────────────────
  "support.title": "Support",
  "support.subtitle": "Submit tickets and track responses from our team.",
  "support.newTicket": "New Ticket",
  "support.submitTicket": "Submit a Support Ticket",
  "support.subjectPlaceholder": "Brief description",
  "support.messagePlaceholder": "Describe your issue in detail...",
  "support.screenshots": "Screenshots",
  "support.screenshotsHint": "(max {max} images, 10MB each)",
  "support.noTickets": "No support tickets yet",
  "support.noTicketsHint": "Submit a ticket and our team will respond within 1 business day.",
  "support.conversation": "Conversation",
  "support.noReplies": "No replies yet — our team typically responds within 1 business day.",
  "support.replyPlaceholder": "Write a reply...",
  "support.sendReply": "Send reply",
  "support.backToTickets": "Back to tickets",
  "support.you": "You",
  "support.submitted": "Submitted {date}",

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

  // ── Dashboard / Analytics home ────────────────────────────────────────
  "dashboard.title": "Dashboard",
  "dashboard.welcome": "Welcome back to your CMS — site overview and traffic, together.",
  "dashboard.newPage": "New Page",
  "dashboard.newPost": "New Post",
  "dashboard.totalPages": "Total Pages",
  "dashboard.blogPosts": "Blog Posts",
  "dashboard.products": "Products",
  "dashboard.orders": "Orders",
  "dashboard.users": "Users",
  "dashboard.recentOrders": "Recent Orders",
  "dashboard.recentTransactions": "Recent Transactions",
  "dashboard.viewAll": "View all",
  "dashboard.noOrdersYet": "No orders yet",
  "dashboard.noTransactionsYet": "No transactions yet",
  "dashboard.quickActions": "Quick Actions",
  "dashboard.addProduct": "Add Product",
  "dashboard.uploadMedia": "Upload Media",
  "dashboard.manageThemes": "Manage Themes",
  "dashboard.manageModules": "Manage Modules",
  "dashboard.siteSettings": "Site Settings",
  "dashboard.traffic": "Traffic",
  "dashboard.trafficSubtitle": "Visits to your site, tracked automatically — no setup needed.",
  "dashboard.visitsLast": "Visits, last {range} days",
  "dashboard.pagesWithTraffic": "Pages with traffic",
  "dashboard.referringSites": "Referring sites",
  "dashboard.visitsOverTime": "Visits over time",
  "dashboard.topPages": "Top pages",
  "dashboard.topReferrers": "Top referrers",
  "dashboard.devices": "Devices",
  "dashboard.topCountries": "Top countries",
  "dashboard.noReferrersYet": "No referring sites yet — visits are arriving directly or from search.",
  "dashboard.noLocationYet": "No location data yet.",
  "dashboard.noDataYet": "No data yet.",
  "dashboard.noVisitsInRange": "No visits recorded yet in this range.",
} as const;

export type TranslationKey = keyof typeof en;
