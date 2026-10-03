import { ContentList } from "./content-list";
import { PagesHeader, PagesEmptyState } from "./pages-header";

export default async function PagesListPage({ searchParams }: { searchParams: Promise<{ status?: string; q?: string; sort?: string }> }) {
  return (
    <ContentList
      params={await searchParams}
      types={["page", "landing", "portfolio"]}
      basePath="/dashboard/pages"
      header={(count) => <PagesHeader count={count} />}
      empty={(inTrash) => <PagesEmptyState inTrash={inTrash} />}
    />
  );
}
