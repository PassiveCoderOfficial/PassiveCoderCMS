"use client";

import { useState } from "react";
import { Sparkles, Loader2, Plus, X, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useBuilderStore } from "@/lib/store/builder";
import type { Block, BlockType } from "@/types/cms";

const SUPPORTED: { type: BlockType; label: string }[] = [
  { type: "hero", label: "Hero / Welcome Banner" },
  { type: "text", label: "Text Section" },
  { type: "services", label: "Services" },
  { type: "cta", label: "Call to Action" },
  { type: "testimonials", label: "Testimonials" },
  { type: "faq", label: "FAQ" },
  { type: "features", label: "Features" },
];

export function AiCoderDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { addBlock, selectedBlockId } = useBuilderStore();
  const [blockType, setBlockType] = useState<BlockType>("hero");
  const [instruction, setInstruction] = useState("");
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<Block | null>(null);
  const [error, setError] = useState("");

  async function generate() {
    if (!instruction.trim()) { toast.error("Describe what you want this section to say"); return; }
    setLoading(true);
    setError("");
    setPreview(null);
    try {
      const res = await fetch("/api/aicoder/generate-block", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blockType, instruction }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "AiCoder couldn't generate this section");
      setPreview(data.block as Block);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function applyToPage() {
    if (!preview) return;
    addBlock(preview, selectedBlockId ?? undefined);
    toast.success("AiCoder section added — remember to Save");
    setPreview(null);
    setInstruction("");
    onClose();
  }

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40" onClick={onClose} />
      <div className="fixed top-0 right-0 h-full w-full sm:w-[420px] z-50 bg-background border-l shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-4 h-12 border-b shrink-0">
          <span className="font-semibold text-sm flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" /> AiCoder
          </span>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <p className="text-xs text-muted-foreground">
            AiCoder writes the content for one section at a time — you review it before it's added to your page.
          </p>

          <div className="space-y-1.5">
            <Label className="text-xs">Section type</Label>
            <Select value={blockType} onValueChange={(v) => setBlockType(v as BlockType)}>
              <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                {SUPPORTED.map(s => <SelectItem key={s.type} value={s.type}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">What should it say?</Label>
            <Textarea
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              rows={4}
              placeholder="e.g. We're a plumbing company in Dhaka, 10 years experience, emergency call-outs and installations"
              className="text-sm"
            />
          </div>

          <Button onClick={generate} disabled={loading} className="w-full gap-1.5">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {preview ? "Regenerate" : "Generate"}
          </Button>

          {error && (
            <div className="rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2.5 text-xs text-destructive">
              {error}
            </div>
          )}

          {preview && (
            <div className="rounded-lg border p-3 space-y-2 bg-muted/30">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Preview</p>
              <BlockContentPreview block={preview} />
              <div className="flex gap-2 pt-1">
                <Button size="sm" className="flex-1 gap-1.5" onClick={applyToPage}>
                  <Plus className="w-3.5 h-3.5" /> Add to Page
                </Button>
                <Button size="sm" variant="outline" className="gap-1.5" onClick={generate} disabled={loading}>
                  <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

/** Minimal read-only preview of the generated content — not a live block
 *  render (that would need the full page-renderer context), just enough
 *  text so the user can judge the copy before committing. */
function BlockContentPreview({ block }: { block: Block }) {
  const data = block.data as Record<string, unknown>;
  const title = typeof data.title === "string" ? data.title : undefined;
  const subtitle = typeof data.subtitle === "string" ? data.subtitle : undefined;
  const description = typeof data.description === "string" ? data.description : undefined;
  const items = Array.isArray(data.items) ? data.items as Record<string, unknown>[] : undefined;
  const content = typeof data.content === "string" ? data.content : undefined;

  return (
    <div className="space-y-1.5 text-sm">
      {title && <p className="font-semibold">{title}</p>}
      {subtitle && <p className="text-muted-foreground text-xs">{subtitle}</p>}
      {description && <p className="text-xs">{description}</p>}
      {content && <div className="text-xs text-muted-foreground" dangerouslySetInnerHTML={{ __html: content }} />}
      {items && (
        <ul className="space-y-1 pt-1">
          {items.map((item, i) => (
            <li key={i} className="text-xs">
              <span className="font-medium">{String(item.title ?? item.question ?? item.name ?? "")}</span>
              {Boolean(item.description || item.answer || item.content) && (
                <span className="text-muted-foreground"> — {String(item.description ?? item.answer ?? item.content)}</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
