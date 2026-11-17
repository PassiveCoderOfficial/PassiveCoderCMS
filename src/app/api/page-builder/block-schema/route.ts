import { NextResponse } from "next/server";
import { getApiCaller } from "@/lib/auth/api-caller";
import { blockRegistry } from "@/modules/page-builder/block-registry";
import { getVariantsForBlock, VARIANT_DATA_FIELD } from "@/modules/page-builder/block-variants";
import { presetCategoryLabels, sectionPresets } from "@/modules/page-builder/section-presets";
import {
  FOOTER_BLOCK_DISPLAY,
  FOOTER_BLOCK_TYPES,
  HEADER_BLOCK_DISPLAY,
  HEADER_BLOCK_TYPES,
} from "@/modules/page-builder/header-blocks";
import { resolveEnabledModules } from "@/lib/modules/resolve-modules";
import type { BlockType } from "@/types/cms";
import { BLOCK_FIELDS, CATEGORY_THUMB } from "@/modules/page-builder/block-fields";
import { labelBn } from "@/modules/page-builder/block-labels-bn";
import { descriptionBn } from "@/modules/page-builder/block-descriptions-bn";
import { createHash } from "crypto";

/**
 * The web page builder's block catalog, as data, for the mobile editor
 * (docs/mobile-app-plan.md §4.2): every block type with the exact default
 * block its create() builds, its layout variants, the built-in section
 * presets, and which types the header/footer builders offer. Filtered by the
 * site's enabled modules the same way the web Blocks panel is, so the phone
 * never offers a block the site can't use. One source of truth: the app
 * keeps no copy of the registry.
 */
export async function GET(req: Request) {
  const caller = await getApiCaller();
  if (!caller) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const modules = await resolveEnabledModules(caller.tenantId);
  // Super admins see every block, matching the web panel's SA bypass.
  const allowed = (key?: string) => !key || caller.isSuperAdmin || modules[key as keyof typeof modules];

  const blocks = blockRegistry
    .filter((d) => allowed(d.moduleKey))
    .map((d) => ({
      type: d.type,
      label: d.label,
      labelBn: labelBn(d.label),
      description: d.description,
      descriptionBn: descriptionBn(d.description),
      icon: d.icon,
      category: d.category,
      hidden: !!d.hidden,
      block: d.create(),
      // Field schema (block-fields.ts): labels EN/BN, control types, groups.
      fields: BLOCK_FIELDS[d.type]?.fields ?? [],
      thumb: BLOCK_FIELDS[d.type]?.thumb ?? CATEGORY_THUMB[d.category] ?? "banner",
      summary: BLOCK_FIELDS[d.type]?.summary ?? [],
      custom: !!BLOCK_FIELDS[d.type]?.custom,
      variants: getVariantsForBlock(d.type).map((v) => ({
        key: v.key, label: v.label, labelBn: labelBn(v.label), description: v.description, dark: !!v.dark, edgeToEdge: !!v.edgeToEdge,
        // The web picker's own silhouette for this variant.
        thumb: v.thumb,
      })),
      variantField: VARIANT_DATA_FIELD[d.type] ?? null,
    }));
  const known = new Set(blocks.map((b) => b.type));

  const presets = sectionPresets
    .filter((p) => known.has(p.blockType))
    .map((p) => ({
      id: p.id, label: p.label, labelBn: labelBn(p.label), description: p.description, descriptionBn: descriptionBn(p.description), icon: p.icon, category: p.category, blockType: p.blockType,
      thumb: p.thumb,
      block: p.create(),
    }));

  const relabel = (types: readonly BlockType[], display: typeof HEADER_BLOCK_DISPLAY) =>
    types.filter((t) => known.has(t)).map((t) => {
      const d = display[t] ?? {};
      const en = d.label ?? blockRegistry.find((b) => b.type === t)?.label;
      return { type: t, ...d, labelBn: labelBn(en), descriptionBn: descriptionBn(d.description) };
    });

  const body = JSON.stringify({
    blocks,
    presets,
    presetCategories: presetCategoryLabels,
    presetCategoriesBn: Object.fromEntries(Object.entries(presetCategoryLabels).map(([k, v]) => [k, labelBn(v) ?? v])),
    header: relabel(HEADER_BLOCK_TYPES, HEADER_BLOCK_DISPLAY),
    footer: relabel(FOOTER_BLOCK_TYPES, FOOTER_BLOCK_DISPLAY),
  });
  // Ids inside the default blocks are fresh per request; hash without them so
  // the ETag only changes on deploy (new schema/registry) or a module change.
  // Dates in defaults (countdown target) are time-based too.
  const stable = body.replace(/"id":"[^"]*"/g, "").replace(/"\d{4}-\d{2}-\d{2}T[^"]*"/g, "");
  const etag = `"${createHash("sha1").update(stable).digest("hex").slice(0, 16)}"`;
  if (req.headers.get("if-none-match") === etag) return new NextResponse(null, { status: 304, headers: { ETag: etag } });
  return new NextResponse(body, { status: 200, headers: { "Content-Type": "application/json", ETag: etag, "Cache-Control": "private, max-age=0, must-revalidate" } });
}
