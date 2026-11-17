import { ContentList } from "../pages/content-list";
import { PostsHeader, PostsEmptyState } from "./posts-header";

export default async function PostsPage({ searchParams }: { searchParams: Promise<{ status?: string; q?: string; sort?: string }> }) {
  return (
    <ContentList
      params={await searchParams}
      types={["post"]}
      basePath="/dashboard/posts"
      header={(count) => <PostsHeader count={count} />}
      empty={(inTrash) => <PostsEmptyState inTrash={inTrash} />}
    />
  );
}
