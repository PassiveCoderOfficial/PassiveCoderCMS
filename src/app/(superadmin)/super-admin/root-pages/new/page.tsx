"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Globe } from "lucide-react";

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}

export default function NewRootPagePage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [loading, setLoading] = useState(false);

  function handleTitle(v: string) {
    setTitle(v);
    if (!slugEdited) setSlug(slugify(v));
  }

  async function create() {
    if (!title.trim() || !slug.trim()) { toast.error("Title and slug required"); return; }
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("pages")
      .insert({
        title,
        slug,
        type: "page",
        status: "draft",
        blocks: [],
        settings: { show_header: true, show_footer: true },
        seo: {},
        tenant_id: null,
      })
      .select("id")
      .single();
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Page created");
    router.push(`/super-admin/root-pages/${data.id}`);
  }

  return (
    <div className="p-6 max-w-md space-y-6">
      <div className="flex items-center gap-3">
        <Globe className="w-6 h-6 text-indigo-400" />
        <h1 className="text-2xl font-bold text-white">New Root Page</h1>
      </div>
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
        <div>
          <Label className="text-gray-400 text-xs">Page Title</Label>
          <Input
            value={title}
            onChange={e => handleTitle(e.target.value)}
            placeholder="Home, About, Pricing…"
            className="mt-1 bg-gray-800 border-gray-700 text-white"
            autoFocus
          />
        </div>
        <div>
          <Label className="text-gray-400 text-xs">URL Slug</Label>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-gray-500">passivecoder.com/</span>
            <Input
              value={slug}
              onChange={e => { setSlugEdited(true); setSlug(slugify(e.target.value)); }}
              placeholder="home"
              className="bg-gray-800 border-gray-700 text-white font-mono"
            />
          </div>
          <p className="text-xs text-gray-600 mt-1">Use <span className="font-mono text-amber-400">home</span> to replace the root homepage.</p>
        </div>
        <div className="flex gap-2 pt-1">
          <Button onClick={create} disabled={loading} className="bg-indigo-600 hover:bg-indigo-500">
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Create & Open Builder
          </Button>
          <Button variant="outline" onClick={() => router.back()}>Cancel</Button>
        </div>
      </div>
    </div>
  );
}
