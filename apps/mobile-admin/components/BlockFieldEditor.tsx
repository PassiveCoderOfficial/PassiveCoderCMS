// Generic runtime introspection editor for a block's `data: Record<string,
// unknown>` object. Renders appropriate inputs for whatever keys/value types
// are actually present — this is the ONE editor that covers all ~50 web
// block types without bespoke per-type forms (see block-registry.ts on web
// for the full type list this intentionally does not special-case).
//
// Supported shapes:
//   string  -> Field + TextField (multiline if long/newline-containing or
//              the key name suggests prose)
//   number  -> Field + TextField keyboardType="numeric"
//   boolean -> Field + Switch
//   array of primitives -> repeatable TextField list w/ remove + add
//   array of objects     -> repeatable Card list, each recursed into this
//                           same editor, w/ remove + add
//   object (non-array)   -> collapsible sub-section recursed into this
//                           same editor
//   null/undefined       -> skipped (not rendered)

import React, { useState } from "react";
import { Pressable, StyleSheet, Switch, Text, View } from "react-native";
import { Button, Field, TextField } from "./form";
import { Card } from "./ui";
import { colors, radius } from "../lib/theme";

const MULTILINE_KEY_HINTS = ["description", "content", "body", "bio", "answer", "message", "html", "summary"];

function isMultilineField(key: string, value: string): boolean {
  if (value.includes("\n")) return true;
  if (value.length > 60) return true;
  const lower = key.toLowerCase();
  return MULTILINE_KEY_HINTS.some((hint) => lower.includes(hint));
}

function humanizeKey(key: string): string {
  const spaced = key.replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/_/g, " ");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Builds a blank clone of an object's shape (keys kept, primitive values
 * emptied, nested objects/arrays reset) — used as the template for "Add
 * item" in an object-array that already has at least one item. */
function blankClone(sample: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(sample)) {
    if (typeof v === "string") out[k] = "";
    else if (typeof v === "number") out[k] = 0;
    else if (typeof v === "boolean") out[k] = false;
    else if (Array.isArray(v)) out[k] = [];
    else if (isPlainObject(v)) out[k] = blankClone(v);
    else out[k] = v ?? "";
  }
  return out;
}

function randomId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export interface BlockFieldEditorProps {
  data: Record<string, unknown>;
  onChange: (next: Record<string, unknown>) => void;
}

export function BlockFieldEditor({ data, onChange }: BlockFieldEditorProps) {
  function setKey(key: string, value: unknown) {
    onChange({ ...data, [key]: value });
  }

  return (
    <View style={{ gap: 14 }}>
      {Object.entries(data).map(([key, value]) => (
        <FieldRow key={key} fieldKey={key} value={value} onChange={(v) => setKey(key, v)} />
      ))}
    </View>
  );
}

