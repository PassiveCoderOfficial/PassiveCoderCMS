import { test } from "node:test";
import assert from "node:assert/strict";
import {
  channelFor, defaultPath, inQuietHours, parsePrefs, planDelivery, tenantDeeplink, wantsPush,
  TENANT_EVENTS, SA_EVENTS, type NotificationPrefs,
} from "../../src/lib/push/events";

const T1 = "11111111-1111-1111-1111-111111111111";
const T2 = "22222222-2222-2222-2222-222222222222";

test("no prefs = every event on for a client", () => {
  for (const e of TENANT_EVENTS) assert.equal(wantsPush(null, "me", T1, e), true);
  for (const e of SA_EVENTS) assert.equal(wantsPush(null, "me", null, e), true);
});

test("per-site and all-site switches", () => {
  const p: NotificationPrefs = { disabled: { [T1]: ["order"], "*": ["review"] } };
  assert.equal(wantsPush(p, "me", T1, "order"), false);
  assert.equal(wantsPush(p, "me", T2, "order"), true);
  assert.equal(wantsPush(p, "me", T2, "review"), false);
  assert.equal(wantsPush({ disabled: { [T2]: ["*"] } }, "me", T2, "lead"), false);
  assert.equal(wantsPush({ disabled: { "*": ["*"] } }, "me", T1, "lead"), false);
  assert.equal(wantsPush({ disabled: { "*": ["*"] } }, "me", null, "test"), true, "test pushes ignore prefs");
});

test("quiet hours, same day and over midnight, in the user's zone", () => {
  // 2026-10-23 17:30 UTC = 23:30 Dhaka
  const now = new Date("2026-10-23T17:30:00Z");
  assert.equal(inQuietHours({ start: "22:00", end: "07:00", tz: "Asia/Dhaka" }, now), true);
  assert.equal(inQuietHours({ start: "22:00", end: "07:00", tz: "UTC" }, now), false);
  assert.equal(inQuietHours({ start: "13:00", end: "18:00", tz: "UTC" }, now), true);
  assert.equal(inQuietHours({ start: "08:00", end: "08:00", tz: "UTC" }, now), false);
  assert.equal(inQuietHours(null, now), false);
});

test("planDelivery: everyone gets the inbox; muted and quiet users get no push", () => {
  const prefs = new Map<string, NotificationPrefs>([
    ["off", { disabled: { [T1]: ["order"] } }],
    ["quiet", { quiet_hours: { start: "00:00", end: "23:59", tz: "UTC" } }],
  ]);
  const now = new Date("2026-10-23T12:00:00Z");
  const r = planDelivery(["owner", "owner", "off", "quiet"], prefs, T1, "order", now);
  assert.deepEqual(r.inbox.sort(), ["off", "owner", "quiet"]);
  assert.deepEqual([...r.push], ["owner"]);
});

const SA = new Map([["me", "super_admin" as const]]);
const STAFF = new Map([["me", "staff" as const]]);

test("master switch stops every push, even a visitor asking for a person, but not the test push", () => {
  const p: NotificationPrefs = { paused: true };
  assert.equal(wantsPush(p, "me", T1, "order"), false);
  assert.equal(wantsPush(p, "me", T1, "chat_human", { roles: SA, ownerId: "me" }), false);
  assert.equal(wantsPush(p, "me", null, "platform_error", { roles: SA }), false);
  assert.equal(wantsPush(p, "me", null, "test"), true);
});

test("super admin: only selected sites by default, owned or not", () => {
  const ctx = { roles: SA, ownerId: "me" };
  assert.equal(wantsPush(null, "me", T1, "chat", ctx), false, "owned, not selected");
  assert.equal(wantsPush(null, "me", T1, "order", ctx), false);
  assert.equal(wantsPush({ selected_sites: [T1] }, "me", T1, "order", ctx), true);
  assert.equal(wantsPush({ selected_sites: [T2] }, "me", T1, "order", ctx), false);
  assert.equal(wantsPush({ site_mode: "all" }, "me", T1, "order", ctx), true);
});

test("visitor wants a person: pushes on owned sites only, and stops when ownership moves", () => {
  assert.equal(wantsPush(null, "me", T1, "chat_human", { roles: SA, ownerId: "me" }), true);
  assert.equal(wantsPush(null, "me", T1, "chat_human", { roles: SA, ownerId: "client" }), false, "after transfer");
  assert.equal(wantsPush({ human_chat_owned: false }, "me", T1, "chat_human", { roles: SA, ownerId: "me" }), false);
  assert.equal(wantsPush({ disabled: { "*": ["chat_human"] } }, "me", T1, "chat_human", { roles: SA, ownerId: "me" }), false, "type switched off");
  assert.equal(wantsPush({ disabled: { [T1]: ["*"] } }, "me", T1, "chat_human", { roles: SA, ownerId: "me" }), true, "site off, still owned");
});

