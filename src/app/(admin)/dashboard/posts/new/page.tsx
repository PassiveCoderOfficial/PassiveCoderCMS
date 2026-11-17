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
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, ChevronLeft } from "lucide-react";
import Link from "next/link";

const schema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers, and hyphens"),
  excerpt: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function NewPostPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: "", slug: "", excerpt: "" },
  });

  const [slugManuallyEdited, setSlugManuallyEdited] = React.useState(false);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    form.setValue("title", e.target.value);
    if (!slugManuallyEdited) {
      form.setValue("slug", createSlug(e.target.value), { shouldValidate: true });
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
      // Resolve the user's tenant so the post is scoped (primary membership first).
      const { data: membership } = await supabase
        .from("tenant_members")
        .select("tenant_id, is_primary")
        .eq("user_id", user?.id ?? "")
        .order("is_primary", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!membership?.tenant_id) {
        toast.error("No tenant found for your account");
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from("pages")
        .insert({
          title: values.title,
          slug: values.slug,
          type: "post",
          excerpt: values.excerpt,
          status: "draft",
          blocks: [],
          settings: { show_header: true, show_footer: true },
          seo: {},
          created_by: user?.id,
          tenant_id: membership.tenant_id,
        })
        .select("id")
        .single();

      if (error) throw error;
      toast.success("Post created! Opening builder...");
      router.push(`/dashboard/pages/${data.id}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create post";
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
    <div className="p-6 max-w-xl">
      <div className="flex items-center gap-2 mb-6">
        <Link href="/dashboard/posts" className="text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-2xl font-bold">New Post</h1>
      </div>
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-1.5">
              <Label>Post Title</Label>
              <Input {...form.register("title")} onChange={handleTitleChange} placeholder="e.g. My First Blog Post" />
              {form.formState.errors.title && <p className="text-xs text-destructive">{form.formState.errors.title.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>URL Slug</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground shrink-0">blog/</span>
                <Input {...form.register("slug")} onChange={handleSlugChange} placeholder="post-slug" />
              </div>
              {form.formState.errors.slug && <p className="text-xs text-destructive">{form.formState.errors.slug.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Excerpt (optional)</Label>
              <Textarea {...form.register("excerpt")} placeholder="Brief summary..." rows={3} />
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Create & Open Builder
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
