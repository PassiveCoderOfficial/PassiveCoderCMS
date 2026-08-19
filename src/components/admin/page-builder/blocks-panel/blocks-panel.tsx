"use client";

import React, { useEffect, useState } from "react";
import { blockRegistry, type BlockDefinition } from "@/modules/page-builder/block-registry";
import { presetsByCategory, presetCategoryLabels, type SectionPreset, type PresetCategory } from "@/modules/page-builder/section-presets";
import { useBuilderStore, withFreshIds } from "@/lib/store/builder";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Search, Plus, Trash2, Loader2, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { LayersPanel } from "./layers-panel";
import { SettingsPanel } from "../settings-panel/settings-panel";
import { ImportDialog } from "../import/import-dialog";
import { PresetThumbnail } from "./preset-thumbnail";
import { deepClone, generateId } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import type { Block, BlockType, ContainerBlockProps, NavigationBlockProps } from "@/types/cms";
import type { ModuleKey } from "@/components/admin/sidebar/nav-items";

interface SavedPreset {
  id: string;
  name: string;
  category: string;
  blocks: Block;
  created_at: string;
}

const categoryLabels: Record<string, string> = {
  layout: "Layout",
  content: "Content",
  media: "Media",
  ecommerce: "Ecommerce",
  interactive: "Interactive",
};

