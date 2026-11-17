"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useT } from "@/lib/i18n/language-provider";
import { HIERARCHY_TYPES, orderAsTree, selfAndDescendants, type ParentOption } from "@/lib/pages/page-parent";

/** The site's pages that can be parents (not trashed, not blog posts). */
export function useParentOptions(tenantId: string | null | undefined) {
  const [options, setOptions] = useState<ParentOption[]>([]);
  useEffect(() => {
    if (!tenantId) return;
    let cancelled = false;
    createClient()
      .from("pages")
      .select("id, title, slug, parent_id")
      .eq("tenant_id", tenantId)
      .in("type", [...HIERARCHY_TYPES])
      .is("deleted_at", null)
      .order("title")
      .then(({ data }) => { if (!cancelled) setOptions((data as ParentOption[] | null) ?? []); });
    return () => { cancelled = true; };
  }, [tenantId]);
  return options;
}

/**
 * "Parent page" picker: every page on the site, indented under its parent.
 * `exclude` pages (and their sub-pages) are left out, since a page can't sit
 * under itself. The database refuses anything else that isn't allowed.
 */
export function ParentPageSelect({
  options, value, onChange, exclude = [], id, className,
}: {
  options: ParentOption[];
  value: string | null;
  onChange: (id: string | null) => void;
  exclude?: string[];
  id?: string;
  className?: string;
}) {
  const t = useT();
  const rows = useMemo(() => {
    const blocked = selfAndDescendants(exclude, options);
    return orderAsTree(options).filter((o) => !blocked.has(o.id));
  }, [options, exclude]);

  return (
    <select
      id={id}
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value || null)}
      className={className ?? "h-9 w-full rounded-md border bg-background px-3 text-sm"}
    >
      <option value="">{t("pages.noParent")}</option>
      {rows.map((o) => (
        <option key={o.id} value={o.id}>
          {"  ".repeat(o.depth)}{o.depth ? "↳ " : ""}{o.title} (/{o.slug === "home" ? "" : o.slug})
        </option>
      ))}
    </select>
  );
}
