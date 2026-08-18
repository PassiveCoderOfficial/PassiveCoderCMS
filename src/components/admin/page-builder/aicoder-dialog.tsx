"use client";

import { useEffect, useState } from "react";
import {
  Sparkles, Loader2, Plus, X, RefreshCw, ShoppingCart, FileText,
  LayoutGrid, Trash2, AlertTriangle, Palette, Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
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
  { type: "stats", label: "Big Numbers" },
  { type: "icon_grid", label: "Icon Grid" },
  { type: "steps", label: "How It Works" },
  { type: "gallery", label: "Gallery" },
  { type: "team", label: "Team" },
  { type: "pricing", label: "Pricing" },
  { type: "contact", label: "Contact Form" },
  { type: "navigation", label: "Menu Bar" },
  { type: "footer", label: "Footer" },
  { type: "timeline", label: "Timeline" },
];

const BLOCK_LABEL = Object.fromEntries(SUPPORTED.map(s => [s.type, s.label]));

interface QuotaStatus {
  monthlyIncluded: number;
  usedThisMonth: number;
  purchasedRemaining: number;
  resetAt: string;
}

interface TopupPackage {
  id: string;
  name: string;
  generations: number;
  price_usd_cents: number;
}

interface PlannedSection {
  blockType: BlockType;
  brief: string;
  variantKey?: string;
}

interface PagePlan {
  pageTitle: string;
  metaDescription: string;
  sections: PlannedSection[];
}

interface BuiltSection {
  index: number;
  blockType: string;
  brief: string;
  block?: Block;
  error?: string;
}

interface ThemeSuggestion {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  headingFont: string;
  bodyFont: string;
  borderRadius: string;
  rationale: string;
}

type Mode = "section" | "page";

