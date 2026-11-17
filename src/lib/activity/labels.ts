/**
 * The action list in plain words. No imports, so tests can check it directly.
 *
 * Only names on these lists are ever shown. Log rows can hold client data and
 * tool arguments, so nothing is printed just because it is in a row.
 */

export type ActionCategory = "pages" | "shop" | "media" | "bookings" | "leads" | "content" | "settings" | "sites" | "billing" | "users" | "signins" | "tickets" | "projects" | "attendance" | "opens" | "mcp" | "app" | "visitors";

export const CATEGORIES: { value: ActionCategory; label: string }[] = [
  { value: "pages", label: "Pages and posts" },
  { value: "shop", label: "Products and orders" },
  { value: "media", label: "Media" },
  { value: "bookings", label: "Bookings" },
  { value: "leads", label: "Leads, forms and chat" },
  { value: "content", label: "Other site content" },
  { value: "sites", label: "Sites: create, delete, transfer" },
  { value: "settings", label: "Site settings" },
  { value: "billing", label: "Plans and billing" },
  { value: "users", label: "Users and roles" },
  { value: "signins", label: "Sign-ins" },
  { value: "tickets", label: "Tickets" },
  { value: "projects", label: "Projects" },
  { value: "attendance", label: "Attendance" },
  { value: "opens", label: "Opened a client dashboard" },
  { value: "mcp", label: "Through an AI agent (MCP)" },
  { value: "app", label: "Through the phone app" },
  { value: "visitors", label: "Visitors and automation" },
];

/** Where a row came from (admin_audit_log.via; migration 227). */
export type ActionSource = "panel" | "app" | "mcp" | "release" | "database" | "people";

export const SOURCES: { value: ActionSource; label: string }[] = [
  { value: "panel", label: "Panel" },
  { value: "app", label: "Phone app" },
  { value: "mcp", label: "Claude / MCP" },
  { value: "release", label: "Release" },
  { value: "database", label: "Database / script" },
  { value: "people", label: "All but database / script" },
];

/** PostgREST filter for a source: [column, operator, value], or null for all sources. */
export function sourceFilter(source: string | null | undefined): { op: "eq" | "neq"; value: string } | null {
  switch (source) {
    case "panel": return { op: "eq", value: "web" };
    case "app": return { op: "eq", value: "app" };
    case "mcp": return { op: "eq", value: "mcp" };
    case "release": return { op: "eq", value: "release" };
    case "database": return { op: "eq", value: "database" };
    case "people": return { op: "neq", value: "database" };
    default: return null;
  }
}

/** What each content table is called in the list. Migration 211 writes <key>.create, .edit, .status and .delete. */
const SHOP_NOUNS: Record<string, string> = {
  product: "a product", category: "a category", option_preset: "a product option preset", shipping_rate: "a shipping rate", voucher: "a voucher", flash_sale: "a flash sale",
  order: "an order", review: "a review", price_request: "a price request",
};
const BOOKING_NOUNS: Record<string, string> = {
  booking: "a booking", booking_block: "a blocked date", reservation: "a reservation", marketplace_booking: "a marketplace booking",
};
const LEAD_NOUNS: Record<string, string> = {
  lead: "a lead", lead_note: "a note on a lead", form: "a form submission", contact_form: "a contact form", contact_detail: "contact details", contact_block: "a spam block",
  crm_stage: "a pipeline stage", crm_task: "a CRM task", crm_sequence: "a follow-up sequence", re_lead: "a property enquiry", service_request: "a service request",
  chat_training: "AI chat training", marketing_lead: "a marketing lead",
};
const CONTENT_NOUNS: Record<string, string> = {
  testimonial: "a testimonial", testimonial_group: "a testimonial group", portfolio_item: "a portfolio item", portfolio_group: "a portfolio group",
  service: "a service", service_group: "a service group", service_category: "a service category", pricing_package: "a pricing package", pricing_table: "a pricing table",
  slider: "a slider", slide: "a slide", feature_group: "a feature group", feature: "a feature", collection_type: "a collection", collection_entry: "a collection entry", collection_category: "a collection category",
  property: "a property", community: "a community", developer: "a developer", result: "a result", result_course: "a results course", campaign: "a campaign", client_invoice: "a client invoice",
  job: "a job", scheduled_post: "a scheduled post", vendor: "a vendor", vendor_service: "a vendor service", branch: "a branch", expert: "an expert listing", redirect: "a redirect", domain_order: "a domain order",
  donor: "a donor", blood_request: "a blood request",
};
const SETTING_NOUNS: Record<string, string> = { api_key: "an API key", token: "an AI connection key" };
const NOUNS: Record<string, string> = { ...SHOP_NOUNS, ...BOOKING_NOUNS, ...LEAD_NOUNS, ...CONTENT_NOUNS, ...SETTING_NOUNS, media: "media" };
const VERBS: Record<string, string> = { create: "Added", edit: "Edited", delete: "Removed", status: "Changed the status of" };
const nounPrefixes = (nouns: Record<string, string>) => Object.keys(nouns);

