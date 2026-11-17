"use client";

import React, { useEffect, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ExternalLink } from "lucide-react";
import type { ItemBoxLink } from "@/types/cms";

type ContentType = "page" | "post" | "service" | "feature";

const ENDPOINT: Record<ContentType, string> = {
  page: "/api/pages?type=page",
  post: "/api/pages?type=post",
  service: "/api/services",
  feature: "/api/features",
};

const ADD_NEW_LINK: Record<ContentType, { href: string; label: string }> = {
  page: { href: "/dashboard/pages/new", label: "Add New Page" },
  post: { href: "/dashboard/posts/new", label: "Add New Post" },
  service: { href: "/dashboard/services", label: "Manage Service Groups" },
  feature: { href: "/dashboard/features", label: "Manage Feature Groups" },
};

interface Option {
  id: string;
  label: string;
}

/** Reusable "pick a page/post/service/feature and link to it" control —
 *  used by Item Box link overrides, and worth wiring into other blocks'
 *  button URL fields later. */
export function ContentPicker({ value, onChange }: {
  value: ItemBoxLink | undefined;
  onChange: (link: ItemBoxLink | undefined) => void;
}) {
  const linkType = value?.type ?? "manual";
  const [options, setOptions] = useState<Option[] | null>(null);
  const loading = linkType !== "manual" && options === null;

  useEffect(() => {
    if (linkType === "manual") return;
    fetch(ENDPOINT[linkType])
      .then((r) => r.json())
      .then((data: unknown) => {
        if (linkType === "service" || linkType === "feature") {
          const groups = data as { id: string; name: string; [k: string]: unknown }[];
          const itemsKey = linkType === "service" ? "service_items" : "feature_items";
          const flat: Option[] = [];
          for (const g of Array.isArray(groups) ? groups : []) {
            const items = (g[itemsKey] as { id: string; title: string }[] | undefined) ?? [];
            for (const it of items) flat.push({ id: it.id, label: `${it.title} (${g.name})` });
          }
          setOptions(flat);
        } else {
          const rows = data as { id: string; title: string }[];
          setOptions((Array.isArray(rows) ? rows : []).map((r) => ({ id: r.id, label: r.title })));
        }
      })
      .catch(() => setOptions([]));
  }, [linkType]);

  return (
    <div className="space-y-1.5">
      <Select
        value={linkType}
        onValueChange={(v) => {
          if (v === "manual") onChange({ type: "manual", url: "" });
          else onChange({ type: v as "page" | "post" | "service" | "feature", refId: "" });
        }}
      >
        <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="manual" className="text-xs">Manual URL</SelectItem>
          <SelectItem value="page" className="text-xs">Page</SelectItem>
          <SelectItem value="post" className="text-xs">Blog Post</SelectItem>
          <SelectItem value="service" className="text-xs">Service</SelectItem>
          <SelectItem value="feature" className="text-xs">Feature</SelectItem>
        </SelectContent>
      </Select>

      {linkType === "manual" ? (
        <Input
          value={value?.type === "manual" ? value.url : ""}
          onChange={(e) => onChange({ type: "manual", url: e.target.value })}
          placeholder="https://... or /page-slug"
          className="h-7 text-xs"
        />
      ) : (
        <Select
          value={value?.type !== "manual" ? value?.refId ?? "" : ""}
          onValueChange={(refId) => onChange({ type: linkType, refId })}
        >
          <SelectTrigger className="h-7 text-xs">
            <SelectValue placeholder={loading ? "Loading…" : "Select…"} />
          </SelectTrigger>
          <SelectContent>
            {(options ?? []).map((o) => (
              <SelectItem key={o.id} value={o.id} className="text-xs">{o.label}</SelectItem>
            ))}
            {!loading && !options?.length && (
              <SelectItem value="_none" className="text-xs text-muted-foreground" disabled>Nothing found</SelectItem>
            )}
          </SelectContent>
        </Select>
      )}

      {linkType !== "manual" && (
        <a href={ADD_NEW_LINK[linkType].href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
          <ExternalLink className="h-3 w-3" /> {ADD_NEW_LINK[linkType].label}
        </a>
      )}
    </div>
  );
}
