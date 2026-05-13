"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, CheckCircle, Sparkles, Layout } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

interface Props {
  templateSlug: string;
  templateName: string;
  isActive: boolean;
  tenantId: string;
}

export function TemplateApplyButton({ templateSlug, templateName, isActive, tenantId }: Props) {
  const [applying, setApplying] = useState(false);
  const [mode, setMode] = useState<"theme" | "full">("theme");
  const router = useRouter();

  async function apply() {
    if (!tenantId) {
      toast.error("No site found. Make sure you are in a site context.");
      return;
    }
    const confirmMsg = mode === "full"
      ? `Apply "${templateName}" in Full Demo mode? This will overwrite your home page with template content, services, testimonials, pricing, gallery and contact details.`
      : `Apply "${templateName}" in Theme mode? This changes colors, fonts and layout variants only. Your existing content is preserved.`;
    if (!confirm(confirmMsg)) return;

    setApplying(true);
    try {
      const res = await fetch("/api/templates/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId, templateSlug, mode }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Apply failed");
      toast.success(`"${templateName}" applied! Your site now uses this template.`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to apply template");
    } finally {
      setApplying(false);
    }
  }

  if (isActive) {
    return (
      <div className="flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-green-600">
        <CheckCircle className="h-3.5 w-3.5" /> Currently Active
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Mode toggle */}
      <div className="flex gap-1">
        <button
          onClick={() => setMode("theme")}
          className={cn(
            "flex-1 flex items-center justify-center gap-1 text-[10px] font-semibold py-1.5 rounded border transition-all",
            mode === "theme"
              ? "bg-primary text-primary-foreground border-primary"
              : "border-border text-muted-foreground hover:border-primary/40",
          )}
        >
          <Layout className="w-2.5 h-2.5" /> Theme only
        </button>
        <button
          onClick={() => setMode("full")}
          className={cn(
            "flex-1 flex items-center justify-center gap-1 text-[10px] font-semibold py-1.5 rounded border transition-all",
            mode === "full"
              ? "bg-primary text-primary-foreground border-primary"
              : "border-border text-muted-foreground hover:border-primary/40",
          )}
        >
          <Sparkles className="w-2.5 h-2.5" /> Full demo
        </button>
      </div>
      <p className="text-[9px] text-muted-foreground leading-tight">
        {mode === "theme"
          ? "Colors, fonts & layout variants only. Content unchanged."
          : "Full rebuild: real images, services, testimonials, pricing, home page."}
      </p>
      {/* Apply button */}
      <button
        onClick={apply}
        disabled={applying}
        className="w-full py-2 rounded-lg text-xs font-bold bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-1.5 transition-all"
      >
        {applying ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
        {applying ? "Applying…" : `Apply ${templateName}`}
      </button>
    </div>
  );
}
