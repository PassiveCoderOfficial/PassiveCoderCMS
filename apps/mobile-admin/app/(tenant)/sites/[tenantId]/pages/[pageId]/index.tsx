import { useEffect, useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { getPage, updatePageMeta } from "../../../../../../lib/queries/pages";
import type { Page } from "../../../../../../lib/types";
import { Button, Field, Select, TextField } from "../../../../../../components/form";
import {
  Card,
  EmptyState,
  Screen,
  SectionHeader,
  Skeleton,
} from "../../../../../../components/ui";
import { radius, spacing } from "../../../../../../lib/theme";
import { useToast } from "../../../../../../lib/toast";
import { successFeedback } from "../../../../../../lib/haptics";

const STATUS_OPTIONS = [
  { label: "Draft", value: "draft" },
  { label: "Published", value: "published" },
  { label: "Archived", value: "archived" },
];

// Real-world SERP truncation points — past these, search engines cut the text
// off, so surfacing the count is worth the space.
const SEO_TITLE_LIMIT = 60;
const SEO_DESCRIPTION_LIMIT = 160;

export default function PageDetailScreen() {
  const { pageId, tenantId } = useLocalSearchParams<{ pageId: string; tenantId: string }>();
  const toast = useToast();

  const [page, setPage] = useState<Page | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [status, setStatus] = useState("draft");
  const [excerpt, setExcerpt] = useState("");
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");

  useEffect(() => {
    if (!pageId) return;
    (async () => {
      try {
        const p = await getPage(pageId);
        setPage(p);
        setTitle(p.title);
        setStatus(p.status);
        setExcerpt(p.excerpt ?? "");
        setSeoTitle(p.seo?.title ?? "");
        setSeoDescription(p.seo?.description ?? "");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load page");
      } finally {
        setLoading(false);
      }
    })();
  }, [pageId]);

  async function save() {
    if (!pageId) return;
    setSaving(true);
    setError(null);
    try {
      await updatePageMeta(pageId, {
        title,
        status: status as Page["status"],
        excerpt: excerpt || null,
        seo: { title: seoTitle || undefined, description: seoDescription || undefined },
      });
      successFeedback();
      toast.success("Page saved");
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to save";
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <Screen>
        <Skeleton height={220} radius={radius.lg} />
        <Skeleton height={160} radius={radius.lg} />
      </Screen>
    );
  }

  if (!page) {
    return (
      <Screen>
        <EmptyState title="Couldn't load this page" subtitle={error ?? "Page not found"} icon="⚠️" />
      </Screen>
    );
  }

  const titleCount = `${seoTitle.length} / ${SEO_TITLE_LIMIT}`;
  const descCount = `${seoDescription.length} / ${SEO_DESCRIPTION_LIMIT}`;
  const titleOver = seoTitle.length > SEO_TITLE_LIMIT;
  const descOver = seoDescription.length > SEO_DESCRIPTION_LIMIT;

  return (
    <Screen>
      {/* ------------------------------------------------------------ Page */}
      <SectionHeader title="Page" />
      <Card style={{ gap: spacing.lg }}>
        <Field label="Title" required>
          <TextField value={title} onChangeText={setTitle} />
        </Field>
        <Field label="Status" hint="Only published pages are visible on the live site.">
          <Select value={status} placeholder="Status" options={STATUS_OPTIONS} onChange={setStatus} />
        </Field>
        <Field
          label="Excerpt"
          hint="A short summary used in page listings and as the SEO description fallback."
        >
          <TextField value={excerpt} onChangeText={setExcerpt} multiline numberOfLines={3} />
        </Field>
      </Card>

      {/* ------------------------------------------------------------- SEO */}
      <SectionHeader title="SEO" />
      <Card style={{ gap: spacing.lg }}>
        <Field
          label="SEO title"
          hint={titleOver ? undefined : `${titleCount} — falls back to the page title when blank.`}
          error={titleOver ? `${titleCount} — too long, search results will truncate it.` : undefined}
        >
          <TextField value={seoTitle} onChangeText={setSeoTitle} />
        </Field>
        <Field
          label="SEO description"
          hint={descOver ? undefined : `${descCount} — falls back to the excerpt when blank.`}
          error={descOver ? `${descCount} — too long, search results will truncate it.` : undefined}
        >
          <TextField
            value={seoDescription}
            onChangeText={setSeoDescription}
            multiline
            numberOfLines={3}
          />
        </Field>
        <Button title="Save" onPress={save} loading={saving} />
      </Card>

      {/* ---------------------------------------------------------- Blocks */}
      <SectionHeader title="Content" />
      <Card style={{ gap: spacing.md }}>
        <Button
          title={`Edit blocks (${page.blocks?.length ?? 0})`}
          icon="🧱"
          onPress={() => router.push(`/(tenant)/sites/${tenantId}/pages/${pageId}/blocks`)}
        />
      </Card>
    </Screen>
  );
}