test("platform events ignore site rules but obey their own switch", () => {
  assert.equal(wantsPush(null, "me", T1, "platform_error", { roles: SA }), true);
  assert.equal(wantsPush(null, "me", null, "support_escalation", { roles: SA }), true);
  assert.equal(wantsPush({ disabled: { "*": ["platform_error"] } }, "me", null, "platform_error", { roles: SA }), false);
});

test("a project alert reaches the person it names, whatever sites they follow", () => {
  assert.equal(wantsPush(null, "me", T1, "project", { roles: SA, ownerId: "client" }), true);
  assert.equal(wantsPush({ paused: true }, "me", T1, "project", { roles: SA }), false);
});

test("staff: owned and assigned sites on with all types, others off, each can be changed", () => {
  const assigned = new Set(["me"]);
  assert.equal(wantsPush(null, "me", T1, "order", { roles: STAFF, ownerId: "me" }), true);
  assert.equal(wantsPush(null, "me", T1, "review", { roles: STAFF, assigned }), true);
  assert.equal(wantsPush(null, "me", T1, "order", { roles: STAFF, ownerId: "client" }), false);
  assert.equal(wantsPush({ selected_sites: [T1] }, "me", T1, "order", { roles: STAFF }), true);
  assert.equal(wantsPush({ disabled: { [T1]: ["*"] } }, "me", T1, "order", { roles: STAFF, assigned }), false);
});

test("client: every site on by default; switching their own site off silences it completely", () => {
  assert.equal(wantsPush(null, "me", T1, "order", { ownerId: "me" }), true);
  assert.equal(wantsPush({ disabled: { [T1]: ["*"] } }, "me", T1, "order", { ownerId: "me" }), false);
  assert.equal(wantsPush({ disabled: { [T1]: ["*"] } }, "me", T1, "chat_human", { ownerId: "me" }), false);
  assert.equal(wantsPush({ disabled: { [T1]: ["*"] }, human_chat_owned: true }, "me", T1, "chat_human", { ownerId: "me" }), true);
});

test("channels and deep links match the app", () => {
  assert.equal(channelFor("order_action"), "orders");
  assert.equal(channelFor("booking_cancelled"), "bookings");
  assert.equal(channelFor("lead"), "leads");
  assert.equal(channelFor("chat"), "leads");
  assert.equal(channelFor("chat_human"), "urgent");
  assert.equal(defaultPath("chat", "c1"), "chat/c1");
  assert.equal(channelFor("platform_error"), "urgent");
  assert.equal(channelFor("review"), "default");
  assert.equal(tenantDeeplink(T1, defaultPath("order", "o1")), `pcadmin://sites/${T1}/orders/o1`);
  assert.equal(defaultPath("booking", "b1"), "bookings/b1");
  assert.equal(defaultPath("support_approval", "t1"), "support/t1");
  assert.equal(defaultPath("low_stock"), "inventory");
});

test("parsePrefs rejects junk and keeps known events only", () => {
  const allowed = [...TENANT_EVENTS];
  assert.equal(parsePrefs(null, allowed), null);
  assert.equal(parsePrefs({ disabled: { "not-a-uuid": ["order"] } }, allowed), null);
  assert.equal(parsePrefs({ quiet_hours: { start: "25:00", end: "07:00" } }, allowed), null);
  assert.deepEqual(parsePrefs({ disabled: { [T1]: ["order", "bogus", "order"], "*": [] } }, allowed), { disabled: { [T1]: ["order"] } });
  assert.deepEqual(parsePrefs({ disabled: { "*": ["platform_error"] } }, allowed), { disabled: {} }, "SA events not allowed for clients");
  assert.deepEqual(parsePrefs({ quiet_hours: null }, allowed), { quiet_hours: null });
  assert.deepEqual(parsePrefs({ paused: true, site_mode: "selected", selected_sites: [T1, T1], human_chat_owned: false }, allowed), { paused: true, site_mode: "selected", selected_sites: [T1], human_chat_owned: false });
  assert.equal(parsePrefs({ paused: "yes" }, allowed), null);
  assert.equal(parsePrefs({ site_mode: "some" }, allowed), null);
  assert.equal(parsePrefs({ selected_sites: ["nope"] }, allowed), null);
});
