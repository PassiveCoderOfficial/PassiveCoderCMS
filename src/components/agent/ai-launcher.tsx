"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Sparkles, X, MessageSquare, Wand2, Loader2, Globe } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AgentModal } from "./agent-modal";
import { sectionForPath, type SectionDef } from "@/lib/aicoder/sections/registry";

/**
 * The single floating AI button, available on every dashboard page.
 *
 * Merged deliberately rather than shipping a second Sparkles button beside the
 * existing agent launcher: two near-identical floating buttons in the same
 * corner make the user guess which AI does what. One button, and the panel's
 * contents change with the section you are in.
 *
 * z-index matches the convention already used for floating action buttons
 * here and on the public site (see floating-whatsapp.tsx).
 */
export function AiLauncher({
  agentEnabled,
  aiCoderEnabled,
  hasBusinessProfile,
}: {
  agentEnabled: boolean;
  aiCoderEnabled: boolean;
  /** Section generation reads the stored profile for business context. With no
   *  profile AND no typed instruction the API refuses — surfaced up front so
   *  the user isn't told that only after clicking Generate. */
  hasBusinessProfile: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  const section = useMemo(
    () => (aiCoderEnabled ? sectionForPath(pathname ?? "") : null),
    [pathname, aiCoderEnabled],
  );

  // Close the panel on navigation — its actions are section-specific, so
  // leaving it open across a route change would offer the wrong ones.
  useEffect(() => { setOpen(false); }, [pathname]);

  if (!agentEnabled && !aiCoderEnabled) return null;

  return (
    <>
      <button
        onClick={() => setOpen(v => !v)}
        aria-label={open ? "Close AI menu" : "Open AI menu"}
        className="fixed bottom-5 right-5 z-[9998] inline-flex items-center justify-center w-14 h-14 rounded-full shadow-lg bg-primary text-primary-foreground hover:scale-105 active:scale-95 transition-transform"
      >
        {open ? <X className="w-6 h-6" /> : <Sparkles className="w-6 h-6" />}
      </button>

      {open && (
        <>
          {/* Click-away. Below the panel and button, above page content. */}
          <div className="fixed inset-0 z-[9996]" onClick={() => setOpen(false)} />
          <div className="fixed bottom-24 right-5 z-[9997] w-[340px] max-w-[calc(100vw-2.5rem)] rounded-xl border bg-popover shadow-2xl overflow-hidden">
            <div className="px-4 py-3 border-b">
              <p className="text-sm font-semibold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" /> AiCoder
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {section ? `Working in ${section.label}` : "Pick what you would like help with"}
              </p>
            </div>

            <div className="p-3 space-y-3 max-h-[60vh] overflow-y-auto">
              {section && (
                <SectionAction
                  section={section}
                  hasBusinessProfile={hasBusinessProfile}
                  onDone={() => { setOpen(false); router.refresh(); }}
                />
              )}

              {aiCoderEnabled && (
                <div className="space-y-1.5">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-0.5">
                    Whole site
                  </p>
                  <button
                    onClick={() => { setOpen(false); router.push("/dashboard/pages"); }}
                    className="w-full flex items-start gap-2.5 rounded-lg border p-2.5 text-left hover:border-primary hover:bg-primary/5 transition-colors"
                  >
                    <Globe className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <span className="min-w-0">
                      <span className="block text-xs font-medium">Build pages or a whole site</span>
                      <span className="block text-[11px] text-muted-foreground leading-snug">
                        Open a page and use AiCoder there to generate sections, a full page, or every page at once.
                      </span>
                    </span>
                  </button>
                </div>
              )}

              {agentEnabled && (
                <div className="space-y-1.5">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-0.5">
                    Ask
                  </p>
                  <button
                    onClick={() => { setOpen(false); setChatOpen(true); }}
                    className="w-full flex items-start gap-2.5 rounded-lg border p-2.5 text-left hover:border-primary hover:bg-primary/5 transition-colors"
                  >
                    <MessageSquare className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <span className="min-w-0">
                      <span className="block text-xs font-medium">Chat with the AI agent</span>
                      <span className="block text-[11px] text-muted-foreground leading-snug">
                        Ask a question about your site or get help with something specific.
                      </span>
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      <AgentModal open={chatOpen} onOpenChange={setChatOpen} />
    </>
  );
}

/** The section-specific generate action, with an inline preview before saving. */
function SectionAction({
  section, hasBusinessProfile, onDone,
}: {
  section: SectionDef;
  hasBusinessProfile: boolean;
  onDone: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [instruction, setInstruction] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [saving, setSaving] = useState(false);

  async function generate() {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/aicoder/section", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section: section.key, instruction }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Couldn't generate this");
      setResult(data.content as Record<string, unknown>);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't generate this");
    } finally {
      setLoading(false);
    }
  }

  async function apply() {
    if (!result) return;
    setSaving(true);
    try {
      const res = await fetch("/api/aicoder/section/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section: section.key, content: result }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Couldn't save");
      toast.success(data.message ?? "Saved");
      onDone();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't save");
    } finally {
      setSaving(false);
    }
  }

  const items = Array.isArray(result?.items) ? result.items as Record<string, unknown>[] : null;

  return (
    <div className="space-y-1.5">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-0.5">
        This section
      </p>

      {!expanded ? (
        <button
          onClick={() => setExpanded(true)}
          className="w-full flex items-start gap-2.5 rounded-lg border p-2.5 text-left hover:border-primary hover:bg-primary/5 transition-colors"
        >
          <Wand2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <span className="min-w-0">
            <span className="block text-xs font-medium">{section.actionLabel}</span>
            <span className="block text-[11px] text-muted-foreground leading-snug">{section.description}</span>
          </span>
        </button>
      ) : (
        <div className="rounded-lg border p-2.5 space-y-2">
          <p className="text-xs font-medium">{section.actionLabel}</p>
          <p className="text-[11px] text-muted-foreground leading-snug">{section.description}</p>

          <Textarea
            value={instruction}
            onChange={e => setInstruction(e.target.value)}
            rows={2}
            placeholder={hasBusinessProfile
              ? "Anything to add? (optional — your business profile is used automatically)"
              : "Describe your business — what you do, where, and for whom."}
            className="text-xs"
          />

          {!hasBusinessProfile && (
            <p className="text-[10px] text-amber-600 leading-snug">
              No business profile saved yet, so describe your business above — or
              {" "}
              <a href="/dashboard/business-profile" className="underline">fill in your profile</a>
              {" "}once and every AiCoder action uses it automatically.
            </p>
          )}

          <Button
            size="sm"
            className="w-full h-7 text-xs gap-1.5"
            onClick={generate}
            disabled={loading || (!hasBusinessProfile && !instruction.trim())}
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
            {result ? "Try again" : "Generate"}
          </Button>

          {result && (
            <div className="space-y-2 pt-1">
              <div className="rounded-md bg-muted/40 p-2 space-y-1.5 max-h-52 overflow-y-auto">
                {items
                  ? items.map((item, i) => (
                      <div key={i} className="text-[11px]">
                        <span className="font-medium">
                          {String(item.title ?? item.name ?? "")}
                        </span>
                        {Boolean(item.description ?? item.content) && (
                          <span className="text-muted-foreground"> — {String(item.description ?? item.content)}</span>
                        )}
                      </div>
                    ))
                  : (
                    <div className="text-[11px] space-y-1">
                      <p className="font-medium">{String(result.metaTitle ?? "")}</p>
                      <p className="text-muted-foreground">{String(result.metaDescription ?? "")}</p>
                    </div>
                  )}
              </div>
              <Button size="sm" className="w-full h-7 text-xs" onClick={apply} disabled={saving}>
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                {section.key === "seo" ? "Save to SEO settings" : "Add to my site"}
              </Button>
              <p className="text-[10px] text-muted-foreground text-center leading-snug">
                {section.key === "testimonials"
                  ? "Placeholders only — replace with real reviews before publishing."
                  : "Added alongside what you already have. Nothing is overwritten."}
              </p>
            </div>
          )}

          <button
            onClick={() => { setExpanded(false); setResult(null); }}
            className="w-full text-[11px] text-muted-foreground hover:underline"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
