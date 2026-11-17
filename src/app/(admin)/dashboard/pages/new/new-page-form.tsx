"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { createSlug } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { friendlyPageLimitMessage } from "@/lib/usage/page-limit";
import { PageLimitNotice, toastPageLimit } from "@/components/admin/page-limit-notice";
import { ParentPageSelect, useParentOptions } from "@/components/admin/parent-page-select";
import { setPageParent } from "@/lib/pages/page-parent";

const schema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers, and hyphens"),
  type: z.enum(["page", "landing", "portfolio"]),
  excerpt: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export function NewPageForm({ tenantId }: { tenantId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [limitMessage, setLimitMessage] = useState<string | null>(null);
  const parentOptions = useParentOptions(tenantId);
  const [parentId, setParentId] = useState<string | null>(null);
  const parentSlug = parentOptions.find((p) => p.id === parentId)?.slug ?? null;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { type: "page", title: "", slug: "", excerpt: "" },
  });

  const [slugManuallyEdited, setSlugManuallyEdited] = React.useState(false);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    form.setValue("title", title);
    if (!slugManuallyEdited) {
      form.setValue("slug", createSlug(title), { shouldValidate: true });
    }
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSlugManuallyEdited(e.target.value.length > 0);
    form.setValue("slug", e.target.value, { shouldValidate: true });
  };

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    setLimitMessage(null);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      // A child lives at /parent-path/own-slug.
      const fullSlug = parentSlug ? `${parentSlug}/${values.slug}` : values.slug;
      const { data, error } = await supabase
        .from("pages")
        .insert({
          title: values.title,
          slug: fullSlug,
          parent_id: parentId,
          type: values.type,
          excerpt: values.excerpt,
          status: "draft",
          blocks: [],
          settings: { show_header: true, show_footer: true },
          seo: {},
          created_by: user?.id,
          tenant_id: tenantId,
        })
        .select("id")
        .single();

      if (error) throw error;
      if (parentId) {
        // Same rules as every other parent change (set_page_parent, migration 215).
        const res = await setPageParent(supabase, [data.id], parentId);
        if (res.error) {
          await supabase.from("pages").delete().eq("id", data.id);
          toast.error(res.error);
          return;
        }
      }
      toast.success("Page created! Opening builder...");
      router.push(`/dashboard/pages/${data.id}`);
    } catch (err: unknown) {
      // Supabase's PostgrestError is a plain object, not an Error instance —
      // `err instanceof Error` is false for it, so its real .message was
      // being discarded in favor of a generic fallback, masking the actual
      // duplicate-slug cause behind a useless toast.
      const msg = (err && typeof err === "object" && "message" in err && typeof err.message === "string")
        ? err.message
        : "Failed to create page";
      // The page-limit trigger's raw Postgres text only flashed by in a toast,
      // so the button looked like it did nothing. Show it inline as well.
      const limitMsg = friendlyPageLimitMessage(err);
      if (limitMsg) {
        setLimitMessage(limitMsg);
        toastPageLimit(limitMsg);
      } else if (msg.includes("duplicate")) {
        form.setError("slug", { message: parentSlug ? `A page at /${parentSlug}/${values.slug} already exists` : "This slug is already taken" });
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
      <div className="space-y-1.5">
        <Label>Page Title</Label>
        <Input {...form.register("title")} onChange={handleTitleChange} placeholder="e.g. Home, About Us, Services..." autoComplete="off" />
        {form.formState.errors.title && <p className="text-xs text-destructive">{form.formState.errors.title.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="new-page-parent">Parent page (optional)</Label>
        <ParentPageSelect id="new-page-parent" options={parentOptions} value={parentId} onChange={setParentId} />
        <p className="text-xs text-muted-foreground">Put this page under another one, e.g. a service under Services.</p>
      </div>

      <div className="space-y-1.5">
        <Label>URL Slug</Label>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground shrink-0 max-w-[60%] truncate">yourdomain.com/{parentSlug ? `${parentSlug}/` : ""}</span>
          <Input {...form.register("slug")} onChange={handleSlugChange} placeholder="page-slug" />
        </div>
        {form.formState.errors.slug && <p className="text-xs text-destructive">{form.formState.errors.slug.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label>Page Type</Label>
        <Select defaultValue="page" onValueChange={(v) => form.setValue("type", v as "page" | "landing" | "portfolio")}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="page">Standard Page</SelectItem>
            <SelectItem value="landing">Landing Page</SelectItem>
            <SelectItem value="portfolio">Portfolio</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label>Excerpt (optional)</Label>
        <Textarea {...form.register("excerpt")} placeholder="Brief description..." rows={3} />
      </div>

      {limitMessage && <PageLimitNotice message={limitMessage} />}

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Create & Open Builder
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
      </div>
    </form>
  );
}