export function BlocksPanel({
  initialTab = "sections",
  allowedBlockTypes,
  blockDisplayOverrides,
}: {
  initialTab?: "sections" | "blocks" | "layers" | "config";
  /** Restricts the palette to these block types. Used by the header builder,
   *  where offering a pricing table or a blog roll would only invite mistakes.
   *  Unset means every block is available, as on a normal page. */
  allowedBlockTypes?: readonly BlockType[];
  /** Overrides a block's label/description/icon for this panel instance only
   *  — the registry's own copy (e.g. "Menu Bar") is written for the general
   *  page builder and doesn't always read as a header/footer element in a
   *  restricted context. Leaves every other consumer of the registry alone. */
  blockDisplayOverrides?: Partial<Record<BlockType, Partial<Pick<BlockDefinition, "label" | "description" | "icon">>>>;
}) {
  const { addBlock: addBlockRaw, setMobileSheet, selectedBlockId, tenantId } = useBuilderStore();
  // On mobile the panels live in a bottom sheet — adding a block should close
  // the sheet so the user immediately sees it land on the canvas. Harmless on
  // desktop (mobileSheet is always null there, so this is a no-op).
  const addBlock: typeof addBlockRaw = (block, afterId, path) => {
    addBlockRaw(block, afterId, path);
    setMobileSheet(null);
  };
  // A freshly-added nav block ships with placeholder links (Home/About/
  // Services/Contact) — if the tenant already has a real header menu saved,
  // use that instead so the block isn't obviously fake the moment it lands.
  async function addBlockSmart(block: Block, afterId?: string, path?: Parameters<typeof addBlockRaw>[2]) {
    if (block.type === "navigation" && tenantId) {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from("nav_menus")
          .select("items")
          .eq("tenant_id", tenantId)
          .eq("location", "header")
          .maybeSingle();
        const items = (data?.items as NavigationBlockProps["data"]["items"] | null) ?? null;
        if (items && items.length > 0) {
          (block as NavigationBlockProps).data.items = items;
        }
      } catch {
        // Fall through with the placeholder items — never block adding the section.
      }
    }
    addBlock(block, afterId, path);
  }
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"sections" | "blocks" | "layers" | "config">(initialTab);
  // Selecting a block anywhere (canvas click, layer click) jumps straight to
  // its settings — no need to manually flip to the Config tab every time.
  const prevSelectedRef = React.useRef(selectedBlockId);
  useEffect(() => {
    if (selectedBlockId && selectedBlockId !== prevSelectedRef.current) setTab("config");
    prevSelectedRef.current = selectedBlockId;
  }, [selectedBlockId]);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [sectionSource, setSectionSource] = useState<"global" | "mine">("global");
  const [importOpen, setImportOpen] = useState(false);
  const [savedPresets, setSavedPresets] = useState<SavedPreset[] | null>(null);
  const loadingSaved = tab === "sections" && sectionSource === "mine" && savedPresets === null;

  // Blocks tied to a disabled module (e.g. "Products" needs Ecommerce)
  // shouldn't be offered — null while loading means "don't filter yet"
  // rather than briefly hiding every gated block.
  const [enabledModuleKeys, setEnabledModuleKeys] = useState<Set<ModuleKey> | null>(null);

  useEffect(() => {
    fetch("/api/dashboard/modules")
      .then((r) => r.json())
      .then((data: { modules?: { key: ModuleKey; enabled: boolean }[] }) => {
        const enabled = (data.modules ?? []).filter((m) => m.enabled).map((m) => m.key);
        setEnabledModuleKeys(new Set(enabled));
      })
      .catch(() => setEnabledModuleKeys(new Set()));
  }, []);

  useEffect(() => {
    if (tab !== "sections" || sectionSource !== "mine" || savedPresets !== null) return;
    fetch("/api/page-builder/section-presets")
      .then((r) => r.json())
      .then((data) => setSavedPresets(Array.isArray(data) ? data : []))
      .catch(() => setSavedPresets([]));
  }, [tab, sectionSource, savedPresets]);

  async function deleteSavedPreset(id: string) {
    setSavedPresets((prev) => (prev ?? []).filter((p) => p.id !== id));
    await fetch(`/api/page-builder/section-presets?id=${id}`, { method: "DELETE" }).catch(() => {});
  }

  // Saved presets are reused across pages/insertions — regenerate every block
  // id (and nested column-block ids) on each add so duplicates never collide
  // in the store or share React keys. Shares the store's helper so the two
  // cannot drift on what "nested" means.
  const freshIds = (block: Block): Block => withFreshIds(deepClone(block));

  const q = search.toLowerCase();

  const displayBlocks = blockDisplayOverrides
    ? blockRegistry.map((b) => (blockDisplayOverrides[b.type] ? { ...b, ...blockDisplayOverrides[b.type] } : b))
    : blockRegistry;

  const filteredBlocks = displayBlocks.filter((b) => {
    const matchSearch = !q || b.label.toLowerCase().includes(q) || b.description.toLowerCase().includes(q);
    const matchCat = activeCategory === "all" || b.category === activeCategory;
    const matchModule = !b.moduleKey || !enabledModuleKeys || enabledModuleKeys.has(b.moduleKey);
    const matchAllowed = !allowedBlockTypes || allowedBlockTypes.includes(b.type);
    return matchSearch && matchCat && matchModule && matchAllowed;
  });

  const filteredPresetGroups = presetsByCategory
    .map((g) => ({
      ...g,
      presets: g.presets.filter(
        (p) => !q || p.label.toLowerCase().includes(q) || p.description.toLowerCase().includes(q),
      ),
    }))
    .filter((g) => g.presets.length > 0);

  const filteredSavedPresets = (savedPresets ?? []).filter(
    (p) => !q || p.name.toLowerCase().includes(q),
  );
  const savedByCategory = (Object.keys(presetCategoryLabels) as PresetCategory[])
    .map((cat) => ({
      category: cat,
      label: presetCategoryLabels[cat],
      presets: filteredSavedPresets.filter((p) => p.category === cat),
    }))
    .filter((g) => g.presets.length > 0);

  const categories = ["all", ...Object.keys(categoryLabels)];
  const grouped = categories.reduce((acc, cat) => {
    if (cat === "all") return acc;
    acc[cat] = filteredBlocks.filter((b) => b.category === cat);
    return acc;
  }, {} as Record<string, BlockDefinition[]>);

  // Primary tabs are just "Blocks" and "Config" — Sections/Blocks/Layers are
  // sub-views inside the "Blocks" group so this panel alone covers what used
  // to be split across a left blocks panel and a right settings panel.
  const primaryTab = tab === "config" ? "config" : "blocks";

  return (
    <div className="flex flex-col h-full">
      {/* Primary tabs */}
      <div className="flex border-b shrink-0">
        {([
          { value: "blocks", label: "Blocks" },
          { value: "config", label: "Config" },
        ] as const).map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value === "config" ? "config" : "sections")}
            className={cn(
              "flex-1 py-2 text-xs font-semibold transition-colors border-b-2",
              primaryTab === t.value
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Sub-tabs (only inside the "Blocks" group) */}
      {primaryTab === "blocks" && (
        <div className="flex border-b shrink-0 bg-muted/30">
          {([
            { value: "sections", label: "Sections" },
            { value: "blocks", label: "Blocks" },
            { value: "layers", label: "Layers" },
          ] as const).map((t) => (
            <button
              key={t.value}
              onClick={() => setTab(t.value)}
              data-testid={`panel-tab-${t.value}`}
              className={cn(
                "flex-1 py-1.5 text-[11px] font-medium transition-colors border-b-2",
                tab === t.value
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      {tab === "config" ? (
        <SettingsPanel />
      ) : (
        <>
      {/* Import — pull a layout in from another page or a template */}
      {tab !== "layers" && (
        <div className="px-2 pt-2 shrink-0">
          <button
            onClick={() => setImportOpen(true)}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed py-2 text-[11px] font-medium text-muted-foreground transition-colors hover:border-primary hover:text-primary"
          >
            <Download className="h-3 w-3" /> Import from page or template
          </button>
        </div>
      )}
      <ImportDialog open={importOpen} onClose={() => setImportOpen(false)} />

      {/* Search */}
      {tab !== "layers" && (
        <div className="p-3 border-b shrink-0">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder={tab === "sections" ? "Search sections..." : "Search blocks..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 text-xs"
            />
          </div>
        </div>
      )}

      {tab === "layers" ? (
        <LayersPanel />
      ) : tab === "sections" ? (
        <>
          <div className="flex gap-1 px-2 pt-2 shrink-0">
            {([
              { value: "global", label: "Global" },
              { value: "mine", label: "User Made" },
            ] as const).map((s) => (
              <button
                key={s.value}
                onClick={() => setSectionSource(s.value)}
                className={cn(
                  "px-2.5 py-1 rounded text-[11px] font-medium transition-colors",
                  sectionSource === s.value
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted",
                )}
              >
                {s.label}
              </button>
            ))}
          </div>

          {sectionSource === "global" ? (
            <div className="flex-1 overflow-y-auto p-2 space-y-4">
              <p className="text-[11px] text-muted-foreground px-1 leading-snug">
                Ready-made sections with text already written — click to add, then change the words to match your business.
              </p>
              {filteredPresetGroups.map((group) => (
                <div key={group.category}>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-1 mb-1.5">
                    {group.label}
                  </p>
                  <div className="space-y-1.5">
                    {group.presets.map((p) => (
                      <PresetRow key={p.id} preset={p} onAdd={() => void addBlockSmart(p.create())} />
                    ))}
                  </div>
                </div>
              ))}
              {!filteredPresetGroups.length && (
                <p className="text-center text-xs text-muted-foreground py-6">No sections found</p>
              )}
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-2 space-y-4">
              <p className="text-[11px] text-muted-foreground px-1 leading-snug">
                Sections saved from this site&apos;s page builder — select a container, then &quot;Save as section&quot; in its toolbar.
              </p>
              {loadingSaved && (
                <div className="flex items-center justify-center py-6 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              )}
              {!loadingSaved && savedByCategory.map((group) => (
                <div key={group.category}>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-1 mb-1.5">
                    {group.label}
                  </p>
                  <div className="space-y-1.5">
                    {group.presets.map((p) => (
                      <SavedPresetRow key={p.id} preset={p} onAdd={() => void addBlockSmart(freshIds(p.blocks))} onDelete={() => deleteSavedPreset(p.id)} />
                    ))}
                  </div>
                </div>
              ))}
              {!loadingSaved && !savedByCategory.length && (
                <p className="text-center text-xs text-muted-foreground py-6">No saved sections yet</p>
              )}
            </div>
          )}
        </>
      ) : (
        <>
          {/* Category filter */}
          <div className="flex gap-1 p-2 border-b overflow-x-auto shrink-0">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  "px-2.5 py-1 rounded text-xs font-medium whitespace-nowrap transition-colors",
                  activeCategory === cat
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted",
                )}
              >
                {cat === "all" ? "All" : categoryLabels[cat]}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-3">
            {activeCategory === "all" ? (
              Object.entries(grouped).map(([cat, blocks]) =>
                blocks.length ? (
                  <div key={cat}>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-1 mb-1">
                      {categoryLabels[cat]}
                    </p>
                    <BlockGrid blocks={blocks} onAdd={(def) => void addBlockSmart(def.create())} />
                  </div>
                ) : null,
              )
            ) : (
              <BlockGrid blocks={filteredBlocks} onAdd={(def) => void addBlockSmart(def.create())} />
            )}
            {!filteredBlocks.length && (
              <p className="text-center text-xs text-muted-foreground py-6">No blocks found</p>
            )}
          </div>
        </>
      )}
        </>
      )}
    </div>
  );
}

function PresetRow({ preset, onAdd }: { preset: SectionPreset; onAdd: () => void }) {
  return (
    <button
      onClick={onAdd}
      data-testid={`add-preset-${preset.id}`}
      aria-label={`Add section: ${preset.label}`}
      className="w-full flex flex-col rounded-lg border hover:border-primary hover:bg-primary/5 transition-all text-left group overflow-hidden"
    >
      <div className="p-1.5 pb-0">
        <PresetThumbnail kind={preset.thumb} />
      </div>
      <div className="flex items-start gap-2 p-2.5 pt-2">
        <span className="text-sm leading-none mt-0.5 shrink-0">{preset.icon}</span>
        <span className="flex-1 min-w-0">
          <span className="block text-xs font-semibold leading-tight">{preset.label}</span>
          <span className="block text-[10px] text-muted-foreground leading-snug mt-0.5">
            {preset.description}
          </span>
        </span>
        <Plus className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary shrink-0 mt-1" />
      </div>
    </button>
  );
}

function SavedPresetRow({ preset, onAdd, onDelete }: { preset: SavedPreset; onAdd: () => void; onDelete: () => void }) {
  return (
    <div className="w-full flex items-center gap-2 p-2.5 rounded-lg border hover:border-primary hover:bg-primary/5 transition-all group">
      <button onClick={onAdd} className="flex-1 min-w-0 text-left">
        <span className="block text-xs font-semibold leading-tight truncate">{preset.name}</span>
        <span className="block text-[10px] text-muted-foreground leading-snug mt-0.5">
          Saved {new Date(preset.created_at).toLocaleDateString()}
        </span>
      </button>
      <button onClick={onAdd} className="shrink-0 p-1 text-muted-foreground hover:text-primary">
        <Plus className="h-3.5 w-3.5" />
      </button>
      <button onClick={onDelete} className="shrink-0 p-1 text-muted-foreground hover:text-destructive">
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function BlockGrid({ blocks, onAdd }: { blocks: BlockDefinition[]; onAdd: (b: BlockDefinition) => void }) {
  return (
    <TooltipProvider delayDuration={400}>
      <div className="grid grid-cols-2 gap-1.5">
        {blocks.map((block) => (
          <Tooltip key={block.type}>
            <TooltipTrigger asChild>
              <button
                onClick={() => onAdd(block)}
                // Keyed by block type, not the display label — labels are
                // user-facing copy and get reworded, the type does not.
                data-testid={`add-block-${block.type}`}
                aria-label={`Add ${block.label} block`}
                className="flex flex-col items-center gap-1.5 p-3 rounded-lg border border-dashed hover:border-primary hover:bg-primary/5 transition-all text-center group"
              >
                <span className="text-xl leading-none">{block.icon}</span>
                <span className="text-[11px] font-medium leading-tight">{block.label}</span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="text-xs max-w-[200px]">{block.description}</TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
}
