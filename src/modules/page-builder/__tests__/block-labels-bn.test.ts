/**
 * Every name the block catalog shows (block types, layout variants, section
 * presets and categories, header/footer display names) has a Bangla name.
 * Run: npm run test:builder
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { blockRegistry } from "../block-registry";
import { BLOCK_VARIANTS } from "../block-variants";
import { presetCategoryLabels, sectionPresets } from "../section-presets";
import { FOOTER_BLOCK_DISPLAY, HEADER_BLOCK_DISPLAY } from "../header-blocks";
import { labelBn } from "../block-labels-bn";
import { descriptionBn } from "../block-descriptions-bn";

test("every catalog name has a Bangla name", () => {
  const names = new Set<string>();
  for (const d of blockRegistry) names.add(d.label);
  for (const list of Object.values(BLOCK_VARIANTS)) for (const v of list ?? []) names.add(v.label);
  for (const p of sectionPresets) names.add(p.label);
  for (const v of Object.values(presetCategoryLabels)) names.add(v);
  for (const d of [...Object.values(HEADER_BLOCK_DISPLAY), ...Object.values(FOOTER_BLOCK_DISPLAY)]) if (d?.label) names.add(d.label);
  const missing = [...names].filter((n) => !labelBn(n)).sort();
  assert.deepEqual(missing, []);
});

test("Bangla names keep Latin numerals", () => {
  for (const n of [...blockRegistry.map((d) => d.label), ...sectionPresets.map((p) => p.label)]) {
    const bn = labelBn(n);
    if (bn) assert.ok(!/[০-৯]/.test(bn), `${n} -> ${bn}`);
  }
});

test("every Add Block description has a Bangla description", () => {
  const texts = new Set<string>();
  for (const d of blockRegistry) if (d.description) texts.add(d.description);
  for (const p of sectionPresets) if (p.description) texts.add(p.description);
  for (const d of [...Object.values(HEADER_BLOCK_DISPLAY), ...Object.values(FOOTER_BLOCK_DISPLAY)]) {
    const desc = (d as { description?: string } | undefined)?.description;
    if (desc) texts.add(desc);
  }
  const missing = [...texts].filter((n) => !descriptionBn(n)).sort();
  assert.deepEqual(missing, []);
});
