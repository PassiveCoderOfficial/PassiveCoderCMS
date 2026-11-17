import Link from "next/link";
/**
 * Top of a single blog post on every site: breadcrumb (Home > Blog > Post),
 * title, date and the featured image. The image is the page's LCP element:
 * eager, high priority, and a fixed aspect box so nothing shifts as it loads.
 * Preview (draft/scheduled, signed-in members only) adds a banner on top.
 */
/** `timeZone`: the root site passes the panel time zone; client sites keep UTC. */
export function PostHeader({ post, preview = false, timeZone = "UTC" }: { post: Record<string, unknown>; preview?: boolean; timeZone?: string }) {
  const title = String(post.title ?? "");
  const image = typeof post.featured_image === "string" && post.featured_image.trim() ? post.featured_image.trim() : null;
  const status = String(post.status ?? "");
  const date = (post.published_at ?? (status === "scheduled" ? post.scheduled_at : null)) as string | null;
  const fmt = (d: string) => new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone });
  const blocksText = JSON.stringify(post.blocks ?? "");
  // Posts built with their own hero/H1 keep it; no second title.
  const ownTitle = /<h1[\s>]/i.test(blocksText) || /"type":"hero"/.test(blocksText);

  return (
    <>
      {preview && (
        <div role="status" className="w-full border-b border-amber-300 bg-amber-50 px-4 py-3 text-center text-sm font-medium text-amber-900">
          Preview — not published yet
          {status === "scheduled" && post.scheduled_at ? ` (scheduled for ${new Date(String(post.scheduled_at)).toLocaleString("en-GB", { dateStyle: "long", timeStyle: "short", timeZone })} ${timeZone === "UTC" ? "UTC" : timeZone.replace(/_/g, " ")})` : " (draft)"}
          . Only signed-in members of this site can see this page.
        </div>
      )}
      <header className="mx-auto w-full max-w-3xl px-4 pt-8 sm:pt-12">
        <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li><Link href="/" className="hover:underline">Home</Link></li>
            <li aria-hidden="true">/</li>
            <li><Link href="/blog" className="hover:underline">Blog</Link></li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="line-clamp-1 max-w-[60vw] text-foreground/80">{title}</li>
          </ol>
        </nav>
        {!ownTitle && (
          <h1 className="mt-4 text-3xl font-bold leading-tight tracking-tight sm:text-4xl md:text-[2.75rem]">{title}</h1>
        )}
        {date && !ownTitle && <p className="mt-3 text-sm text-muted-foreground"><time dateTime={date}>{fmt(date)}</time></p>}
        {image && (
          <div className="mt-6 aspect-[16/9] w-full overflow-hidden rounded-2xl bg-muted sm:mt-8">
            {/* Plain img: featured images can live on any host, and the
                optimizer only allows our own bucket (next.config images). */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image} alt={title} width={1200} height={675} loading="eager" fetchPriority="high" decoding="async"
              className="h-full w-full object-cover" />
          </div>
        )}
      </header>
    </>
  );
}
