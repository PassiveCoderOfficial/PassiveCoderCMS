/** Open edition: no support desk, so no proposed-change previews. */
type PageContent = { blocks: unknown; draft_blocks: unknown; title: string };
type IdentityContent = Partial<Record<"global_header" | "global_footer" | "global_prefooter", unknown>>;
export type PreviewOverlay = { id: string; pages: Map<string, PageContent>; identity: IdentityContent | null };

export async function previewOverlay(_tenantId: string | null): Promise<PreviewOverlay | null> {
  return null;
}

type LayoutLike = { header: unknown[]; footer: unknown[]; prefooter: unknown[] };

export async function withPreview<P extends { id: string; blocks?: unknown; title?: string } | null, L extends LayoutLike>(
  _tenantId: string | null, page: P, layout: L,
): Promise<{ page: P; layout: L; preview: PreviewOverlay | null }> {
  return { page, layout, preview: null };
}