const PAGE_TOOLS = ["save_page_blocks", "publish_page", "create_page", "create_post", "update_page_meta", "trash_page", "schedule_post", "find_replace_text", "set_block_image"];
const SITE_TOOLS = ["create_site", "delete_site", "set_site_status", "set_site_dates", "transfer_site_ownership"];
const SETTING_TOOLS = ["set_site_header", "set_site_branding", "update_business_profile", "upsert_menu", "upsert_redirect"];
const BILLING_TOOLS = ["set_site_plan", "set_ai_credits"];
const SHOP_TOOLS = ["upsert_product", "upsert_category", "update_order_status"];
const LEAD_TOOLS = ["add_lead_note", "change_lead_stage", "add_chat_training", "delete_chat_training"];
const USER_TOOLS = ["create_user", "add_site_member", "remove_site_member", "confirm_user_email", "set_user_password", "send_password_reset", "set_user_active", "delete_user"];
const tools = (list: string[]) => list.flatMap((t) => [`action.eq.mcp.${t}`, `action.eq.app.${t}`]);
/** Phone app writes to panel routes are logged with an app. prefix. */
const prefixes = (list: string[]) => list.flatMap((p) => [`action.like.${p}.*`, `action.like.app.${p}.*`]);

/** PostgREST or() filter for a category, or null for an unknown one. */
export function categoryFilter(category: string | null | undefined): string | null {
  switch (category) {
    case "pages": return [...prefixes(["page", "post"]), ...tools(PAGE_TOOLS)].join(",");
    case "shop": return [...prefixes(nounPrefixes(SHOP_NOUNS)), ...tools(SHOP_TOOLS)].join(",");
    case "media": return [...prefixes(["media"]), ...tools(["upload_media"])].join(",");
    case "bookings": return [...prefixes(["booking_hours", ...nounPrefixes(BOOKING_NOUNS)]), ...tools(["update_booking"])].join(",");
    case "leads": return [...prefixes(["chat_reply", ...nounPrefixes(LEAD_NOUNS)]), ...tools(LEAD_TOOLS)].join(",");
    case "content": return prefixes(nounPrefixes(CONTENT_NOUNS)).join(",");
    case "sites": return [...prefixes(["site", "demo"]), ...tools(SITE_TOOLS)].join(",");
    case "settings": return [...prefixes(["settings", "platform", "platform_settings", "homepage", ...nounPrefixes(SETTING_NOUNS)]), ...tools(SETTING_TOOLS)].join(",");
    case "billing": return [...prefixes(["billing", "subscription", "payment", "invoice"]), "action.eq.set_ai_credits", ...tools(BILLING_TOOLS)].join(",");
    case "users": return [...prefixes(["user", "member", "sa"]), "action.eq.staff.add", "action.eq.staff.remove", "action.eq.staff.manager", "action.eq.staff.status", "action.eq.staff.edit", "action.like.staff.act_as*", "action.like.app.staff.*", ...tools(USER_TOOLS)].join(",");
    case "signins": return "action.eq.auth.sign_in";
    case "tickets": return [...prefixes(["ticket", "support_ai"]), "action.eq.manager.ticket"].join(",");
    case "projects": return "action.like.pm.*";
    case "attendance": return prefixes(["attendance"]).join(",");
    case "opens": return "action.eq.staff.open_site";
    case "mcp": return "via.eq.mcp";
    case "app": return "via.eq.app";
    case "visitors": return "via.eq.visitor";
    default: return null;
  }
}

