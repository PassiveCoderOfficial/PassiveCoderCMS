import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Code releases in the Action List (2026-11-04, migration 227). GitHub sends a
 * webhook (app/api/github/webhook) when a pull request into main is merged and
 * when Vercel reports a deployment's status. These helpers are pure so tests
 * can check them: no database, no network.
 */

/** GitHub's X-Hub-Signature-256 ("sha256=<hex>") over the raw body. */
export function verifyGithubSignature(secret: string, body: string, header: string | null | undefined): boolean {
  if (!secret || !header?.startsWith("sha256=")) return false;
  const want = Buffer.from(`sha256=${createHmac("sha256", secret).update(body).digest("hex")}`);
  const got = Buffer.from(header);
  return want.length === got.length && timingSafeEqual(want, got);
}

/** "Attendance live board (v1.0.903) (#223)" -> "1.0.903". */
export function versionFromTitle(title: string | null | undefined): string | null {
  return /\bv?(\d+\.\d+\.\d+)\b/.exec(title ?? "")?.[1] ?? null;
}

export type ReleaseRow = {
  action: string;
  actorLabel: string | null;
  githubLogin: string | null;
  sha: string | null;
  ok: boolean | null;
  args: Record<string, unknown>;
};

type Obj = Record<string, unknown>;
const obj = (v: unknown): Obj => (v && typeof v === "object" && !Array.isArray(v) ? (v as Obj) : {});
const str = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v.trim() : null);

/**
 * What a webhook event means for the Action List, or null when it means nothing:
 *   pull_request closed + merged into the default branch  -> release.merged
 *   deployment_status success / failure / error, Production -> release.deploy_ready / release.deploy_error
 * Everything else (opened PRs, previews, pending deploys, pings) is ignored.
 */
export function releaseRowFor(event: string, payload: unknown, branch = "main"): ReleaseRow | null {
  const p = obj(payload);
  if (event === "pull_request") {
    const pr = obj(p.pull_request);
    if (p.action !== "closed" || pr.merged !== true) return null;
    if (str(obj(pr.base).ref) !== branch) return null;
    const login = str(obj(pr.merged_by).login) ?? str(obj(p.sender).login);
    const title = str(pr.title);
    return {
      action: "release.merged",
      actorLabel: login ? `${login} (GitHub)` : "GitHub",
      githubLogin: login,
      sha: str(pr.merge_commit_sha),
      ok: null, // known once the deploy reports
      args: {
        pr: typeof pr.number === "number" ? pr.number : null,
        title: title ? title.slice(0, 200) : null,
        version: versionFromTitle(title),
        sha: str(pr.merge_commit_sha),
        url: str(pr.html_url),
        author: str(obj(pr.user).login),
        githubLogin: login,
      },
    };
  }
  if (event === "deployment_status") {
    const d = obj(p.deployment);
    const s = obj(p.deployment_status);
    const env = str(s.environment) ?? str(d.environment) ?? "";
    if (!/^production$/i.test(env)) return null;
    const state = str(s.state);
    if (state !== "success" && state !== "failure" && state !== "error") return null;
    const login = str(obj(p.sender).login);
    return {
      action: state === "success" ? "release.deploy_ready" : "release.deploy_error",
      actorLabel: login ? `${login} (GitHub)` : "Vercel",
      githubLogin: login,
      sha: str(d.sha),
      ok: state === "success",
      args: {
        sha: str(d.sha),
        environment: env,
        state,
        url: str(s.environment_url) ?? str(s.target_url),
        logs: str(s.log_url) ?? str(s.target_url),
        githubLogin: login,
      },
    };
  }
  return null;
}
