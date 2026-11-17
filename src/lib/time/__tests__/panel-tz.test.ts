/** Panel time zone helpers. Run: tsx --test src/lib/time/__tests__/panel-tz.test.ts */
import { test } from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_PANEL_TZ, fmtDate, fmtDateTime, fmtTime, isValidTimeZone, isoDateInZone, normalizeTimeZone, zoneOffsetLabel, allTimeZones } from "../panel-tz";

const AT = "2026-11-04T20:30:00Z"; // 02:30 on 5 Nov in Dhaka

test("default is Dhaka and validation works", () => {
  assert.equal(DEFAULT_PANEL_TZ, "Asia/Dhaka");
  assert.ok(isValidTimeZone("Asia/Singapore"));
  assert.ok(isValidTimeZone("UTC"));
  assert.ok(!isValidTimeZone("Mars/Base"));
  assert.ok(!isValidTimeZone(""));
  assert.equal(normalizeTimeZone("nope"), "Asia/Dhaka");
  assert.equal(normalizeTimeZone(" Europe/London "), "Europe/London");
});

test("instants format in the given zone", () => {
  assert.equal(fmtDate(AT, "Asia/Dhaka"), "11/5/2026");
  assert.equal(fmtDate(AT, "UTC"), "11/4/2026");
  assert.equal(fmtTime(AT, "Asia/Dhaka", { hour: "numeric", minute: "2-digit" }), "2:30 AM");
  assert.equal(fmtDateTime(AT, "UTC", { hour: "numeric", minute: "2-digit", hour12: false }), "20:30");
  assert.equal(fmtDate(null, "UTC"), "");
  assert.equal(fmtDate("garbage", "UTC"), "");
});

test("calendar dates never shift a day", () => {
  assert.equal(fmtDate("2026-11-04", "America/New_York"), "11/4/2026");
  assert.equal(fmtDate("2026-11-04", "Asia/Dhaka"), "11/4/2026");
});

test("today in a zone, offsets, zone list", () => {
  assert.equal(isoDateInZone("Asia/Dhaka", new Date(AT)), "2026-11-05");
  assert.equal(isoDateInZone("UTC", new Date(AT)), "2026-11-04");
  assert.equal(zoneOffsetLabel("Asia/Dhaka"), "GMT+6");
  assert.equal(zoneOffsetLabel("UTC"), "GMT+0");
  const all = allTimeZones();
  assert.ok(all.includes("UTC") && all.includes("Asia/Dhaka") && all.length > 100);
});
