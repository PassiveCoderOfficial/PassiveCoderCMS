import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { randomBytes } from "crypto";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { connectableSites, sha256, siteAccess, type McpScope } from "@/lib/mcp/auth";

export const dynamic = "force-dynamic";
export const metadata = { title: "Connect an AI app — Passive Coder", robots: { index: false } };

type Q = {
  response_type?: string; client_id?: string; redirect_uri?: string; state?: string;
  code_challenge?: string; code_challenge_method?: string; scope?: string;
};

async function loadClient(clientId?: string, redirectUri?: string) {
  if (!clientId || !redirectUri) return null;
  const admin = await createAdminClient();
  const { data } = await admin.from("mcp_oauth_clients").select("client_id, client_name, redirect_uris").eq("client_id", clientId).maybeSingle();
  if (!data || !(data.redirect_uris as string[]).includes(redirectUri)) return null;
  return data as { client_id: string; client_name: string | null; redirect_uris: string[] };
}

function back(redirectUri: string, params: Record<string, string | undefined>) {
  const u = new URL(redirectUri);
  for (const [k, v] of Object.entries(params)) if (v) u.searchParams.set(k, v);
  return u.toString();
}

/**
 * OAuth consent: the person picks which site the AI app may work on and
 * whether it may change things. Access is capped by their own role on that
 * site and re-checked on every call afterwards.
 */
export default async function AuthorizePage({ searchParams }: { searchParams: Promise<Q> }) {
  const q = await searchParams;
  const client = await loadClient(q.client_id, q.redirect_uri);
  if (!client || q.response_type !== "code" || !q.code_challenge || q.code_challenge_method !== "S256") {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md text-center">
          <h1 className="text-xl font-semibold">This connection request is not valid</h1>
          <p className="text-sm text-muted-foreground mt-2">Start the connection again from your AI app.</p>
        </div>
      </main>
    );
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    const path = `/oauth/authorize?${new URLSearchParams(q as Record<string, string>).toString()}`;
    redirect(`/login?redirect=${encodeURIComponent(path)}`);
  }

  const admin = await createAdminClient();
  const sites = await connectableSites(admin, user.id);
  const wantsWrite = !q.scope || q.scope.split(" ").includes("write");

  async function decide(formData: FormData) {
    "use server";
    const c = await loadClient(q.client_id, q.redirect_uri);
    if (!c) return;
    if (formData.get("decision") !== "allow") redirect(back(q.redirect_uri!, { error: "access_denied", state: q.state }));

    const sb = await createClient();
    const { data: { user: u } } = await sb.auth.getUser();
    if (!u) redirect("/login");
    const a = await createAdminClient();
    const tenantId = String(formData.get("site") ?? "");
    const live = await siteAccess(a, u.id, tenantId);
    if (!live) redirect(back(q.redirect_uri!, { error: "access_denied", error_description: "No access to that site", state: q.state }));
    const scope: McpScope = formData.get("access") === "write" && live === "write" ? "write" : "read";

    const code = randomBytes(32).toString("base64url");
    await a.from("mcp_oauth_codes").insert({
      code_hash: sha256(code), client_id: c.client_id, user_id: u.id, tenant_id: tenantId, scope,
      redirect_uri: q.redirect_uri!, code_challenge: q.code_challenge!, expires_at: new Date(Date.now() + 10 * 60_000).toISOString(),
    });
    const iss = (await headers()).get("x-forwarded-host") ?? (await headers()).get("host");
    redirect(back(q.redirect_uri!, { code, state: q.state, iss: iss ? `https://${iss}` : undefined }));
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-muted/30">
      <form action={decide} className="w-full max-w-md rounded-2xl border bg-card p-6 sm:p-8 shadow-sm space-y-6">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Passive Coder</p>
          <h1 className="text-xl font-semibold mt-1">Connect {client.client_name ?? "an AI app"}</h1>
          <p className="text-sm text-muted-foreground mt-2">
            {client.client_name ?? "This app"} wants to work on your website dashboard on your behalf, signed in as <b>{user.email}</b>.
          </p>
        </div>

        {sites.length === 0 ? (
          <p className="text-sm text-red-600">Your account doesn&apos;t manage any site yet.</p>
        ) : (
          <>
            <label className="block space-y-1.5">
              <span className="text-sm font-medium">Website</span>
              <select name="site" required className="w-full rounded-lg border bg-background px-3 py-2 text-sm">
                {sites.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} ({s.slug}){s.access === "read" ? " — view only" : ""}</option>
                ))}
              </select>
            </label>
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium mb-1">What it may do</legend>
              <label className="flex items-start gap-2 text-sm">
                <input type="radio" name="access" value="read" defaultChecked={!wantsWrite} className="mt-1" />
                <span><b>View only</b>: read pages, orders, bookings and leads.</span>
              </label>
              <label className="flex items-start gap-2 text-sm">
                <input type="radio" name="access" value="write" defaultChecked={wantsWrite} className="mt-1" />
                <span><b>View and edit</b>: also draft and publish pages, write posts, update products, orders and bookings. It can never delete anything.</span>
              </label>
              <p className="text-xs text-muted-foreground">Never more than your own role on that site allows. You can disconnect any time in Dashboard &gt; AI Connect.</p>
            </fieldset>
          </>
        )}

        <div className="flex gap-3">
          <button name="decision" value="deny" className="flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium hover:bg-muted">Cancel</button>
          <button name="decision" value="allow" disabled={sites.length === 0} className="flex-1 rounded-lg bg-primary text-primary-foreground px-4 py-2.5 text-sm font-semibold disabled:opacity-50">Allow</button>
        </div>
      </form>
    </main>
  );
}
