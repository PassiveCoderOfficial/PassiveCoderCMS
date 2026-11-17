/**
 * Action List sources (migration 227): the Source filter, the source tag, release
 * rows from the GitHub webhook and database rows from the trigger.
 * Run: NODE_PATH=../cms/node_modules ../cms/node_modules/.bin/tsx --test tests/platform/action-sources.test.ts
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { readFileSync } from "node:fs";
import { actionLabel, changeSummary, SOURCES, sourceFilter, VIA_LABELS, type FeedRow } from "../../src/lib/activity/labels";
import { releaseRowFor, verifyGithubSignature, versionFromTitle } from "../../src/lib/activity/release";

const row = (over: Partial<FeedRow>): FeedRow => ({
  id: "a1", created_at: "2026-11-04T00:00:00Z", actor_id: null, action: "page.edit", tenant_id: null, target_user_id: null,
  via: "web", ok: true, error: null, args: null, before: null, after: null, actor_name: null, actor_role: null, site_name: null, ...over,
});

test("every source has a filter and a tag; no source means everything", () => {
  for (const s of SOURCES) assert.ok(sourceFilter(s.value), s.value);
  assert.deepEqual(sourceFilter("panel"), { op: "eq", value: "web" });
  assert.deepEqual(sourceFilter("people"), { op: "neq", value: "database" });
  assert.equal(sourceFilter(""), null);
  assert.equal(sourceFilter("web' or 1=1"), null);
  for (const via of ["web", "app", "mcp", "release", "database"]) assert.ok(VIA_LABELS[via], via);
});

test("GitHub signatures: right secret passes, anything else fails", () => {
  const body = JSON.stringify({ a: 1 });
  const sig = `sha256=${createHmac("sha256", "s3cret").update(body).digest("hex")}`;
  assert.equal(verifyGithubSignature("s3cret", body, sig), true);
  assert.equal(verifyGithubSignature("other", body, sig), false);
  assert.equal(verifyGithubSignature("s3cret", body + " ", sig), false);
  assert.equal(verifyGithubSignature("s3cret", body, null), false);
  assert.equal(verifyGithubSignature("", body, sig), false);
});

test("a merged PR into main is a release row; other PR events are not", () => {
  const pr = { number: 230, title: "Action list sources (v1.0.905)", merged: true, merge_commit_sha: "abc1234def", html_url: "https://github.com/x/y/pull/230", base: { ref: "main" }, merged_by: { login: "octocat" }, user: { login: "claude" } };
  const r = releaseRowFor("pull_request", { action: "closed", pull_request: pr });
  assert.ok(r);
  assert.equal(r.action, "release.merged");
  assert.equal(r.actorLabel, "octocat (GitHub)");
  assert.equal(r.args.version, "1.0.905");
  assert.equal(r.args.pr, 230);
  assert.equal(r.ok, null);
  assert.equal(releaseRowFor("pull_request", { action: "closed", pull_request: { ...pr, merged: false } }), null);
  assert.equal(releaseRowFor("pull_request", { action: "opened", pull_request: pr }), null);
  assert.equal(releaseRowFor("pull_request", { action: "closed", pull_request: { ...pr, base: { ref: "feature" } } }), null);
  assert.equal(versionFromTitle("No version here"), null);
});

test("only Production deploy results become rows", () => {
  const dep = (state: string, environment = "Production") => ({ deployment: { sha: "abc1234def", environment }, deployment_status: { state, environment, environment_url: "https://x.vercel.app" }, sender: { login: "vercel[bot]" } });
  assert.equal(releaseRowFor("deployment_status", dep("success"))?.action, "release.deploy_ready");
  assert.equal(releaseRowFor("deployment_status", dep("success"))?.ok, true);
  assert.equal(releaseRowFor("deployment_status", dep("error"))?.action, "release.deploy_error");
  assert.equal(releaseRowFor("deployment_status", dep("failure"))?.ok, false);
  assert.equal(releaseRowFor("deployment_status", dep("pending")), null);
  assert.equal(releaseRowFor("deployment_status", dep("success", "Preview")), null);
  assert.equal(releaseRowFor("push", {}), null);
});

test("release and database rows read in plain words", () => {
  assert.equal(actionLabel("release.merged"), "Merged a code change into main");
  assert.equal(actionLabel("db.tenants.update"), "Changed a site in the database");
  assert.equal(actionLabel("db.attendance_sessions.delete"), "Removed an attendance entry in the database");
  assert.equal(actionLabel("db.some_new_table.insert"), "Added some new table in the database");

  const rel = changeSummary(row({ via: "release", action: "release.merged", args: { title: "Fix X (v1.0.905)", pr: 230, version: "1.0.905", sha: "abc1234def", deploy: "success", deployUrl: "https://x.vercel.app" } }));
  assert.deepEqual(rel, ["Fix X (v1.0.905)", "PR #230", "Version 1.0.905", "Commit abc1234", "Deploy: Ready", "https://x.vercel.app"]);

  const db = changeSummary(row({
    via: "database", action: "db.tenants.update", reason: "fixing X",
    args: { table: "tenants", id: "t1", changed: ["status", "dodo_api_key"], moreRows: 3, client: "mgmt-api" },
    before: { status: "active", dodo_api_key: "[redacted]" }, after: { status: "paused", dodo_api_key: "[redacted]" },
  }));
  assert.ok(db.includes("Table: tenants, row t1"));
  assert.ok(db.includes("Status: active to paused"));
  assert.ok(db.includes("Reason: fixing X"));
  assert.ok(db.includes("And 3 more rows in the same change"));
  assert.ok(!db.join(" ").includes("sk_"), "only what the trigger kept");
  assert.ok(changeSummary(row({ via: "database", action: "db.plans.update", args: { table: "plans" } })).includes("No reason given"));
});

test("migration 227: cheap, skips signed-in and app-server writes, never breaks the write, redacts secrets", () => {
  const sql = readFileSync("supabase/migrations/227_action_list_sources.sql", "utf8");
  assert.match(sql, /after insert or update or delete on public\.%I for each row/);
  assert.match(sql, /pg_trigger_depth\(\) > 1/);
  assert.match(sql, /auth\.uid\(\) is not null then return null/);
  assert.match(sql, /x-pc-origin/);
  assert.match(sql, /exception when others then\s+null; -- never break the write/);
  assert.match(sql, /pass\|secret\|token\|api_\?key/);
  assert.match(sql, /current_setting\('pc\.reason', true\)/);
  for (const busy of ["admin_audit_log", "mcp_audit", "page_views", "notifications", "media"]) {
    assert.ok(!new RegExp(`\\('${busy}',`).test(sql), `${busy} is not watched`);
  }
  const cache = readFileSync("src/lib/supabase/public-cache.ts", "utf8");
  assert.match(cache, /h\.set\(ORIGIN_HEADER, "app"\)/, "the app marks its own writes");
});