const LABELS: Record<string, string> = {
  "page.create": "Created a page", "page.edit": "Edited a page", "page.publish": "Published a page",
  "page.publish_changes": "Published changes to a page", "page.unpublish": "Unpublished a page", "page.status": "Changed a page's status",
  "page.trash": "Moved a page to the trash", "page.restore": "Restored a page from the trash", "page.delete": "Permanently deleted pages",
  "post.create": "Created a blog post", "post.edit": "Edited a blog post", "post.publish": "Published a blog post",
  "post.publish_changes": "Published changes to a blog post", "post.unpublish": "Unpublished a blog post", "post.status": "Changed a blog post's status",
  "post.trash": "Moved a blog post to the trash", "post.restore": "Restored a blog post from the trash", "post.delete": "Permanently deleted blog posts",

  "site.create": "Created a site", "site.delete": "Deleted a site", "site.edit": "Changed site details",
  "site.owner": "Changed the site's owner", "site.transfer_ownership": "Transferred a site to a new owner",
  "site.schedule_delete": "Scheduled a site for deletion", "site.cancel_delete": "Cancelled a site's scheduled deletion",
  "site.plan": "Changed a site's plan", "site.status": "Changed a site's status", "site.assign": "Changed who is responsible for a site",
  "site.domain": "Changed a site's domain", "site.layout_lock": "Changed a site's layout lock",

  "billing.create": "Added a subscription", "billing.delete": "Removed a subscription", "billing.plan": "Changed a subscription's plan",
  "billing.status": "Changed a subscription's status", "billing.edit": "Changed billing details",
  "billing.payment": "Recorded a payment", "billing.payment_edit": "Edited a payment", "billing.payment_delete": "Removed a payment",
  "billing.adjustment": "Added a billing adjustment", "billing.adjustment_edit": "Edited a billing adjustment", "billing.adjustment_delete": "Removed a billing adjustment",
  "set_ai_credits": "Set a site's AI credits",

  "member.add": "Added a team member", "member.remove": "Removed a team member", "member.role": "Changed a team member's role",
  "staff.add": "Added a staff member", "staff.remove": "Removed a staff member", "staff.manager": "Changed who is a Staff Manager",
  "staff.status": "Changed a staff member's status", "staff.edit": "Edited a staff member", "staff.open_site": "Opened a client's dashboard",
  "sa.add": "Added a super admin", "sa.remove": "Removed a super admin",
  "auth.sign_in": "Signed in",
  "media.upload": "Uploaded media", "product.variants": "Changed a product's variants", "booking_hours.edit": "Changed booking hours", "chat_reply.create": "Replied in site chat",
  "token.edit": "Revoked an AI connection key",

  "order.public": "Order placed on the site", "lead.public": "New lead from the site", "form.public": "Form submitted on the site", "booking.public": "Booking made on the site",
  "re_lead.public": "Property enquiry on the site", "reservation.public": "Reservation made on the site", "price_request.public": "Price request on the site", "review.public": "Review left on the site",
  "service_request.public": "Service request on the site", "marketplace_booking.public": "Marketplace booking on the site", "donor.public": "Donor signed up on the site",
  "blood_request.public": "Blood request on the site", "marketing_lead.public": "Lead from the Passive Coder site",
  "user.create": "Created a user account", "user.invite": "Invited a user", "user.delete": "Deleted a user account",
  "user.password": "Set a user's password", "user.reset_link": "Made a password reset link", "user.ban": "Blocked or unblocked a user's sign-in",
  "user.email": "Changed a user's email", "user.verify": "Confirmed a user's email", "user.active": "Activated or deactivated a user", "user.role": "Changed a user's role",

  "ticket.create": "Opened a ticket", "ticket.delete": "Deleted tickets", "ticket.status": "Changed a ticket's status", "ticket.assign": "Assigned a ticket",
  "ticket.edit": "Edited a ticket", "ticket.update": "Updated a ticket", "ticket.reply": "Replied to a ticket", "ticket.note": "Added an internal note to a ticket",

  "manager.assign_sites": "Assigned sites to a person", "manager.handover": "Handed one person's work to another",
  "manager.ticket": "Changed a ticket from Team Manager", "manager.decide": "Decided a staff request",

  "pm.project_created": "Created a project", "pm.task_created": "Created a task", "pm.task_updated": "Updated a task", "pm.task_deleted": "Deleted a task",
  "pm.task_status": "Changed a task's status", "pm.task_assigned": "Assigned a task", "pm.time_logged": "Logged time on a task",

  "subscription.create": "Added a subscription", "subscription.update": "Changed a subscription",
  "subscription.approve": "Approved a manual payment", "payment.email": "Emailed a payment receipt",
  "payment.record": "Recorded a payment", "payment.void": "Voided a payment",
  "invoice.void": "Voided an invoice", "invoice.send": "Sent an invoice",
  "cost.create": "Added a company cost", "cost.edit": "Edited a company cost", "cost.stop": "Stopped a repeating cost", "cost.delete": "Removed a company cost",
  "pricing.update": "Changed plan prices",
  "invoice.create": "Created an invoice", "homepage.update": "Edited the homepage", "platform_settings.update": "Changed platform settings",
  "attendance.approve": "Approved an attendance entry", "attendance.reject": "Rejected an attendance entry",
  "attendance.entry": "Entered attendance time for someone", "attendance.override": "Changed someone's attendance time",
  "attendance.delete": "Removed an attendance entry", "attendance.settings": "Changed attendance settings",
  "attendance.leave_approve": "Approved a leave request", "attendance.leave_reject": "Rejected a leave request",
  "attendance.holiday": "Added a holiday", "attendance.holiday_delete": "Removed a holiday",
  "attendance.edit_approve": "Approved a time change", "attendance.edit_changed": "Changed and approved a time change", "attendance.edit_reject": "Rejected a time change",
  "attendance.place": "Changed where someone worked (office or home)", "attendance.warning_withdraw": "Withdrew an attendance warning",
  "attendance.month_notes": "Wrote attendance review notes", "attendance.month_review": "Marked an attendance month reviewed",
  "attendance.month_lock": "Locked an attendance month", "attendance.month_unlock": "Unlocked an attendance month",
  "staff.act_as_start": "Entered a staff member's portal (view as)", "staff.act_as_end": "Left a staff member's portal",
  "staff.act_as_write": "Acted in a staff member's portal", "staff.act_as_refused": "Was refused while viewing as staff",
  "release.merged": "Merged a code change into main", "release.deploy_ready": "Release is live (Production deploy Ready)",
  "release.deploy_error": "Release failed to deploy (Production)",
  "demo.create": "Created a demo site", "demo.extend": "Extended a demo", "demo.golive": "Took a demo live",
};

