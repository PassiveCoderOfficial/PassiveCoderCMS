// WordPress eXtended RSS (WXR) format for portability

interface Post {
  id: string;
  title: string;
  content: string;
  excerpt?: string;
  status: string;
  slug: string;
  created_at: string;
  updated_at: string;
  author_id?: string;
}

interface Page {
  id: string;
  title: string;
  content?: string;
  status: string;
  slug: string;
  created_at: string;
  updated_at: string;
}

function cdata(value: string): string {
  return `<![CDATA[${value.replace(/]]>/g, "]]]]><![CDATA[>")}]]>`;
}

function xmlDate(iso: string): string {
  return new Date(iso).toUTCString();
}

export function generateWxr(
  siteUrl: string,
  siteName: string,
  posts: Post[],
  pages: Page[],
): Buffer {
  const items: string[] = [];

  for (const post of posts) {
    items.push(`
    <item>
      <title>${cdata(post.title)}</title>
      <link>${siteUrl}/${post.slug}</link>
      <pubDate>${xmlDate(post.created_at)}</pubDate>
      <dc:creator>${cdata("admin")}</dc:creator>
      <guid isPermaLink="false">${siteUrl}/?p=${post.id}</guid>
      <description></description>
      <content:encoded>${cdata(post.content ?? "")}</content:encoded>
      <excerpt:encoded>${cdata(post.excerpt ?? "")}</excerpt:encoded>
      <wp:post_id>${post.id}</wp:post_id>
      <wp:post_date>${post.created_at}</wp:post_date>
      <wp:post_modified>${post.updated_at}</wp:post_modified>
      <wp:comment_status>closed</wp:comment_status>
      <wp:ping_status>closed</wp:ping_status>
      <wp:post_name>${cdata(post.slug)}</wp:post_name>
      <wp:status>${post.status === "published" ? "publish" : post.status}</wp:status>
      <wp:post_type>post</wp:post_type>
    </item>`);
  }

  for (const page of pages) {
    items.push(`
    <item>
      <title>${cdata(page.title)}</title>
      <link>${siteUrl}/${page.slug}</link>
      <pubDate>${xmlDate(page.created_at)}</pubDate>
      <dc:creator>${cdata("admin")}</dc:creator>
      <guid isPermaLink="false">${siteUrl}/?page_id=${page.id}</guid>
      <description></description>
      <content:encoded>${cdata(page.content ?? "")}</content:encoded>
      <excerpt:encoded><![CDATA[]]></excerpt:encoded>
      <wp:post_id>${page.id}</wp:post_id>
      <wp:post_date>${page.created_at}</wp:post_date>
      <wp:post_modified>${page.updated_at}</wp:post_modified>
      <wp:comment_status>closed</wp:comment_status>
      <wp:ping_status>closed</wp:ping_status>
      <wp:post_name>${cdata(page.slug)}</wp:post_name>
      <wp:status>${page.status === "published" ? "publish" : page.status}</wp:status>
      <wp:post_type>page</wp:post_type>
    </item>`);
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:excerpt="http://wordpress.org/export/1.2/excerpt/"
  xmlns:content="http://purl.org/rss/1.0/modules/content/"
  xmlns:wfw="http://wellformedweb.org/CommentAPI/"
  xmlns:dc="http://purl.org/dc/elements/1.1/"
  xmlns:wp="http://wordpress.org/export/1.2/">
  <channel>
    <title>${cdata(siteName)}</title>
    <link>${siteUrl}</link>
    <description></description>
    <language>en-US</language>
    <wp:wxr_version>1.2</wp:wxr_version>
    <wp:base_site_url>${siteUrl}</wp:base_site_url>
    <wp:base_blog_url>${siteUrl}</wp:base_blog_url>
    ${items.join("\n")}
  </channel>
</rss>`;

  return Buffer.from(xml, "utf-8");
}
