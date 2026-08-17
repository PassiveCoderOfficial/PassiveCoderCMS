import { blockRegistry } from "@/modules/page-builder/block-registry";
import { generateId } from "@/lib/utils";
import type { Block } from "@/types/cms";
import type {
  SupportedBlockType, HeroContent, TextContent, ServicesContent,
  CtaContent, TestimonialsContent, FaqContent, FeaturesContent,
} from "./schemas";

/**
 * Merges AI-generated CONTENT into a real block-registry default. Every
 * layout/style/spacing field comes from the registry's create() — the model
 * never touches those, so it cannot emit a malformed BlockBase. Only the
 * fields explicitly assigned below come from AI output.
 */
export function mergeContentIntoBlock(type: SupportedBlockType, content: unknown): Block {
  const def = blockRegistry.find(b => b.type === type);
  if (!def) throw new Error(`No block-registry entry for type "${type}"`);
  const block = def.create();

  switch (type) {
    case "hero": {
      const c = content as HeroContent;
      const b = block as Extract<Block, { type: "hero" }>;
      b.data.title = c.title;
      if (c.subtitle) b.data.subtitle = c.subtitle;
      if (c.description) b.data.description = c.description;
      if (c.primaryButtonLabel && b.data.primaryButton) b.data.primaryButton.label = c.primaryButtonLabel;
      if (c.secondaryButtonLabel && b.data.secondaryButton) b.data.secondaryButton.label = c.secondaryButtonLabel;
      return b;
    }
    case "text": {
      const c = content as TextContent;
      const b = block as Extract<Block, { type: "text" }>;
      // Model only ever supplies plain paragraph strings, never HTML — this
      // is the one place AiCoder output becomes markup, and it's a fixed,
      // safe wrapper the model has no ability to influence or escape.
      b.data.content = c.paragraphs.map(p => `<p>${escapeHtml(p)}</p>`).join("");
      return b;
    }
    case "services": {
      const c = content as ServicesContent;
      const b = block as Extract<Block, { type: "services" }>;
      if (c.title) b.data.title = c.title;
      if (c.subtitle) b.data.subtitle = c.subtitle;
      b.data.items = c.items.map((item, i) => ({
        id: generateId(),
        icon: b.data.items[i % b.data.items.length]?.icon ?? "Star",
        iconType: "lucide" as const,
        title: item.title,
        description: item.description,
      }));
      return b;
    }
    case "cta": {
      const c = content as CtaContent;
      const b = block as Extract<Block, { type: "cta" }>;
      b.data.title = c.title;
      if (c.description) b.data.description = c.description;
      if (c.primaryButtonLabel && b.data.primaryButton) b.data.primaryButton.label = c.primaryButtonLabel;
      return b;
    }
    case "testimonials": {
      const c = content as TestimonialsContent;
      const b = block as Extract<Block, { type: "testimonials" }>;
      if (c.title) b.data.title = c.title;
      b.data.items = c.items.map(item => ({
        id: generateId(),
        name: item.name,
        role: item.role,
        content: item.content,
        rating: 5,
      }));
      return b;
    }
    case "faq": {
      const c = content as FaqContent;
      const b = block as Extract<Block, { type: "faq" }>;
      if (c.title) b.data.title = c.title;
      if (c.subtitle) b.data.subtitle = c.subtitle;
      b.data.items = c.items.map(item => ({
        id: generateId(),
        question: item.question,
        answer: item.answer,
      }));
      return b;
    }
    case "features": {
      const c = content as FeaturesContent;
      const b = block as Extract<Block, { type: "features" }>;
      if (c.title) b.data.title = c.title;
      if (c.subtitle) b.data.subtitle = c.subtitle;
      b.data.items = c.items.map((item, i) => ({
        id: generateId(),
        icon: b.data.items[i % b.data.items.length]?.icon ?? "Star",
        title: item.title,
        description: item.description,
      }));
      return b;
    }
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