const TOOL_LABELS: Record<string, string> = {
  save_page_blocks: "Saved page content", publish_page: "Published a page", create_page: "Created a page", create_post: "Created a blog post",
  update_page_meta: "Changed a page's details", trash_page: "Moved a page to the trash", schedule_post: "Scheduled a blog post", find_replace_text: "Replaced text on the site",
  set_block_image: "Changed an image on a page", upload_media: "Uploaded media", upsert_product: "Saved a product", upsert_category: "Saved a category",
  set_site_header: "Changed the site's header", set_site_branding: "Changed the site's branding", update_business_profile: "Changed the business profile",
  upsert_menu: "Saved a menu", upsert_redirect: "Saved a redirect", create_site: "Created a site", delete_site: "Deleted a site", set_site_status: "Changed a site's status",
  set_site_dates: "Changed a site's dates", set_site_plan: "Changed a site's plan", set_ai_credits: "Set a site's AI credits", transfer_site_ownership: "Transferred a site to a new owner",
  create_user: "Created a user account", add_site_member: "Added a team member", remove_site_member: "Removed a team member", confirm_user_email: "Confirmed a user's email",
  set_user_password: "Set a user's password", send_password_reset: "Sent a password reset", set_user_active: "Activated or deactivated a user", delete_user: "Deleted a user account",
  update_booking: "Updated a booking", update_order_status: "Updated an order", add_lead_note: "Added a note to a lead", change_lead_stage: "Moved a lead to another stage",
  add_chat_training: "Added AI chat training", delete_chat_training: "Removed AI chat training",
};

