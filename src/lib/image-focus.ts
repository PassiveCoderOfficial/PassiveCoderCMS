/**
 * Image focus (focal point) for any image cropped with object-fit: cover or
 * a background-size: cover background. One shape, one helper, used by every
 * block, the block background, the site-wide default and the connector.
 *
 * Unset everywhere = current behaviour (centre crop), so existing sites
 * never change until someone picks a focus.
 */
export const FOCUS_PRESETS = [
  "top-left", "top", "top-right",
  "left", "center", "right",
  "bottom-left", "bottom", "bottom-right",
] as const;

export type FocusPreset = (typeof FOCUS_PRESETS)[number];

export type ImageFocus = {
  focus: FocusPreset | "custom";
  /** Custom only: 0-100, % from the left. */
  x?: number;
  /** Custom only: 0-100, % from the top. */
  y?: number;
};

const PRESET_XY: Record<FocusPreset, [number, number]> = {
  "top-left": [0, 0], top: [50, 0], "top-right": [100, 0],
  left: [0, 50], center: [50, 50], right: [100, 50],
  "bottom-left": [0, 100], bottom: [50, 100], "bottom-right": [100, 100],
};

const clamp = (n: unknown) => {
  const v = typeof n === "number" ? n : parseFloat(String(n));
  return Number.isFinite(v) ? Math.min(100, Math.max(0, Math.round(v * 10) / 10)) : 50;
};

/** Accepts the object shape, or a bare preset string (site default, connector shorthand). */
export function normalizeFocus(f: unknown): ImageFocus | undefined {
  if (!f) return undefined;
  if (typeof f === "string") return (FOCUS_PRESETS as readonly string[]).includes(f) ? { focus: f as FocusPreset } : undefined;
  if (typeof f !== "object") return undefined;
  const o = f as Record<string, unknown>;
  if (o.focus === "custom") return { focus: "custom", x: clamp(o.x), y: clamp(o.y) };
  if (typeof o.focus === "string" && (FOCUS_PRESETS as readonly string[]).includes(o.focus)) return { focus: o.focus as FocusPreset };
  return undefined;
}

/** Focus point as x/y percentages (for the editor's marker). */
export function focusXY(f: unknown): [number, number] {
  const n = normalizeFocus(f);
  if (!n) return [50, 50];
  if (n.focus === "custom") return [n.x ?? 50, n.y ?? 50];
  return PRESET_XY[n.focus];
}

/** CSS value for object-position / background-position, or undefined when unset. */
export function focusToCss(f: unknown): string | undefined {
  const n = normalizeFocus(f);
  if (!n) return undefined;
  const [x, y] = focusXY(n);
  return `${x}% ${y}%`;
}

/** Inline style for an <img class="object-cover">; undefined when unset. */
export function focusStyle(f: unknown): React.CSSProperties | undefined {
  const css = focusToCss(f);
  return css ? { objectPosition: css } : undefined;
}