export function AiCoderDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { addBlock, setBlocks, selectedBlockId } = useBuilderStore();
  const [mode, setMode] = useState<Mode>("section");

  // Shared
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [quota, setQuota] = useState<QuotaStatus | null>(null);
  const [packages, setPackages] = useState<TopupPackage[] | null>(null);
  const [showBuy, setShowBuy] = useState(false);
  const [buyingId, setBuyingId] = useState<string | null>(null);

  // Section mode
  const [blockType, setBlockType] = useState<BlockType>("hero");
  const [instruction, setInstruction] = useState("");
  const [preview, setPreview] = useState<Block | null>(null);

  // Page mode
  const [brief, setBrief] = useState("");
  const [facts, setFacts] = useState<unknown>(null);
  const [plan, setPlan] = useState<PagePlan | null>(null);
  const [quotaWarning, setQuotaWarning] = useState<string | null>(null);
  const [built, setBuilt] = useState<BuiltSection[] | null>(null);
  const [theme, setTheme] = useState<ThemeSuggestion | null>(null);
  const [themeApplied, setThemeApplied] = useState(false);

  function refreshQuota() {
    fetch("/api/aicoder/quota")
      .then(r => r.json())
      .then(d => setQuota(d.error ? null : d))
      .catch(() => setQuota(null));
  }

  useEffect(() => {
    if (!open) return;
    refreshQuota();
    fetch("/api/aicoder/packages")
      .then(r => r.json())
      .then(d => setPackages(d.packages ?? []))
      .catch(() => setPackages([]));
  }, [open]);

  async function buyPackage(packageId: string) {
    setBuyingId(packageId);
    try {
      const res = await fetch("/api/aicoder/topup/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Couldn't start checkout");
      window.location.href = data.checkoutUrl;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't start checkout");
      setBuyingId(null);
    }
  }

  // ── Section mode ───────────────────────────────────────────────────────
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
      // Refetch rather than decrement locally — the server is the source of
      // truth for which pool (quota vs purchased) actually got consumed.
      refreshQuota();
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

  // ── Page mode ──────────────────────────────────────────────────────────
  async function planFullPage() {
    if (!brief.trim()) { toast.error("Paste or write a brief for the page"); return; }
    setLoading(true);
    setError("");
    setPlan(null);
    setBuilt(null);
    setTheme(null);
    setThemeApplied(false);
    try {
      const res = await fetch("/api/aicoder/plan-page", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brief }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "AiCoder couldn't plan this page");
      setFacts(data.facts);
      setPlan(data.plan);
      setQuotaWarning(data.affordable ? null : data.quotaMessage);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function buildFullPage() {
    if (!plan || !facts) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/aicoder/build-page", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ facts, sections: plan.sections }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "AiCoder couldn't build this page");
      setBuilt(data.sections as BuiltSection[]);
      refreshQuota();
      if (data.failedCount > 0) {
        toast.warning(`${data.failedCount} section${data.failedCount > 1 ? "s" : ""} couldn't be generated`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function removeSection(index: number) {
    if (!plan) return;
    setPlan({ ...plan, sections: plan.sections.filter((_, i) => i !== index) });
  }

  function updateSectionBrief(index: number, value: string) {
    if (!plan) return;
    const sections = [...plan.sections];
    sections[index] = { ...sections[index], brief: value };
    setPlan({ ...plan, sections });
  }

  function applyBuiltPage(replace: boolean) {
    if (!built) return;
    const blocks = built.filter(s => s.block).map(s => s.block as Block);
    if (blocks.length === 0) return;

    if (replace) {
      setBlocks(blocks.map((b, i) => ({ ...b, order: i })));
      toast.success(`Page replaced with ${blocks.length} AiCoder sections — remember to Save`);
    } else {
      blocks.forEach(b => addBlock(b));
      toast.success(`${blocks.length} AiCoder sections added — remember to Save`);
    }
    onClose();
  }

  async function loadTheme() {
    if (!facts) return;
    setLoading(true);
    try {
      const res = await fetch("/api/aicoder/suggest-theme", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ facts }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Couldn't suggest a theme");
      setTheme(data.theme as ThemeSuggestion);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't suggest a theme");
    } finally {
      setLoading(false);
    }
  }

  async function applyTheme() {
    if (!theme) return;
    setLoading(true);
    try {
      const res = await fetch("/api/aicoder/suggest-theme", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apply: true, theme }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Couldn't apply the theme");
      setThemeApplied(true);
      toast.success("Theme applied to the whole site");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't apply the theme");
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  const builtOk = built?.filter(s => s.block).length ?? 0;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40" onClick={onClose} />
      <div className="fixed top-0 right-0 h-full w-full sm:w-[480px] z-50 bg-background border-l shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-4 h-12 border-b shrink-0">
          <span className="font-semibold text-sm flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" /> AiCoder
          </span>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode switch */}
        <div className="flex gap-1 p-2 border-b shrink-0">
          <button
            onClick={() => { setMode("section"); setError(""); }}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              mode === "section" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted",
            )}
          >
            <LayoutGrid className="w-3.5 h-3.5" /> One Section
          </button>
          <button
            onClick={() => { setMode("page"); setError(""); }}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              mode === "page" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted",
            )}
          >
            <FileText className="w-3.5 h-3.5" /> Full Page
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {quota && (
            <div className="rounded-lg border px-3 py-2 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">
                  {quota.monthlyIncluded > 0
                    ? `${Math.max(0, quota.monthlyIncluded - quota.usedThisMonth)} of ${quota.monthlyIncluded} generations left this month`
                    : "No monthly generations on this plan"}
                </span>
                {quota.purchasedRemaining > 0 && (
                  <span className="text-primary font-medium">+{quota.purchasedRemaining} purchased</span>
                )}
              </div>
              <button
                onClick={() => setShowBuy(v => !v)}
                className="flex items-center gap-1 text-primary hover:underline"
              >
                <ShoppingCart className="w-3 h-3" /> {showBuy ? "Hide" : "Buy more generations"}
              </button>
              {showBuy && (
                <div className="space-y-1.5 pt-1">
                  {packages === null && <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />}
                  {packages?.length === 0 && (
                    <p className="text-muted-foreground">No top-up packages available right now.</p>
                  )}
                  {packages?.map(pkg => (
                    <div key={pkg.id} className="flex items-center justify-between rounded-md bg-muted/40 px-2.5 py-1.5">
                      <span>{pkg.generations.toLocaleString()} generations — ${(pkg.price_usd_cents / 100).toFixed(2)}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 text-[11px] px-2"
                        onClick={() => buyPackage(pkg.id)}
                        disabled={buyingId === pkg.id}
                      >
                        {buyingId === pkg.id ? <Loader2 className="w-3 h-3 animate-spin" /> : "Buy"}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2.5 text-xs text-destructive">
              {error}
            </div>
          )}

          {/* ── SECTION MODE ─────────────────────────────────────────── */}
          {mode === "section" && (
            <>
              <p className="text-xs text-muted-foreground">
                AiCoder writes the content for one section at a time — you review it before it&apos;s added to your page.
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
            </>
          )}

          {/* ── PAGE MODE ────────────────────────────────────────────── */}
          {mode === "page" && (
            <>
              {!plan && (
                <>
                  <p className="text-xs text-muted-foreground">
                    Paste a full brief — business, services, tone, what each part of the page should say.
                    AiCoder plans the sections first so you can review before it writes anything.
                  </p>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Page brief</Label>
                    <Textarea
                      value={brief}
                      onChange={(e) => setBrief(e.target.value)}
                      rows={12}
                      placeholder={"e.g.\n\nBUSINESS: Free Bird SG, electrical services in Singapore.\n\nSERVICES: Electrical, plumbing, handyman, CCTV, data cabling...\n\nGOAL: Get quotation enquiries from homeowners and businesses.\n\nDO NOT claim licensed, certified, 24/7 or years of experience."}
                      className="text-sm font-mono"
                    />
                  </div>
                  <Button onClick={planFullPage} disabled={loading} className="w-full gap-1.5">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    Plan the page
                  </Button>
                  <p className="text-[11px] text-muted-foreground text-center">
                    Planning is free — you only spend generations when you build.
                  </p>
                </>
              )}

              {plan && !built && (
                <>
                  <div className="rounded-lg border p-3 space-y-1.5">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">SEO</p>
                    <Input
                      value={plan.pageTitle}
                      onChange={e => setPlan({ ...plan, pageTitle: e.target.value })}
                      className="h-8 text-sm"
                    />
                    <Textarea
                      value={plan.metaDescription}
                      onChange={e => setPlan({ ...plan, metaDescription: e.target.value })}
                      rows={2}
                      className="text-xs"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {plan.sections.length} sections
                    </p>
                    <button onClick={() => setPlan(null)} className="text-xs text-muted-foreground hover:underline">
                      Start over
                    </button>
                  </div>

                  {quotaWarning && (
                    <div className="rounded-lg border border-amber-500/40 bg-amber-500/5 px-3 py-2 text-xs text-amber-600 flex gap-2">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span>{quotaWarning}</span>
                    </div>
                  )}

                  <div className="space-y-2">
                    {plan.sections.map((section, i) => (
                      <div key={i} className="rounded-lg border p-2.5 space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-medium">
                            {i + 1}. {BLOCK_LABEL[section.blockType] ?? section.blockType}
                          </span>
                          <div className="flex items-center gap-1.5">
                            {section.variantKey && (
                              <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                {section.variantKey}
                              </span>
                            )}
                            <button
                              onClick={() => removeSection(i)}
                              className="p-0.5 text-muted-foreground hover:text-destructive transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <Textarea
                          value={section.brief}
                          onChange={e => updateSectionBrief(i, e.target.value)}
                          rows={2}
                          className="text-xs"
                        />
                      </div>
                    ))}
                  </div>

                  <Button onClick={buildFullPage} disabled={loading || plan.sections.length === 0} className="w-full gap-1.5">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    Write all {plan.sections.length} sections
                  </Button>
                  {loading && (
                    <p className="text-[11px] text-muted-foreground text-center">
                      Writing each section in turn — this takes a minute or two.
                    </p>
                  )}
                </>
              )}

              {built && (
                <>
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {builtOk} of {built.length} sections written
                    </p>
                    <button onClick={() => { setBuilt(null); }} className="text-xs text-muted-foreground hover:underline">
                      Back to plan
                    </button>
                  </div>

                  <div className="space-y-2">
                    {built.map(section => (
                      <div
                        key={section.index}
                        className={cn(
                          "rounded-lg border p-2.5 space-y-1.5",
                          section.error ? "border-destructive/40 bg-destructive/5" : "bg-muted/30",
                        )}
                      >
                        <p className="text-xs font-medium">
                          {section.index + 1}. {BLOCK_LABEL[section.blockType] ?? section.blockType}
                        </p>
                        {section.error
                          ? <p className="text-xs text-destructive">{section.error}</p>
                          : section.block && <BlockContentPreview block={section.block} />}
                      </div>
                    ))}
                  </div>

                  {builtOk > 0 && (
                    <div className="space-y-2 pt-1">
                      <Button size="sm" className="w-full gap-1.5" onClick={() => applyBuiltPage(true)}>
                        <Plus className="w-3.5 h-3.5" /> Replace page with these {builtOk} sections
                      </Button>
                      <Button size="sm" variant="outline" className="w-full gap-1.5" onClick={() => applyBuiltPage(false)}>
                        <Plus className="w-3.5 h-3.5" /> Append to existing page
                      </Button>
                      <p className="text-[11px] text-muted-foreground text-center">
                        Replacing is undoable — your current page is snapshotted automatically.
                      </p>
                    </div>
                  )}

                  {/* Theme is site-wide, so it's offered separately and never
                      applied as a side effect of generating a page. */}
                  <div className="rounded-lg border p-3 space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
                      <Palette className="w-3.5 h-3.5" /> Site colours
                    </p>
                    {!theme ? (
                      <>
                        <p className="text-xs text-muted-foreground">
                          AiCoder can suggest a palette from your brief&apos;s design direction.
                        </p>
                        <Button size="sm" variant="outline" className="w-full h-7 text-xs" onClick={loadTheme} disabled={loading}>
                          Suggest a palette
                        </Button>
                      </>
                    ) : (
                      <>
                        <div className="flex gap-1.5">
                          {[theme.primaryColor, theme.secondaryColor, theme.accentColor, theme.backgroundColor, theme.textColor].map((c, i) => (
                            <div key={i} className="h-7 flex-1 rounded border" style={{ backgroundColor: c }} title={c} />
                          ))}
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          {theme.headingFont} / {theme.bodyFont} — {theme.rationale}
                        </p>
                        {themeApplied ? (
                          <p className="text-xs text-green-600 flex items-center gap-1.5">
                            <Check className="w-3.5 h-3.5" /> Applied to the whole site
                          </p>
                        ) : (
                          <>
                            <Button size="sm" className="w-full h-7 text-xs" onClick={applyTheme} disabled={loading}>
                              Apply to whole site
                            </Button>
                            <p className="text-[11px] text-amber-600">
                              This restyles every page. Your current theme is kept and can be switched back.
                            </p>
                          </>
                        )}
                      </>
                    )}
                  </div>
                </>
              )}
            </>
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
  const logoText = typeof data.logoText === "string" ? data.logoText : undefined;
  const content = typeof data.content === "string" ? data.content : undefined;

  // Blocks name their list field differently — show whichever one this block has.
  const listField = ["items", "members", "plans", "fields", "images", "columns"]
    .find(k => Array.isArray(data[k]));
  const items = listField ? data[listField] as Record<string, unknown>[] : undefined;

  return (
    <div className="space-y-1.5 text-sm">
      {logoText && <p className="font-semibold">{logoText}</p>}
      {title && <p className="font-semibold">{title}</p>}
      {subtitle && <p className="text-muted-foreground text-xs">{subtitle}</p>}
      {description && <p className="text-xs">{description}</p>}
      {content && <div className="text-xs text-muted-foreground" dangerouslySetInnerHTML={{ __html: content }} />}
      {items && (
        <ul className="space-y-1 pt-1">
          {items.slice(0, 8).map((item, i) => (
            <li key={i} className="text-xs">
              <span className="font-medium">
                {String(item.title ?? item.question ?? item.name ?? item.label ?? item.heading ?? item.caption ?? "")}
              </span>
              {Boolean(item.description || item.answer || item.content || item.role) && (
                <span className="text-muted-foreground"> — {String(item.description ?? item.answer ?? item.content ?? item.role)}</span>
              )}
            </li>
          ))}
          {items.length > 8 && (
            <li className="text-xs text-muted-foreground">+{items.length - 8} more</li>
          )}
        </ul>
      )}
    </div>
  );
}