const SETTING_TABLES: Record<string, string> = {
  site_settings: "site settings", site_identity: "site identity", tenant_business_profiles: "the business profile", nav_menus: "a menu",
  tenant_email_settings: "email settings", tenant_integrations: "integrations", tenant_payment_methods: "payment methods",
  booking_settings: "booking settings", tenant_alias_domains: "alias domains", platform_settings: "platform settings", plans: "plans", plan_prices: "plan prices",
  re_settings: "real estate settings", results_settings: "results settings", donor_settings: "donor settings", backup_settings: "backup settings",
  partners: "a partner", care_plans: "care plans", care_prices: "care prices", ai_generation_packages: "AI credit packages", support_departments: "support departments", homepage_settings: "homepage settings", company_costs: "company costs",
};

const words = (s: string) => {
  const t = s.replace(/[._]/g, " ").trim();
  return t ? t[0].toUpperCase() + t.slice(1) : t;
};

const DB_VERBS: Record<string, string> = { insert: "Added", update: "Changed", delete: "Removed" };
const DB_TABLES: Record<string, string> = {
  tenants: "a site", tenant_members: "a site member", profiles: "a user", super_admins: "a super admin", pc_staff: "a staff member", partners: "a partner",
  subscriptions: "a subscription", subscription_payments: "a payment", subscription_adjustments: "a billing adjustment", subscription_invoices: "an invoice",
  plans: "a plan", plan_prices: "plan prices", care_plans: "a care plan", care_prices: "care prices", platform_settings: "platform settings",
  homepage_settings: "homepage settings", payment_gateways: "a payment gateway", site_settings: "site settings", tenant_payment_methods: "a payment method",
  attendance_sessions: "an attendance entry", attendance_settings: "attendance settings",
};

export function actionLabel(action: string): string {
  if (LABELS[action]) return LABELS[action];
  const db = /^db\.([a-z_]+)\.(insert|update|delete)$/.exec(action);
  if (db) return `${DB_VERBS[db[2]]} ${DB_TABLES[db[1]] ?? words(db[1]).toLowerCase()} in the database`;
  const content = /^([a-z_]+)\.(create|edit|delete|status)$/.exec(action);
  if (content && NOUNS[content[1]]) return `${VERBS[content[2]]} ${NOUNS[content[1]]}`;
  const tool = /^(?:mcp|app)\.(.+)$/.exec(action)?.[1];
  if (tool) return TOOL_LABELS[tool] ?? LABELS[tool] ?? words(tool);
  const setting = /^(?:settings|platform)\.([a-z_]+?)(\.delete)?$/.exec(action);
  if (setting) return `${setting[2] ? "Removed" : "Changed"} ${SETTING_TABLES[setting[1]] ?? words(setting[1]).toLowerCase()}`;
  return words(action);
}

