import { groupedCrud } from "@/lib/content/grouped-crud";
import { importAccess } from "@/lib/import/access";

const crud = groupedCrud({
  groupTable: "testimonial_groups",
  itemTable: "testimonials",
  itemTypes: ["item"],
  arrayFields: ["photos"],
});

type Access = Exclude<Awaited<ReturnType<typeof importAccess>>, { error: unknown }>;

/** Visitor photos are public files: removing one from a review must delete the file too. */
async function deleteReviewFiles(a: Access, urls: string[]) {
  const prefix = `review-photos/${a.tenantId}/`;
  const paths = urls.map((u) => u.split("/media/")[1] ?? "").filter((p) => p.startsWith(prefix));
  if (paths.length) await a.admin.storage.from("media").remove(paths);
}

export const GET = crud.GET;
export const POST = crud.POST;

export async function PATCH(req: Request) {
  const body = await req.clone().json().catch(() => ({})) as { _type?: string; id?: unknown; photos?: unknown };
  if (body._type !== "item" || typeof body.id !== "string" || !Array.isArray(body.photos)) return crud.PATCH(req);
  const a = await importAccess("write");
  if ("error" in a) return a.error;
  const { data } = await a.admin.from("testimonials").select("photos").eq("id", body.id).eq("tenant_id", a.tenantId).maybeSingle();
  const kept = body.photos as unknown[];
  const res = await crud.PATCH(req);
  if (res?.ok) await deleteReviewFiles(a, ((data?.photos ?? []) as string[]).filter((u) => !kept.includes(u)));
  return res;
}

export async function DELETE(req: Request) {
  const sp = new URL(req.url).searchParams;
  const id = sp.get("id");
  if (!id) return crud.DELETE(req);
  const a = await importAccess("write");
  if ("error" in a) return a.error;
  const { data } = await a.admin.from("testimonials").select("photos")
    .eq(sp.get("type") === "group" ? "group_id" : "id", id).eq("tenant_id", a.tenantId);
  const res = await crud.DELETE(req);
  if (res?.ok) await deleteReviewFiles(a, (data ?? []).flatMap((r) => (r.photos ?? []) as string[]));
  return res;
}
