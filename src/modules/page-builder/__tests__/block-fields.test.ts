/**
 * BLOCK_FIELDS coverage: every block type in the registry has a schema with a
 * valid thumb; for non-custom blocks every key of create().data (and of each
 * list item's defaults) is listed; select defaults are among their options;
 * showWhen points at a real sibling. Run: npm run test:builder
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { blockRegistry } from "../block-registry";
import { BLOCK_FIELDS, THUMB_KINDS, type Field } from "../block-fields";

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);

function checkFields(where: string, fields: Field[], data: Record<string, unknown>, strict: boolean, problems: string[]) {
  const keys = new Set(fields.map((f) => f.key));
  if (strict) {
    for (const k of Object.keys(data)) if (!keys.has(k)) problems.push(`${where}: key "${k}" has no field`);
  }
  for (const f of fields) {
    if (f.type === "hidden") continue;
    if (!f.label) problems.push(`${where}.${f.key}: missing label`);
    if (f.label && (!f.label.en || !f.label.bn)) problems.push(`${where}.${f.key}: label needs en and bn`);
    const v = data[f.key];
    if (f.type === "select" || f.type === "align") {
      if (!f.options?.length) problems.push(`${where}.${f.key}: select without options`);
      else {
        for (const o of f.options) if (!o.label?.en || !o.label?.bn) problems.push(`${where}.${f.key}: option "${o.value}" needs en and bn`);
        if (typeof v === "string" || typeof v === "number") {
          if (!f.options.some((o) => o.value === String(v))) problems.push(`${where}.${f.key}: default "${v}" is not an option`);
        }
      }
    }
    if (f.showWhen && "field" in f.showWhen && !keys.has(f.showWhen.field)) problems.push(`${where}.${f.key}: showWhen refers to unknown "${f.showWhen.field}"`);
    if (f.type === "list") {
      if (!f.item?.length) problems.push(`${where}.${f.key}: list without item fields`);
      const sample = Array.isArray(v) && isObj(v[0]) ? v[0] : isObj(f.itemDefaults) && Object.keys(f.itemDefaults).length ? f.itemDefaults : null;
      if (f.item && sample) checkFields(`${where}.${f.key}[]`, f.item, sample, strict, problems);
      if (f.item && f.itemDefaults) {
        const itemKeys = new Set(f.item.map((x) => x.key));
        for (const k of Object.keys(f.itemDefaults)) if (!itemKeys.has(k)) problems.push(`${where}.${f.key}: itemDefaults key "${k}" has no item field`);
      }
    }
    if (f.type === "group" && f.item && isObj(v)) checkFields(`${where}.${f.key}`, f.item, v, strict, problems);
  }
}

test("every registry block has a field schema with a valid thumb", () => {
  const problems: string[] = [];
  for (const def of blockRegistry) {
    const schema = BLOCK_FIELDS[def.type];
    if (!schema) { problems.push(`${def.type}: no BLOCK_FIELDS entry`); continue; }
    if (schema.type !== def.type) problems.push(`${def.type}: schema.type is "${schema.type}"`);
    if (!(THUMB_KINDS as readonly string[]).includes(schema.thumb)) problems.push(`${def.type}: unknown thumb "${schema.thumb}"`);
  }
  assert.deepEqual(problems, []);
});

test("every default data key is covered (non-custom blocks) and options/labels are complete", () => {
  const problems: string[] = [];
  for (const def of blockRegistry) {
    const schema = BLOCK_FIELDS[def.type];
    if (!schema) continue;
    const data = (def.create() as { data: Record<string, unknown> }).data ?? {};
    checkFields(def.type, schema.fields, data, !schema.custom, problems);
  }
  assert.deepEqual(problems, []);
});

test("schema keys are unique per level", () => {
  const problems: string[] = [];
  const walk = (where: string, fields: Field[]) => {
    const seen = new Set<string>();
    for (const f of fields) {
      if (seen.has(f.key)) problems.push(`${where}: duplicate key "${f.key}"`);
      seen.add(f.key);
      if (f.item) walk(`${where}.${f.key}`, f.item);
    }
  };
  for (const s of Object.values(BLOCK_FIELDS)) walk(s.type, s.fields);
  assert.deepEqual(problems, []);
});
