import { createAdminClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email";

/**
 * CRM follow-up sequences. A tenant defines ordered steps (email to the lead,
 * WhatsApp-link task or plain task for staff) with a delay from enrolment.
 * enrollInSequences() is called right after upsertContact(); due steps run
 * from /api/cron/crm-sequences (and delay-0 steps run immediately).
 */

export type SequenceTrigger = "booking" | "enquiry" | "order" | "experts_enquiry" | "any";
export type StepKind = "email" | "whatsapp_task" | "task";

export interface SequenceStep {
  id: string;
  delay_hours: number;          // from enrolment
  kind: StepKind;
  subject?: string;
  body?: string;
  wa_message?: string;
}

export interface SequenceVars {
  name?: string | null;
  service?: string | null;
  site_name?: string | null;
  phone?: string | null;
}

export const SEQUENCE_TRIGGERS: SequenceTrigger[] = ["any", "booking", "enquiry", "order", "experts_enquiry"];

/** Chase sequences: they stop when the lead writes again, is talked to, or books. */
const CHASE_SOURCES = new Set(["enquiry", "experts_enquiry"]);
export const STEP_KINDS: StepKind[] = ["email", "whatsapp_task", "task"];

export function starterSteps(): SequenceStep[] {
  return [
    { id: "s1", delay_hours: 0, kind: "email", subject: "Thanks {name}, we received your request",
      body: "Hi {name},\n\nThank you for contacting {site_name}. We have received your {service} request and will get back to you shortly.\n\nBest regards,\n{site_name}" },
    { id: "s2", delay_hours: 0, kind: "whatsapp_task",
      wa_message: "Hello {name}, this is {site_name} about your {service} request. When is a good time to talk?" },
    { id: "s3", delay_hours: 24, kind: "task", subject: "Follow up with {name}" },
    { id: "s4", delay_hours: 72, kind: "email", subject: "Following up on your {service} request",
      body: "Hi {name},\n\nJust checking in on your {service} request. Reply to this email or call us if you have any questions.\n\nBest regards,\n{site_name}" },
  ];
}

/**
 * Experts enquiry follow-up, ported from ExpertNear.Me's "New enquiry
 * follow-up" (lib/follow-up/defaults.ts): a same-day WhatsApp task, then four
 * plain nudges at 1, 3, 7 and 21 days that read like the owner typed them.
 * Stops on reply, booking, won/lost or unsubscribe (see advanceRun).
 */
export const EXPERTS_STARTER_NAME = { en: "Experts enquiry follow-up", bn: "Experts এনকোয়ারি ফলো-আপ" } as const;

export function expertsStarterSteps(lang: "en" | "bn" = "en"): SequenceStep[] {
  const sign = "\n\n{site_name}";
  if (lang === "bn") return [
    { id: "s1", delay_hours: 0, kind: "whatsapp_task",
      wa_message: "আসসালামু আলাইকুম {name}, আমি {site_name} থেকে বলছি। Experts-এ আপনার এনকোয়ারি পেয়েছি। কখন কথা বলা যায়?" },
    { id: "s2", delay_hours: 24, kind: "email", subject: "আপনার এনকোয়ারির বিষয়ে",
      body: "হ্যালো {name},\n\nআপনার এনকোয়ারির উত্তর আপনি দেখেছেন কিনা নিশ্চিত হতে চাইছিলাম।\n\nকাজটি কি এখনও করাতে চান? কোনো প্রশ্ন থাকলে বা আনুমানিক দাম জানতে চাইলে জানাবেন।\n\nএই ইমেইলের উত্তর দিলেই আমি যোগাযোগ করব।" + sign },
    { id: "s3", delay_hours: 72, kind: "email", subject: "এখনও কি সাহায্য লাগবে?",
      body: "হ্যালো {name},\n\nআরেকবার খোঁজ নিচ্ছি, এই কাজে কি এখনও সাহায্য দরকার?\n\nএখন সময় না হলে কোনো সমস্যা নেই। শুধু জানিয়ে দিন।" + sign },
    { id: "s4", delay_hours: 168, kind: "email", subject: "আর কিছু করতে পারি?",
      body: "হ্যালো {name},\n\nআপনার কাছ থেকে উত্তর পাইনি, তাই ধরে নিচ্ছি আপাতত সমাধান হয়ে গেছে।\n\nপরে কিছু লাগলে বা কোটেশন চাইলে এখানে উত্তর দিন। আপনার তথ্য রেখে দিলাম।" + sign },
    { id: "s5", delay_hours: 504, kind: "email", subject: "এনকোয়ারিটি বন্ধ করছি",
      body: "হ্যালো {name},\n\nএ বিষয়ে এটাই আমার শেষ মেসেজ, এনকোয়ারিটি বন্ধ করছি।\n\nভবিষ্যতে কিছু দরকার হলে যোগাযোগ করবেন।\n\nশুভকামনা।" + sign },
  ];
  return [
    { id: "s1", delay_hours: 0, kind: "whatsapp_task",
      wa_message: "Hi {name}, this is {site_name}. I got your enquiry on Experts. When is a good time to talk?" },
    { id: "s2", delay_hours: 24, kind: "email", subject: "Following up on your enquiry",
      body: "Hi {name},\n\nI wanted to make sure you saw my earlier reply about your enquiry.\n\nAre you still looking to get this sorted? Happy to answer any questions or give you a rough price.\n\nJust reply to this message and I'll get back to you." + sign },
    { id: "s3", delay_hours: 72, kind: "email", subject: "Still need a hand?",
      body: "Hi {name},\n\nChecking in once more: are you still looking for help with this?\n\nIf the timing isn't right, no problem at all. Just let me know and I'll leave you to it." + sign },
    { id: "s4", delay_hours: 168, kind: "email", subject: "Anything I can help with?",
      body: "Hi {name},\n\nI haven't heard back, so I'll assume you're sorted for now.\n\nIf anything changes, or you'd like a quote later on, just reply here. I'll keep your details on file." + sign },
    { id: "s5", delay_hours: 504, kind: "email", subject: "Closing this off",
      body: "Hi {name},\n\nLast message from me on this one. I'll close the enquiry off.\n\nIf you need anything in future, you know where to find me.\n\nAll the best." + sign },
  ];
}

export function sanitizeSteps(raw: unknown): SequenceStep[] {
  if (!Array.isArray(raw)) return [];
  return raw.slice(0, 20).map((s, i) => {
    const o = (s ?? {}) as Record<string, unknown>;
    const kind = STEP_KINDS.includes(o.kind as StepKind) ? (o.kind as StepKind) : "task";
    const delay = Math.max(0, Math.min(24 * 365, Number(o.delay_hours) || 0));
    const str = (v: unknown, n: number) => (typeof v === "string" ? v.slice(0, n) : "");
    return {
      id: str(o.id, 40) || `s${i + 1}`,
      delay_hours: delay,
      kind,
      subject: str(o.subject, 300),
      body: str(o.body, 10000),
      wa_message: str(o.wa_message, 2000),
    };
  });
}

export function fillTemplate(text: string | undefined, vars: SequenceVars): string {
  return (text ?? "").replace(/\{(name|service|site_name|phone)\}/g, (_, k: keyof SequenceVars) => {
    const v = vars[k];
    if (v) return String(v);
    return k === "name" ? "there" : k === "service" ? "service" : "";
  });
}

function orderedSteps(steps: SequenceStep[]): SequenceStep[] {
  return [...steps].sort((a, b) => a.delay_hours - b.delay_hours);
}

type Admin = Awaited<ReturnType<typeof createAdminClient>>;

/** Enrol a contact in every enabled sequence matching the trigger. Never throws. */
export async function enrollInSequences(
  tenantId: string,
  contactId: string | null | undefined,
  trigger: Exclude<SequenceTrigger, "any">,
  vars: SequenceVars = {},
): Promise<void> {
  if (!tenantId || !contactId) return;
  try {
    const admin = await createAdminClient();
    const { data: found } = await admin.from("crm_sequences")
      .select("id, steps, trigger").eq("tenant_id", tenantId).eq("enabled", true)
      .in("trigger", trigger === "experts_enquiry" ? ["experts_enquiry", "enquiry", "any"] : [trigger, "any"]);
    // An Experts enquiry is an enquiry: it runs the site's "enquiry" sequences
    // unless the site has a dedicated Experts one.
    const seqs = trigger === "experts_enquiry" && found?.some((s) => s.trigger === "experts_enquiry")
      ? found.filter((s) => s.trigger !== "enquiry") : found;
    if (!seqs?.length) return;

    if (!vars.site_name) {
      const { data: t } = await admin.from("tenants").select("name").eq("id", tenantId).maybeSingle();
      vars = { ...vars, site_name: t?.name ?? "" };
    }

    const now = Date.now();
    const runIds: string[] = [];
    for (const s of seqs) {
      const steps = orderedSteps(sanitizeSteps(s.steps));
      if (!steps.length) continue;
      const { data: run } = await admin.from("crm_sequence_runs").insert({
        tenant_id: tenantId, sequence_id: s.id, contact_id: contactId, source: trigger,
        vars, next_step: 0, next_run_at: new Date(now + steps[0].delay_hours * 3600_000).toISOString(),
      }).select("id").maybeSingle(); // unique index rejects a 2nd active run
      if (run?.id && steps[0].delay_hours === 0) runIds.push(run.id);
    }
    if (runIds.length) await processRuns(admin, runIds);
    // Vercel Hobby only allows a daily cron, so each new lead also sweeps
    // other runs that have come due since (cheap, capped at 200).
    await processRuns(admin);
  } catch (e) {
    console.error("[crm-sequences] enrol failed", e);
  }
}

interface RunRow {
  id: string; tenant_id: string; sequence_id: string; contact_id: string; source: string | null;
  vars: SequenceVars | null; next_step: number; created_at: string; status: string;
}

/** Execute all due steps for the given runs (or all due runs when ids omitted). */
export async function processRuns(admin: Admin, runIds?: string[]): Promise<{ runs: number; steps: number }> {
  const nowIso = new Date().toISOString();
  let q = admin.from("crm_sequence_runs")
    .select("id, tenant_id, sequence_id, contact_id, source, vars, next_step, created_at, status")
    .eq("status", "active").lte("next_run_at", nowIso).order("next_run_at").limit(200);
  if (runIds) q = q.in("id", runIds);
  const { data: runs } = await q;

  let executed = 0;
  for (const run of (runs ?? []) as RunRow[]) {
    try { executed += await advanceRun(admin, run); }
    catch (e) { console.error("[crm-sequences] run failed", run.id, e); }
  }
  return { runs: runs?.length ?? 0, steps: executed };
}

/**
 * Stop rules for chase sequences (ported from ExpertNear.Me's follow-up
 * engine): "booked" when a booking lands after enrolment; "replied" when the
 * lead writes again (a new form/chat lead) or staff log a call, WhatsApp,
 * email or note by hand (actor set; sequence events carry none).
 */
async function chaseStopReason(admin: Admin, run: RunRow): Promise<"booked" | "replied" | null> {
  const { data } = await admin.from("contact_events").select("type, actor_user_id")
    .eq("contact_id", run.contact_id).gt("created_at", run.created_at)
    .in("type", ["booking", "form_submission", "call", "whatsapp", "email", "note"]).limit(50);
  const evs = (data ?? []) as { type: string; actor_user_id: string | null }[];
  if (evs.some((e) => e.type === "booking")) return "booked";
  if (evs.some((e) => e.type === "form_submission" || !!e.actor_user_id)) return "replied";
  return null;
}

async function stopRun(admin: Admin, id: string, status: "done" | "stopped", reason?: string) {
  await admin.from("crm_sequence_runs")
    .update({ status, stop_reason: reason ?? null, updated_at: new Date().toISOString() }).eq("id", id);
}

async function advanceRun(admin: Admin, run: RunRow): Promise<number> {
  const [{ data: seq }, { data: contact }] = await Promise.all([
    admin.from("crm_sequences").select("enabled, steps").eq("id", run.sequence_id).maybeSingle(),
    admin.from("contacts")
      .select("id, first_name, last_name, email, phone, whatsapp, tags, custom, stage_id, crm_stages(is_won, is_lost)")
      .eq("id", run.contact_id).maybeSingle(),
  ]);
  if (!seq || !seq.enabled) { await stopRun(admin, run.id, "stopped", "sequence_disabled"); return 0; }
  if (!contact) { await stopRun(admin, run.id, "stopped", "contact_deleted"); return 0; }

  const stage = (Array.isArray(contact.crm_stages) ? contact.crm_stages[0] : contact.crm_stages) as { is_won: boolean; is_lost: boolean } | null;
  if (stage?.is_won || stage?.is_lost) { await stopRun(admin, run.id, "stopped", stage.is_won ? "won" : "lost"); return 0; }
  const tags = (contact.tags ?? []) as string[];
  const custom = (contact.custom ?? {}) as Record<string, unknown>;
  const unsubscribed = tags.includes("unsubscribed") || custom.unsubscribed === true;
  if (unsubscribed) { await stopRun(admin, run.id, "stopped", "unsubscribed"); return 0; }
  if (run.source && CHASE_SOURCES.has(run.source)) {
    const why = await chaseStopReason(admin, run);
    if (why) { await stopRun(admin, run.id, "stopped", why); return 0; }
  }

  const steps = orderedSteps(sanitizeSteps(seq.steps));
  const start = new Date(run.created_at).getTime();
  const name = [contact.first_name, contact.last_name].filter(Boolean).join(" ") || (run.vars?.name ?? "");
  const vars: SequenceVars = { ...(run.vars ?? {}), name, phone: contact.phone ?? run.vars?.phone ?? "" };
  const contactLabel = name || contact.email || contact.phone || "contact";

  let i = run.next_step;
  let done = 0;
  while (i < steps.length && start + steps[i].delay_hours * 3600_000 <= Date.now()) {
    await executeStep(admin, run, steps[i], vars, contact, contactLabel);
    i++; done++;
  }

  if (i >= steps.length) {
    await admin.from("crm_sequence_runs").update({ next_step: i, status: "done", updated_at: new Date().toISOString() }).eq("id", run.id);
  } else {
    await admin.from("crm_sequence_runs").update({
      next_step: i,
      next_run_at: new Date(start + steps[i].delay_hours * 3600_000).toISOString(),
      updated_at: new Date().toISOString(),
    }).eq("id", run.id);
  }
  return done;
}

async function executeStep(
  admin: Admin, run: RunRow, step: SequenceStep, vars: SequenceVars,
  contact: { id: string; email: string | null; phone: string | null; whatsapp: string | null },
  contactLabel: string,
) {
  const nowIso = new Date().toISOString();
  if (step.kind === "email") {
    if (!contact.email) return; // no address — skip silently
    const subject = fillTemplate(step.subject, vars) || `Message from ${vars.site_name ?? ""}`;
    const text = fillTemplate(step.body, vars);
    const safeName = (vars.site_name || "").replace(/[<>"\r\n]/g, "").slice(0, 60);
    const res = await sendEmail({
      brandTenantId: run.tenant_id,
      ...(safeName ? { from: `${safeName} <contact@noreply.passivecoder.com>` } : {}),
      to: contact.email,
      subject,
      text,
    });
    await admin.from("contact_events").insert({
      tenant_id: run.tenant_id, contact_id: contact.id, type: "email",
      title: res.ok ? `Sequence email sent: ${subject}` : `Sequence email failed: ${subject}`,
      body: text, meta: { sequence_id: run.sequence_id, run_id: run.id, step_id: step.id, error: res.error ?? null },
    });
    return;
  }

  let link: string | null = null;
  let title = fillTemplate(step.subject, vars);
  if (step.kind === "whatsapp_task") {
    const digits = (contact.whatsapp || contact.phone || "").replace(/\D/g, "");
    const msg = fillTemplate(step.wa_message, vars);
    if (digits) link = `https://wa.me/${digits}?text=${encodeURIComponent(msg)}`;
    title = title || `Send WhatsApp to ${contactLabel}`;
  } else {
    title = title || `Follow up with ${contactLabel}`;
  }

  const { data: tenant } = await admin.from("tenants").select("owner_id").eq("id", run.tenant_id).maybeSingle();
  await admin.from("crm_tasks").insert({
    tenant_id: run.tenant_id, contact_id: contact.id, title: title.slice(0, 300), due_at: nowIso,
    remind_via: "none", assignee_user_id: tenant?.owner_id ?? null, link,
  });
  await admin.from("contact_events").insert({
    tenant_id: run.tenant_id, contact_id: contact.id, type: "task",
    title: `Sequence task: ${title.slice(0, 200)}`, body: link,
    meta: { sequence_id: run.sequence_id, run_id: run.id, step_id: step.id },
  });
}
