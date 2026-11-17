import { NextResponse } from "next/server";
import { importAccess } from "@/lib/import/access";
import { clearRedirectCache, isReservedPath, normPath } from "@/lib/redirects";

/** Site redirects. ?page_id= limits the list to one page's short addresses. */
export async function GET(req: Request) {
  const a = await importAccess("read");
  if ("error" in a) return a.error;
  const pageId = new URL(req.url).searchParams.get("page_id");
  let q = a.admin.from("page_redirects").select("id, from_path, to_path, to_url, status_code, page_id, hits, note, created_at")
    .eq("tenant_id", a.tenantId).order("created_at", { ascending: false }).limit(2000);
  if (pageId) q = q.eq("page_id", pageId);
  const [{ data: rules }, { data: pages }] = await Promise.all([
    q,
    a.admin.from("pages").select("id, title, slug").eq("tenant_id", a.tenantId).is("deleted_at", null).order("title").limit(500),
  ]);
  return NextResponse.json({ rules: rules ?? [], pages: pages ?? [] });
}

type Body = { id?: string; from_path?: string; page_id?: string | null; to_url?: string | null; status_code?: number; note?: string | null };

/** Create or update one rule. Target is a page (page_id) or any URL (to_url). */
export async function POST(req: Request) {
  const a = await importAccess("write");
  if ("error" in a) return a.error;
  const b = await req.json().catch(() => ({})) as Body;
  const from = normPath(b.from_path ?? "");
  if (!from) return NextResponse.json({ error: "Enter the short address, like /offer" }, { status: 400 });
  if (!/^[a-z0-9ঀ-৿؀-ۿ._~\-/]+$/i.test(from)) return NextResponse.json({ error: "Use letters, numbers, - and / only in the address." }, { status: 400 });
  if (isReservedPath(from)) return NextResponse.json({ error: `/${from} is used by the system and can't be redirected.` }, { status: 400 });

  let to_path: string | null = null;
  let to_url: string | null = null;
  let page_id: string | null = null;
  if (b.page_id) {
    const { data: p } = await a.admin.from("pages").select("id, slug").eq("id", b.page_id).eq("tenant_id", a.tenantId).maybeSingle();
    if (!p) return NextResponse.json({ error: "Page not found" }, { status: 404 });
    page_id = p.id as string; to_path = p.slug as string;
    if (normPath(to_path === "home" ? "" : to_path) === from) return NextResponse.json({ error: "That is already this page's own address." }, { status: 400 });
  } else {
    to_url = (b.to_url ?? "").trim();
    if (!to_url) return NextResponse.json({ error: "Choose a page or enter a destination URL." }, { status: 400 });
    if (!/^https?:\/\//i.test(to_url) && !to_url.startsWith("/")) to_url = `https://${to_url}`;
    try { new URL(to_url, "https://x.test"); } catch { return NextResponse.json({ error: "That destination URL isn't valid." }, { status: 400 }); }
  }

  const { data: clash } = await a.admin.from("pages").select("title").eq("tenant_id", a.tenantId).eq("slug", from).eq("status", "published").is("deleted_at", null).maybeSingle();
  // to_path is NOT NULL in production: URL targets store their internal path
  // ("/x" → "x") or "" for external URLs. The proxy prefers to_url.
  if (to_path === null) to_path = to_url && to_url.startsWith("/") ? (normPath(to_url) || "home") : "";
  const row = { tenant_id: a.tenantId, from_path: from, to_path, to_url, page_id, status_code: b.status_code === 302 ? 302 : 301, note: b.note?.trim() || null };
  const { data, error } = b.id
    ? await a.admin.from("page_redirects").update(row).eq("id", b.id).eq("tenant_id", a.tenantId).select().maybeSingle()
    : await a.admin.from("page_redirects").upsert(row, { onConflict: "tenant_id,from_path" }).select().maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  clearRedirectCache(a.tenantId);
  return NextResponse.json({ rule: data, warning: clash ? `The page "${clash.title}" lives at /${from}; this redirect now replaces it for visitors.` : null });
}

export async function DELETE(req: Request) {
  const a = await importAccess("write");
  if ("error" in a) return a.error;
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  await a.admin.from("page_redirects").delete().eq("id", id).eq("tenant_id", a.tenantId);
  clearRedirectCache(a.tenantId);
  return NextResponse.json({ ok: true });
}