function FieldRow({ fieldKey, value, onChange }: {
  fieldKey: string;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  const label = humanizeKey(fieldKey);

  if (value === null || value === undefined) {
    // Skip rendering — no schema info to know what type this should be.
    return null;
  }

  if (typeof value === "string") {
    return (
      <Field label={label}>
        <TextField
          value={value}
          onChangeText={onChange}
          multiline={isMultilineField(fieldKey, value)}
          numberOfLines={isMultilineField(fieldKey, value) ? 4 : undefined}
        />
      </Field>
    );
  }

  if (typeof value === "number") {
    return (
      <Field label={label}>
        <TextField
          value={String(value)}
          onChangeText={(t) => {
            const n = Number(t);
            onChange(Number.isFinite(n) ? n : 0);
          }}
          keyboardType="numeric"
        />
      </Field>
    );
  }

  if (typeof value === "boolean") {
    return (
      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>{label}</Text>
        <Switch
          value={value}
          onValueChange={onChange}
          trackColor={{ true: colors.primary500, false: colors.border }}
        />
      </View>
    );
  }

  if (Array.isArray(value)) {
    return <ArrayFieldEditor label={label} items={value} onChange={onChange} />;
  }

  if (isPlainObject(value)) {
    return <ObjectFieldEditor label={label} value={value} onChange={onChange} />;
  }

  // Unsupported/unknown value shape (function, symbol, etc.) — skip.
  return null;
}

function ObjectFieldEditor({ label, value, onChange }: {
  label: string;
  value: Record<string, unknown>;
  onChange: (v: Record<string, unknown>) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <View style={{ gap: 10 }}>
      <Pressable style={styles.sectionHeader} onPress={() => setOpen((o) => !o)}>
        <Text style={styles.sectionChevron}>{open ? "▾" : "▸"}</Text>
        <Text style={styles.sectionTitle}>{label}</Text>
      </Pressable>
      {open && (
        <View style={styles.sectionBody}>
          <BlockFieldEditor data={value} onChange={onChange} />
        </View>
      )}
    </View>
  );
}

function ArrayFieldEditor({ label, items, onChange }: {
  label: string;
  items: unknown[];
  onChange: (v: unknown[]) => void;
}) {
  const objectItems = items.length > 0 && items.every((it) => isPlainObject(it));

  function removeAt(index: number) {
    const next = items.slice();
    next.splice(index, 1);
    onChange(next);
  }

  function updateAt(index: number, value: unknown) {
    const next = items.slice();
    next[index] = value;
    onChange(next);
  }

  function addPrimitive() {
    onChange([...items, ""]);
  }

  function addObject() {
    // Best-effort: clone the shape of the first item (blanked) if one
    // exists, else there's no schema to infer from and we add an empty
    // object — the generic editor will render nothing for it until the
    // user's data actually has keys (a known limitation, noted in the
    // task spec: we cannot know a brand-new item's shape without a schema).
    const sample = items.length > 0 && isPlainObject(items[0]) ? blankClone(items[0]) : {};
    onChange([...items, { id: randomId(), ...sample }]);
  }

  if (objectItems) {
    return (
      <View style={{ gap: 10 }}>
        <Text style={styles.sectionTitle}>{label}</Text>
        {items.map((item, index) => (
          <Card key={index} style={{ gap: 10 }}>
            <View style={styles.itemHeaderRow}>
              <Text style={styles.itemIndex}>#{index + 1}</Text>
              <Pressable onPress={() => removeAt(index)} hitSlop={8}>
                <Text style={styles.removeText}>Remove ✕</Text>
              </Pressable>
            </View>
            <BlockFieldEditor
              data={item as Record<string, unknown>}
              onChange={(v) => updateAt(index, v)}
            />
          </Card>
        ))}
        <Button title="Add item" variant="outline" onPress={addObject} />
      </View>
    );
  }

  // Array of primitives (strings/numbers) or empty array.
  return (
    <View style={{ gap: 8 }}>
      <Text style={styles.sectionTitle}>{label}</Text>
      {items.map((item, index) => (
        <View key={index} style={styles.primitiveRow}>
          <TextField
            style={{ flex: 1 }}
            value={String(item ?? "")}
            onChangeText={(t) => updateAt(index, typeof item === "number" ? Number(t) || 0 : t)}
          />
          <Pressable onPress={() => removeAt(index)} hitSlop={8} style={styles.removeBtn}>
            <Text style={styles.removeText}>✕</Text>
          </Pressable>
        </View>
      ))}
      <Button title="Add item" variant="outline" onPress={addPrimitive} />
    </View>
  );
}

const styles = StyleSheet.create({
  switchRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingVertical: 4,
  },
  switchLabel: { fontSize: 12, fontWeight: "600", color: colors.textMuted },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 6 },
  sectionChevron: { fontSize: 12, color: colors.textMuted },
  sectionTitle: { fontSize: 12, fontWeight: "700", color: colors.text },
  sectionBody: {
    borderLeftWidth: 2, borderLeftColor: colors.border,
    paddingLeft: 12, gap: 14,
  },
  itemHeaderRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  itemIndex: { fontSize: 11, fontWeight: "700", color: colors.textFaint },
  primitiveRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  removeBtn: {
    width: 32, height: 32, borderRadius: radius.md, alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: colors.borderStrong,
  },
  removeText: { fontSize: 12, fontWeight: "700", color: colors.red600 },
});
