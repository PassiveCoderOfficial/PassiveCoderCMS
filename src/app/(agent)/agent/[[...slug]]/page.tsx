import { redirect } from "next/navigation";

// Backward-compat: the staff portal moved from /agent/* to /staff/*. Old
// bookmarks/links to any /agent/... path land here and get forwarded to the
// equivalent /staff/... path so nothing 404s.
export default async function AgentPortalRedirect({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}) {
  const { slug } = await params;
  const rest = slug?.length ? `/${slug.join("/")}` : "";
  redirect(`/staff${rest}`);
}
