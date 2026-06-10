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
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("pages")
        .insert({
          title: values.title,
          slug: values.slug,
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
      toast.success("Page created! Opening builder...");
      router.push(`/dashboard/pages/${data.id}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create page";
      if (msg.includes("duplicate")) {
        form.setError("slug", { message: "This slug is already taken" });
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
        <Label>URL Slug</Label>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground shrink-0">yourdomain.com/</span>
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
