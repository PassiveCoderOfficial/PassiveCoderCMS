import Link from "next/link";
import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/server";
import { ldScript } from "@/lib/seo/jsonld";

const BENGALI = /[ঀ-৿]/g;
const ARABIC = /[؀-ۿ]/g;

/** Language of a post from its title's script; null when it is plain Latin. */
function postLanguage(title: string): string | null {
  const letters = title.replace(/[^\p{L}]/gu, "").length || 1;
  if ((title.match(BENGALI)?.length ?? 0) / letters > 0.3) return "bn";
  if ((title.match(ARABIC)?.length ?? 0) / letters > 0.3) return "ar";
  return null;
}

/**
 * BlogPosting structured data for a published post, on every site: headline,
 * dates, image and publisher. Search engines and AI assistants use it to
 * date and attribute the article. Nothing for drafts or previews.
 */
export async function PostJsonLd({ post }: { post: Record<string, unknown> }) {
  if (post.status !== "published" || !post.published_at) return null;
  const h = await headers();
  const host = h.get("host");
  if (!host) return null;
  const origin = `${host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https"}://${host}`;
  const url = `${origin}/blog/${String(post.slug)}`;
  const title = String(post.title ?? "");
  const seo = (post.seo ?? {}) as { description?: unknown };
  const description = [seo.description, post.excerpt].find((v) => typeof v === "string" && v.trim()) as string | undefined;
  const image = typeof post.featured_image === "string" && post.featured_image.trim() ? post.featured_image.trim() : null;

  let siteName: string | null = null;
  if (typeof post.tenant_id === "string") {
    const admin = await createAdminClient();
    const { data } = await admin.from("site_identity").select("site_name").eq("tenant_id", post.tenant_id).maybeSingle();
    siteName = (data?.site_name as string | null | undefined)?.trim() || null;
  }
  const publisher = siteName ? { "@type": "Organization", name: siteName, url: origin } : undefined;
  const lang = postLanguage(title);

  const ld = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    url,
    headline: title.slice(0, 110),
    ...(description ? { description: description.trim().slice(0, 300) } : {}),
    ...(image ? { image: [image] } : {}),
    datePublished: String(post.published_at),
    dateModified: String(post.updated_at ?? post.published_at),
    ...(publisher ? { author: publisher, publisher } : {}),
    ...(lang ? { inLanguage: lang } : {}),
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldScript(ld) }} />;
}

/**
 * "More articles" under a post: the three posts published just before it
 * (or the newest ones, for the oldest posts). Gives every post links to and
 * from its neighbours, so readers and crawlers can move through the blog.
 */
export async function RelatedPosts({ post }: { post: Record<string, unknown> }) {
  if (post.status !== "published" || typeof post.tenant_id !== "string" || !post.published_at) return null;
  const admin = await createAdminClient();
  const base = () => admin.from("pages").select("id, title, slug, excerpt").eq("tenant_id", post.tenant_id as string).eq("type", "post")
    .eq("status", "published").is("deleted_at", null).neq("id", String(post.id)).order("published_at", { ascending: false });
  const { data: before } = await base().lt("published_at", String(post.published_at)).limit(3);
  let list = before ?? [];
  if (list.length < 3) {
    const { data: newest } = await base().limit(6);
    const seen = new Set(list.map((p) => p.id));
    list = [...list, ...(newest ?? []).filter((p) => !seen.has(p.id))].slice(0, 3);
  }
  if (!list.length) return null;
  return (
    <aside aria-label="More articles" className="mx-auto w-full max-w-3xl px-4 pb-12 pt-4">
      <h2 className="border-t pt-8 text-xl font-semibold">More articles</h2>
      <ul className="mt-4 space-y-4">
        {list.map((p) => (
          <li key={String(p.id)}>
            <Link href={`/blog/${p.slug}`} className="font-medium hover:text-primary hover:underline">{String(p.title)}</Link>
            {p.excerpt ? <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{String(p.excerpt)}</p> : null}
          </li>
        ))}
      </ul>
      <p className="mt-6 text-sm"><Link href="/blog" className="text-primary hover:underline">All articles</Link></p>
    </aside>
  );
}
