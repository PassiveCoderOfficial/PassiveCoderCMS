import { useEffect, useState } from "react";
import { Alert } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { getPage, updatePageMeta } from "../../../../../lib/queries/pages";
import type { Page } from "../../../../../lib/types";
import { Button, ErrorText, Field, Select, TextField } from "../../../../../components/form";
import { Card, LoadingSpinner, Screen } from "../../../../../components/ui";

const STATUS_OPTIONS = [
  { label: "Draft", value: "draft" },
  { label: "Published", value: "published" },
  { label: "Archived", value: "archived" },
];

export default function PageDetailScreen() {
  const { pageId } = useLocalSearchParams<{ pageId: string; tenantId: string }>();
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
      Alert.alert("Saved", "Page updated.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingSpinner />;
  if (!page) {
    return (
      <Screen>
        <ErrorText>{error ?? "Page not found"}</ErrorText>
      </Screen>
    );
  }

  return (
    <Screen>
      <Card style={{ gap: 14 }}>
        <Field label="Title" required>
          <TextField value={title} onChangeText={setTitle} />
        </Field>
        <Field label="Status">
          <Select value={status} placeholder="Status" options={STATUS_OPTIONS} onChange={setStatus} />
        </Field>
        <Field label="Excerpt">
          <TextField value={excerpt} onChangeText={setExcerpt} multiline numberOfLines={3} />
        </Field>
        <Field label="SEO title">
          <TextField value={seoTitle} onChangeText={setSeoTitle} />
        </Field>
        <Field label="SEO description">
          <TextField value={seoDescription} onChangeText={setSeoDescription} multiline numberOfLines={3} />
        </Field>
        <ErrorText>{error}</ErrorText>
        <Button title="Save" onPress={save} loading={saving} />
      </Card>
    </Screen>
  );
}
