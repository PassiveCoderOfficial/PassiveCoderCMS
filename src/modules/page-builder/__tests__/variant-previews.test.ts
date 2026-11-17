/**
 * Blocks audit Nov 2026: the Layout picker draws every option with the real
 * block renderer (PreviewContent -> the canvas BlockRenderer), fed the block
 * the click would produce (blockWithVariant = the click's own patch + merge).
 *
 * For every block type that has layouts and every layout key, this renders
 * that exact preview from the registry's starting content and checks:
 *  - it renders (no throw), so no option falls back to the old wireframe;
 *  - picking the option really changes what is drawn (each key's markup
 *    differs from the other keys'), except keys that are documented to draw
 *    the same layout as another one (see SAME_AS);
 *  - the ticked option after a click is the key that was clicked.
 * Run: npx tsx --test src/modules/page-builder/__tests__/variant-previews.test.ts
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { PathnameContext } from "next/dist/shared/lib/hooks-client-context.shared-runtime";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { SiteContactProvider } from "@/components/site/site-contact-context";
import { PreviewContent } from "@/components/admin/page-builder/previews/preview-content";
import { activeVariantKey, blockWithVariant } from "@/components/admin/page-builder/previews/variant-preview";
import { BLOCK_VARIANTS, getVariantsForBlock } from "../block-variants";
import { blockRegistry, createBlock } from "../block-registry";
import { sectionPresets } from "../section-presets";
import { blockTypePreviewSource, presetPreviewSource } from "@/components/admin/page-builder/previews/preset-preview";
import type { Block, BlockType } from "@/types/cms";

const contact = { phone: "+65 6123 4567", whatsapp: "+65 8123 4567", email: "hello@example.com", address: "1 Example Road, Singapore" };

function draw(block: Block): string {
  // The builder runs inside the app router; blocks that call useRouter need it mounted.
  const noop = () => {};
  const router = { back: noop, forward: noop, refresh: noop, push: noop, replace: noop, prefetch: noop, hmrRefresh: noop };
  const node = React.createElement(
    AppRouterContext.Provider,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    { value: router as any },
    React.createElement(PathnameContext.Provider, { value: "/" },
      React.createElement(SiteContactProvider as React.ComponentType<{ value: unknown; children?: React.ReactNode }>, { value: contact },
        React.createElement(PreviewContent, { block }))),
  );
  const origError = console.error;
  console.error = () => {};
  try {
    return renderToStaticMarkup(node);
  } finally {
    console.error = origError;
  }
}

/**
 * Keys that draw the same markup as another key from the registry's
 * starting content, and why. Anything not listed must look different.
 */
const SAME_AS: Record<string, string> = {
  // The renderer draws Colored with no background colour set exactly as Dark
  // (footer-block.tsx: isDark = dark, or no colour and not light). The tile
  // is honest: that is what the click gives until a colour is picked.
  "footer:colored": "Colored without a background colour = Dark.",
};

/** Layouts that only differ once live data is loaded in the browser. */
const LIVE_DATA = new Set<string>([
  // Products load client-side (EcommerceProductsPreview); a server render
  // shows the same loading state in every layout.
  "ecommerce_products",
]);

const types = [...(Object.keys(BLOCK_VARIANTS) as BlockType[]), "cards" as BlockType];

for (const type of types) {
  test(`layout picker: every ${type} layout renders with the real renderer`, () => {
    const start = createBlock(type);
    assert.ok(start, `registry creates ${type}`);
    const variants = getVariantsForBlock(type);
    assert.ok(variants.length > 0, `${type} has layouts`);
    const out = new Map<string, string>();
    for (const v of variants) {
      const preview = blockWithVariant(start!, v.key, variants);
      let markup = "";
      assert.doesNotThrow(() => { markup = draw(preview); }, `${type} "${v.key || "default"}" renders`);
      assert.ok(markup.length > 0, `${type} "${v.key || "default"}" draws something`);
      // The option a click on this tile ticks is this tile.
      assert.equal(activeVariantKey(preview, variants), v.key, `${type}: picking "${v.key}" ticks it`);
      out.set(v.key, markup);
    }
    // Different layouts draw different markup (otherwise the picker would
    // show two identical tiles for two names).
    if (LIVE_DATA.has(type)) return;
    const seen = new Map<string, string>();
    for (const [key, markup] of out) {
      const dup = seen.get(markup);
      if (dup !== undefined && !SAME_AS[`${type}:${key}`] && !SAME_AS[`${type}:${dup}`]) {
        assert.fail(`${type}: layouts "${dup || "default"}" and "${key || "default"}" draw identical markup`);
      }
      seen.set(markup, key);
    }
  });
}

test("section picker: every Designed Section preset renders its live preview", () => {
  const failed: string[] = [];
  for (const preset of sectionPresets) {
    const { block } = presetPreviewSource(preset);
    try {
      if (!draw(block)) failed.push(`${preset.id}: empty`);
    } catch (e) {
      failed.push(`${preset.id}: ${(e as Error).message}`);
    }
  }
  assert.deepEqual(failed, []);
});

test("block picker: every block type with a preview renders it", () => {
  const failed: string[] = [];
  for (const { type } of blockRegistry) {
    const src = blockTypePreviewSource(type);
    if (!src) continue;
    try {
      if (!draw(src.block)) failed.push(`${type}: empty`);
    } catch (e) {
      failed.push(`${type}: ${(e as Error).message}`);
    }
  }
  assert.deepEqual(failed, []);
});
