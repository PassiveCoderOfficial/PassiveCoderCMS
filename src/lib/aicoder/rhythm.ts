import type { Block } from "@/types/cms";

/**
 * Visual rhythm for an AI-built page.
 *
 * Generated sections all came out on the same plain ground with the same
 * default padding, so a whole page read as one long white sheet — the
 * "not design rich" complaint in its purest form. This pass alternates a
 * soft brand tint behind every other content section and sets generous
 * desktop / tighter phone spacing, the way a designer would lay the page out.
 *
 * Only touches what the model didn't decide: a section that already has a
 * background, or uses a dark variant (which paints its own ground), keeps it.
 * Chrome (nav/footer/header parts) and spacers/dividers are left alone.
 */
const SKIP = new Set(["navigation", "footer", "spacer", "divider", "header_logo", "header_nav", "header_cta", "header_booking", "header_cart", "header_account", "custom_html"]);
const TINT = "linear-gradient(180deg, hsl(var(--primary) / 0.06) 0%, hsl(var(--primary) / 0.03) 100%)";

function paintsOwnGround(b: Block): boolean {
  const variant = b.templateVariant ?? String((b as { data?: Record<string, unknown> }).data?.layout ?? "");
  return /dark|fullscreen|gradient|banner|cinematic|navy|colored/.test(variant) || b.type === "hero" || b.type === "slider" || b.type === "cta";
}

export function applySectionRhythm(blocks: Block[]): Block[] {
  let n = 0;
  return blocks.map((b) => {
    if (SKIP.has(b.type)) return b;
    const out: Block = { ...b };
    const hasBg = b.background && b.background.type !== "none";

    if (!paintsOwnGround(b)) {
      out.padding = { ...b.padding, top: 88, bottom: 88 };
      out.style = { ...(b.style ?? {}), paddingTablet: { top: 72, bottom: 72 }, paddingMobile: { top: 56, bottom: 56 } };
      if (!hasBg && n % 2 === 1) out.background = { type: "gradient", gradient: TINT };
      n++;
    }
    return out;
  });
}