/** Before and after are only ever shown for these columns. */
const FIELD_LABELS: Record<string, string> = {
  status: "Status", plan: "Plan", plan_id: "Plan", role: "Role", slug: "Address", name: "Name", custom_domain: "Domain", owner_id: "Owner",
  billing_cycle: "Billing cycle", discount_pct: "Discount %", currency: "Currency", payment_method: "Payment method", priority: "Priority", department: "Department",
  is_manager: "Staff Manager", is_active: "Active", layout_locked: "Layout lock", delete_scheduled_for: "Scheduled delete", demo_expires_at: "Demo ends", trial_ends_at: "Trial ends",
  next_payment_due: "Next payment", current_period_end: "Period ends", platform_paid_until: "Paid until", care_plan_id: "Care plan", care_paid_until: "Care paid until",
  amount_cents: "Amount", custom_amount_cents: "Custom amount", balance_due_cents: "Balance due", total_paid_cents: "Total paid", ai_credits_purchased: "AI credits", pages_limit_override: "Page limit",
  display_title: "Title", commission_rate: "Commission", staff_recurring_pct: "Recurring %", site_chat_enabled: "Site chat", assigned_to: "Assigned to", assigned_staff_id: "Assigned staff", assigned_admin_id: "Assigned admin",
  email_verified_at: "Email confirmed",
  start: "Start", end: "End", enabled: "On", radius: "Radius (m)", pin: "Office pin", place: "Place",
  payment_status: "Payment", delivery_status: "Delivery", kitchen_status: "Kitchen", approval_status: "Approval", published: "Published", listed: "Listed", verification_status: "Verification", price: "Price", compare_price: "Compare price", stage_id: "Stage",
};

const CENTS = /_cents$/;
const ID_FIELD = /(^owner_id$|^assigned_)/;
const show = (key: string, v: unknown): string => {
  if (v === null || v === undefined || v === "") return "none";
  if (typeof v === "boolean") return v ? "yes" : "no";
  if (CENTS.test(key) && typeof v === "number") return (v / 100).toLocaleString("en-US");
  if (ID_FIELD.test(key)) return "changed";
  const s = String(v);
  if (/^\d{4}-\d{2}-\d{2}T/.test(s)) return s.slice(0, 10);
  return s.length > 60 ? `${s.slice(0, 60)}...` : s;
};

/** Names shown for columns that changed where only the name was kept. */
const humanField = (c: string) => FIELD_LABELS[c] ?? words(c).toLowerCase();

export type FeedRow = {
  id: string; created_at: string; actor_id: string | null; action: string; tenant_id: string | null; target_user_id: string | null;
  via: string | null; ok: boolean | null; error: string | null; args: Record<string, unknown> | null;
  before: Record<string, unknown> | null; after: Record<string, unknown> | null;
  actor_name: string | null; actor_role: string | null; site_name: string | null;
  /** Why a script made a database change (pc.reason), migration 227. */
  reason?: string | null;
};

/** The short subject of an action: a page title, ticket subject or account email. */
function subject(row: FeedRow): string | null {
  const a = row.args ?? {};
  for (const k of ["title", "subject", "newOwnerEmail", "email", "name", "slug"]) {
    const v = a[k];
    if (typeof v === "string" && v.trim()) return v.trim().slice(0, 80);
  }
  return null;
}

