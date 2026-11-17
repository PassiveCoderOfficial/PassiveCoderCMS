"use client";

/**
 * Builder canvas only (menus P2): what a page Menu block shows while it has
 * no links. Pick one of the site's saved menus in one click, or create a
 * new one. The live site renders nothing for an empty Menu block.
 */
import { useState } from "react";
import { ListTree, Plus } from "lucide-react";
import type { HeaderNavBlockProps } from "@/types/cms";
import { useBuilderStore } from "@/lib/store/builder";
import { useT } from "@/lib/i18n/language-provider";
import { refreshSavedMenus, useSavedMenus } from "../saved-menus";
import { CreateMenuForm, editMenuHref } from "@/components/admin/menus/saved-menu-select";

export function MenuBlockPlaceholder({ block }: { block: HeaderNavBlockProps }) {
  const t = useT();
  const { updateBlock } = useBuilderStore();
  const menus = useSavedMenus();
  const [creating, setCreating] = useState(false);
  const chosen = block.data.menuId ? menus?.find((m) => m.id === block.data.menuId) : undefined;
  const pick = (id: string) => updateBlock(block.id, { data: { ...block.data, menuId: id } });


  // Stop clicks from reaching the canvas's own block selection only on the buttons.
  const stop = (e: React.MouseEvent) => e.stopPropagation();

  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border-2 border-dashed border-primary/30 bg-primary/[0.03] px-4 py-5 text-center" data-menu-placeholder="">
      <ListTree className="h-5 w-5 text-primary" aria-hidden />
      <p className="text-sm font-medium">{chosen ? t("menuPlace.placeholderEmptyMenu", { name: chosen.name || t("menuPlace.unnamed") }) : t("menuPlace.placeholderTitle")}</p>
      <p className="max-w-sm text-xs text-muted-foreground">{chosen ? t("menuPlace.placeholderEmptyHint") : t("menuPlace.placeholderHint")}</p>
      <div className="flex flex-wrap justify-center gap-1.5">
        {!chosen && (menus ?? []).filter((m) => (m.items?.length ?? 0) > 0).slice(0, 4).map((m) => (
          <button key={m.id} type="button" onClick={(e) => { stop(e); pick(m.id); }}
            className="rounded-full border bg-background px-3 py-1 text-xs hover:border-primary hover:text-primary">
            {m.name || t("menuPlace.unnamed")}
          </button>
        ))}
        {chosen ? (
          <a href={editMenuHref(chosen.id)} target="_blank" rel="noopener" onClick={stop}
            className="rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">{t("menuPlace.editMenu")}</a>
        ) : (
          !creating && (
            <button type="button" onClick={(e) => { stop(e); setCreating(true); }}
              className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
              <Plus className="h-3 w-3" aria-hidden />{t("menuPlace.createMenu")}
            </button>
          )
        )}
      </div>
      {creating && !chosen && (
        <div className="w-full max-w-xs">
          <CreateMenuForm onCancel={() => setCreating(false)}
            onCreated={(menu) => { setCreating(false); refreshSavedMenus(); pick(menu.id); }} />
        </div>
      )}
      {menus === null && <p className="text-[11px] text-muted-foreground">{t("menuPlace.loading")}</p>}
    </div>
  );
}
