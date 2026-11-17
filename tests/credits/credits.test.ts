/**
 * Unified AI Credits helper: costs, pool order, race safety, refund, zero,
 * root unlimited, once-per-conversation charging, warnings.
 * Run: npm run test:credits
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import type { SupabaseClient } from "@supabase/supabase-js";
import { FakeDb } from "../mcp/fake-supabase";
import { AiCreditsError, creditsWith, monthlyCreditsOf } from "../../src/lib/ai/credits";
import { CREDIT_COSTS, PLANLESS_MONTHLY_CREDITS, PLAN_MONTHLY_CREDITS } from "../../src/lib/ai/credit-costs";
import { ROOT_TENANT_SLUG } from "../../src/lib/flags";

const T = "aaaaaaaa-0000-4000-8000-000000000001";
const ROOT = "eeeeeeee-0000-4000-8000-000000000001";
const NOW = new Date("2026-11-15T12:00:00Z");
const NEXT_RESET = "2026-12-01T00:00:00.000Z";

type Tenant = Record<string, unknown>;

function setup(tenant: Tenant = {}) {
  const db = new FakeDb({
    tenants: [
      {
        id: T, slug: "site", plan: "pro", ai_credits_used_this_month: 0, ai_credits_purchased: 0,
        ai_credits_reset_at: NEXT_RESET, ai_free_build_credits: 0, ai_chat_day_count: 0, ai_chat_day_start: null, ...tenant,
      },
      { id: ROOT, slug: ROOT_TENANT_SLUG, plan: "free", ai_credits_used_this_month: 0, ai_credits_purchased: 2, ai_credits_reset_at: NEXT_RESET, ai_free_build_credits: 0, ai_chat_day_count: 200, ai_chat_day_start: "2026-11-15" },
    ],
    plans: [
      { id: "pro", modules: { ai_coder: { monthly_credits: 1500 } } },
      { id: "tiny", modules: { ai_coder: { monthly_credits: 30 } } },
    ],
    ai_credit_spends: [],
  });
  // ai_credit_spends_ref_uq
  db.onInsert = (table, row, all) =>
    table === "ai_credit_spends" && row.ref && all.some((r) => r.tenant_id === row.tenant_id && r.use_type === row.use_type && r.ref === row.ref && !r.refunded_at)
      ? { code: "23505", message: "duplicate key" } : null;
  db.rpcs.ai_credit_usage = ({ p_tenant }) => {
    const out = new Map<string, { use_type: string; credits: number; purchased_part: number; free_part: number }>();
    for (const r of db.rows("ai_credit_spends").filter((s) => s.tenant_id === p_tenant && !s.refunded_at)) {
      const u = out.get(r.use_type as string) ?? { use_type: r.use_type as string, credits: 0, purchased_part: 0, free_part: 0 };
      u.credits += r.credits as number; u.purchased_part += r.purchased_part as number; u.free_part += r.free_part as number;
      out.set(u.use_type, u);
    }
    return [...out.values()];
  };
  const notices: { dedupeKey: string; title: string }[] = [];
  const c = creditsWith({
    admin: async () => db as unknown as SupabaseClient,
    notify: async (n) => { notices.push({ dedupeKey: n.dedupeKey, title: n.title }); },
    backoffMs: 0,
    now: () => NOW,
  });
  const row = (id = T) => db.rows("tenants").find((t) => t.id === id)!;
  return { db, c, notices, row };
}

test("cost table: the owner's numbers", () => {
  assert.deepEqual(
    [CREDIT_COSTS.section, CREDIT_COSTS.project_plan, CREDIT_COSTS.assistant, CREDIT_COSTS.website_chat, CREDIT_COSTS.support_chat],
    [10, 10, 2, 1, 1],
  );
  assert.deepEqual(PLAN_MONTHLY_CREDITS, { basic: 250, pro: 1500, biz: 10500, custom: 2500 });
});

test("allowance: plan key, old key fallback, plan states with no row", () => {
  assert.equal(monthlyCreditsOf("pro", { ai_coder: { monthly_credits: 1500, monthly_generations: 100 } }), 1500);
  assert.equal(monthlyCreditsOf("new", { ai_coder: { monthly_generations: 20 } }), 250);
  assert.equal(monthlyCreditsOf("free", null), PLANLESS_MONTHLY_CREDITS.free);
  assert.equal(monthlyCreditsOf("trial", null), 50);
  assert.equal(monthlyCreditsOf("agency", null), 500);
  assert.equal(monthlyCreditsOf("whatever", null), 50);
});

test("spends monthly first, then purchased, and logs the use", async () => {
  const { c, db, row } = setup({ ai_credits_used_this_month: 1495, ai_credits_purchased: 100 });
  const r = await c.reserveCredits(T, "section", { userId: null, detail: "hero" });
  assert.deepEqual([r.credits, r.monthlyPart, r.purchasedPart], [10, 5, 5]);
  assert.equal(row().ai_credits_used_this_month, 1500);
  assert.equal(row().ai_credits_purchased, 95);
  const log = db.rows("ai_credit_spends");
  assert.equal(log.length, 1);
  assert.deepEqual([log[0].use_type, log[0].credits, log[0].monthly_part, log[0].purchased_part, log[0].detail], ["section", 10, 5, 5, "hero"]);
});

test("race: 25 concurrent spends for 10 credits' worth, exactly 10 succeed, balance never negative", async () => {
  const { c, row } = setup({ plan: "none", ai_credits_used_this_month: 50, ai_credits_purchased: 20 }); // 0 monthly left, 20 purchased
  const results = await Promise.allSettled(Array.from({ length: 25 }, () => c.reserveCredits(T, "assistant")));
  const ok = results.filter((r) => r.status === "fulfilled");
  assert.equal(ok.length, 10);
  assert.equal(row().ai_credits_purchased, 0);
  for (const r of results) {
    if (r.status === "rejected") assert.ok(r.reason instanceof AiCreditsError && ["no_credits", "busy"].includes(r.reason.code), String(r.reason));
  }
});

test("race: monthly pool cannot be overspent either", async () => {
  const { c, row, db } = setup({ plan: "tiny" });
  const results = await Promise.allSettled(Array.from({ length: 12 }, () => c.reserveCredits(T, "section")));
  assert.equal(results.filter((r) => r.status === "fulfilled").length, 3);
  assert.equal(row().ai_credits_used_this_month, 30);
  assert.equal(db.rows("ai_credit_spends").length, 3);
});

test("refund: back to the pools it came from, once, and off the breakdown", async () => {
  const { c, row } = setup({ ai_credits_used_this_month: 1495, ai_credits_purchased: 100 });
  const r = await c.reserveCredits(T, "section");
  await c.refundCredits(r);
  assert.equal(row().ai_credits_used_this_month, 1495);
  assert.equal(row().ai_credits_purchased, 100);
  await c.refundCredits(r);
  assert.equal(row().ai_credits_purchased, 100, "second refund does nothing");
  const s = await c.getCreditStatus(T);
  assert.equal(s!.breakdown.section, 0);
});

test("refund under concurrency keeps every credit", async () => {
  const { c, row } = setup({ ai_credits_purchased: 100, plan: "none", ai_credits_used_this_month: 50 });
  const rs = await Promise.all(Array.from({ length: 5 }, () => c.reserveCredits(T, "section")));
  assert.equal(row().ai_credits_purchased, 50);
  await Promise.all(rs.map((r) => c.refundCredits(r)));
  assert.equal(row().ai_credits_purchased, 100);
});

test("zero: denied with no_credits, nothing changes, nothing logged, owner warned once", async () => {
  const { c, db, row, notices } = setup({ ai_credits_used_this_month: 1500 });
  for (let i = 0; i < 3; i++) {
    await assert.rejects(c.reserveCredits(T, "website_chat"), (e: unknown) => e instanceof AiCreditsError && e.code === "no_credits");
  }
  assert.equal(row().ai_credits_used_this_month, 1500);
  assert.equal(db.rows("ai_credit_spends").length, 0);
  assert.equal(new Set(notices.map((n) => n.dedupeKey)).size, 1, "same key: delivered once a month");
  assert.equal(notices[0].dedupeKey, `ai-credits:${T}:2026-11:out`);
});

test("cost above what is left is denied without a partial spend", async () => {
  const { c, row } = setup({ ai_credits_used_this_month: 1495 });
  await assert.rejects(c.reserveCredits(T, "section"), (e: unknown) => e instanceof AiCreditsError && e.code === "no_credits");
  assert.equal(row().ai_credits_used_this_month, 1495);
  await c.reserveCredits(T, "website_chat");
  assert.equal(row().ai_credits_used_this_month, 1496, "chat can still run on the last credits");
});

test("root: unlimited, no balance change, no log, no daily cap", async () => {
  const { c, db, row, notices } = setup();
  const r = await c.reserveCredits(ROOT, "assistant");
  assert.equal(r.unlimited, true);
  assert.equal(r.credits, 0);
  assert.equal(row(ROOT).ai_credits_purchased, 2);
  assert.equal(db.rows("ai_credit_spends").length, 0);
  assert.equal(notices.length, 0);
  await c.refundCredits(r);
  assert.equal(row(ROOT).ai_credits_purchased, 2);
  const s = await c.getCreditStatus(ROOT);
  assert.equal(s!.unlimited, true);
  await c.assertCreditsFor(ROOT, "section", 500);
});

test("one conversation is charged once, even when first messages race", async () => {
  const { c, row, db } = setup();
  const [a, b, d] = await Promise.all([1, 2, 3].map(() => c.reserveCredits(T, "website_chat", { ref: "conv-1" })));
  assert.equal([a, b, d].filter((r) => r.credits === 1).length, 1);
  assert.equal([a, b, d].filter((r) => r.alreadyCharged).length, 2);
  assert.equal(row().ai_credits_used_this_month, 1);
  assert.equal(db.rows("ai_credit_spends").length, 1);
  const later = await c.reserveCredits(T, "website_chat", { ref: "conv-1" });
  assert.equal(later.alreadyCharged, true);
  await c.refundCredits(later);
  assert.equal(row().ai_credits_used_this_month, 1, "an already-charged reservation refunds nothing");
  await c.reserveCredits(T, "website_chat", { ref: "conv-2" });
  assert.equal(row().ai_credits_used_this_month, 2, "a new conversation is a new charge");
});

test("a refunded conversation can be charged when the AI finally answers", async () => {
  const { c, row } = setup();
  const first = await c.reserveCredits(T, "website_chat", { ref: "conv-1" });
  await c.refundCredits(first);
  assert.equal(row().ai_credits_used_this_month, 0);
  const again = await c.reserveCredits(T, "website_chat", { ref: "conv-1" });
  assert.equal(again.credits, 1);
  assert.equal(row().ai_credits_used_this_month, 1);
});

test("assistant daily cap holds, then resets the next day", async () => {
  const { c } = setup({ ai_chat_day_count: 200, ai_chat_day_start: "2026-11-15" });
  await assert.rejects(c.reserveCredits(T, "assistant"), (e: unknown) => e instanceof AiCreditsError && e.code === "daily_cap");
  const { c: c2, row } = setup({ ai_chat_day_count: 200, ai_chat_day_start: "2026-11-14" });
  await c2.reserveCredits(T, "assistant");
  assert.equal(row().ai_chat_day_count, 1);
  assert.equal(row().ai_chat_day_start, "2026-11-15");
});

test("lazy monthly reset: first spend after the period zeroes and moves the date", async () => {
  const { c, row } = setup({ ai_credits_used_this_month: 1500, ai_credits_reset_at: "2026-11-01T00:00:00.000Z", ai_credits_purchased: 7 });
  const s = await c.getCreditStatus(T);
  assert.equal(s!.left, 1507, "status already shows the new month");
  const r = await c.reserveCredits(T, "assistant");
  assert.equal(r.monthlyPart, 2);
  assert.equal(row().ai_credits_used_this_month, 2);
  assert.equal(row().ai_credits_reset_at, NEXT_RESET);
  assert.equal(row().ai_credits_purchased, 7);
});

test("free build grant pays for sections only, and refunds to itself", async () => {
  const { c, row } = setup({ ai_free_build_credits: 2 });
  const r = await c.reserveCredits(T, "section");
  assert.deepEqual([r.freePart, r.monthlyPart], [10, 0]);
  assert.equal(row().ai_free_build_credits, 1);
  assert.equal(row().ai_credits_used_this_month, 0);
  await c.refundCredits(r);
  assert.equal(row().ai_free_build_credits, 2);
  await c.reserveCredits(T, "assistant");
  assert.equal(row().ai_free_build_credits, 2, "not for the assistant");
  assert.equal(row().ai_credits_used_this_month, 2);
});

test("status: X of Y counts down, breakdown by section, chat, assistant", async () => {
  const { c } = setup({ ai_credits_purchased: 1080 });
  await c.reserveCredits(T, "section");
  await c.reserveCredits(T, "website_chat", { ref: "a" });
  await c.reserveCredits(T, "support_chat", { ref: "ticket:1" });
  await c.reserveCredits(T, "assistant");
  await c.reserveCredits(T, "translate");
  const s = (await c.getCreditStatus(T))!;
  assert.equal(s.total, 2580);
  assert.equal(s.left, 2580 - 24);
  assert.deepEqual(s.breakdown, { section: 10, chat: 2, assistant: 2, other: 10 });
});

test("status: Y stays put while purchased credits drain", async () => {
  const { c } = setup({ ai_credits_used_this_month: 1500, ai_credits_purchased: 100 });
  const before = (await c.getCreditStatus(T))!;
  await c.reserveCredits(T, "section");
  const after = (await c.getCreditStatus(T))!;
  assert.equal(after.total, before.total);
  assert.equal(after.left, before.left - 10);
});

test("warnings: 20% of the allowance, then zero, each with its own key", async () => {
  const { c, notices } = setup({ plan: "tiny", ai_credits_used_this_month: 20 });
  await c.reserveCredits(T, "website_chat"); // 9 left of 30: above 6
  assert.equal(notices.length, 0);
  for (let i = 0; i < 3; i++) await c.reserveCredits(T, "website_chat"); // 6 left
  assert.ok(notices.length >= 1);
  assert.ok(notices.every((n) => n.dedupeKey === `ai-credits:${T}:2026-11:low`));
  for (let i = 0; i < 6; i++) await c.reserveCredits(T, "website_chat");
  assert.equal(notices.at(-1)!.dedupeKey, `ai-credits:${T}:2026-11:out`);
  assert.match(notices.at(-1)!.title, /used up/);
});

test("batch check says how many are needed", async () => {
  const { c } = setup({ ai_credits_used_this_month: 1470 });
  await c.assertCreditsFor(T, "section", 3);
  await assert.rejects(c.assertCreditsFor(T, "section", 4), /needs 40 AI Credits but only 30/);
});

test("unknown tenant", async () => {
  const { c } = setup();
  await assert.rejects(c.reserveCredits("nope", "section"), (e: unknown) => e instanceof AiCreditsError && e.code === "not_found");
  assert.equal(await c.getCreditStatus("nope"), null);
});