/** "What changed", for those allowed to see client data. Never reads raw tool arguments beyond the allowlists. */
export function changeSummary(row: FeedRow): string[] {
  if (row.via === "release") return releaseSummary(row);
  if (row.via === "database") return databaseSummary(row);
  const out: string[] = [];
  const s = subject(row);
  if (s) out.push(s);
  const before = row.before ?? {};
  const after = row.after ?? {};
  const shown = new Set<string>();
  for (const k of Object.keys(after)) {
    if (!FIELD_LABELS[k]) continue;
    shown.add(k);
    out.push(`${FIELD_LABELS[k]}: ${show(k, before[k])} to ${show(k, after[k])}`);
  }
  const a = row.args ?? {};
  if (row.action === "site.transfer_ownership") {
    out.push(a.credentialsSet === true ? "Password was set" : "No password set");
    out.push(a.previousOwnerAction === "remove" ? "Old owner removed" : "Old owner kept as admin");
    if (a.toSelf === true) out.push("Transferred to themselves");
  }
  if (typeof a.amountCents === "number") out.push(`Amount: ${show("amount_cents", a.amountCents)}${typeof a.currency === "string" ? ` ${a.currency}` : ""}`);
  if (typeof a.role === "string" && !shown.has("role")) out.push(`Role: ${a.role}`);
  if (typeof a.count === "number" && a.count > 1) out.push(`${a.count} of these in 15 minutes`);
  if (a.capped === true) out.push("More of these within 10 minutes are not listed");
  if (Array.isArray(a.changed)) {
    const rest = a.changed.filter((c): c is string => typeof c === "string" && !shown.has(c)).map(humanField);
    if (rest.length) out.push(`Changed: ${rest.slice(0, 8).join(", ")}`);
  }
  return out;
}

/** A release row: PR, version and where it was deployed. */
function releaseSummary(row: FeedRow): string[] {
  const a = row.args ?? {};
  const out: string[] = [];
  const s = subject(row);
  if (s) out.push(s);
  if (typeof a.pr === "number") out.push(`PR #${a.pr}`);
  if (typeof a.version === "string") out.push(`Version ${a.version}`);
  if (typeof a.sha === "string") out.push(`Commit ${a.sha.slice(0, 7)}`);
  if (typeof a.deploy === "string") out.push(`Deploy: ${a.deploy === "success" ? "Ready" : a.deploy}`);
  const url = typeof a.url === "string" && row.action !== "release.merged" ? a.url : typeof a.deployUrl === "string" ? a.deployUrl : null;
  if (url) out.push(url.slice(0, 120));
  return out;
}

/** A database row: table, every changed column (values already compacted and redacted by the trigger), and the reason. */
function databaseSummary(row: FeedRow): string[] {
  const a = row.args ?? {};
  const out: string[] = [];
  if (typeof a.name === "string" && a.name.trim()) out.push(a.name.trim().slice(0, 80));
  out.push(`Table: ${String(a.table ?? "?")}${typeof a.id === "string" ? `, row ${a.id.slice(0, 36)}` : ""}`);
  const before = row.before ?? {};
  const after = row.after ?? {};
  const keys = Array.from(new Set([...Object.keys(after), ...Object.keys(before)]));
  for (const k of keys.slice(0, 10)) {
    const label = FIELD_LABELS[k] ?? humanField(k);
    if (row.action.endsWith(".update")) out.push(`${label}: ${show(k, before[k])} to ${show(k, after[k])}`);
    else out.push(`${label}: ${show(k, k in after ? after[k] : before[k])}`);
  }
  if (keys.length > 10) out.push(`${keys.length - 10} more columns`);
  if (typeof a.moreRows === "number" && a.moreRows > 0) out.push(`And ${a.moreRows} more rows in the same change`);
  out.push(row.reason ? `Reason: ${row.reason.slice(0, 200)}` : "No reason given");
  if (typeof a.client === "string" && a.client) out.push(`Client: ${a.client}`);
  return out;
}

export const ROLE_LABELS: Record<string, string> = { super_admin: "Super Admin", manager: "Staff Manager", staff: "Staff", client: "Client" };
/** The source tag on every row. */
export const VIA_LABELS: Record<string, string> = { web: "Panel", mcp: "Claude / MCP", app: "Phone app", release: "Release", database: "Database / script", visitor: "Visitor" };
/** Rows no person made: public forms, checkout, automation. */
export const VISITOR_VIA = "visitor";
