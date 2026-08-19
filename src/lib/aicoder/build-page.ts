import type { Block } from "@/types/cms";
import type { BusinessFacts } from "./brief";
import type { PageSection } from "./plan";
import { generateBlockContent, AiCoderError } from "./generate";
import { mergeContentIntoBlock, resolveBlockImages } from "./merge";
import { reserveGeneration, refundGeneration, AiCoderQuotaError } from "./quota";

/**
 * Runs a planned page: one generation per section, assembled into an ordered
 * block list.
 *
 * Partial success is a first-class outcome. A fourteen-section page where one
 * section's output fails schema validation should still hand back the other
 * thirteen — losing the whole page (and the quota spent on it) because one
 * FAQ came back malformed would be the worst possible failure mode. Failed
 * sections are reported individually so the UI can offer a per-section retry.
 */

export interface BuiltSection {
  index: number;
  blockType: string;
  brief: string;
  variantKey?: string;
  block?: Block;
  error?: string;
}

export interface BuildPageResult {
  blocks: Block[];
  sections: BuiltSection[];
  generationsUsed: number;
  failedCount: number;
  /** True when at least one image is a neutral placeholder rather than a photo
   *  matching the section's subject — surfaced so the owner knows to swap it. */
  usedPlaceholderImages: boolean;
}

export async function buildPageFromPlan(
  sections: PageSection[],
  facts: BusinessFacts,
  tenantId: string,
  userId: string | null,
): Promise<BuildPageResult> {
  const results: BuiltSection[] = [];
  let generationsUsed = 0;
  // Tracks whether any image came back as a neutral stand-in rather than a
  // real subject match, so the UI can tell the owner which photos to replace.
  let anyPlaceholders = false;

  // Sequential rather than parallel: the quota reservation is a conditional
  // UPDATE against a known current value, so concurrent reservations for the
  // same tenant would collide and spuriously fail. A dozen sequential calls is
  // slow but correct, and the UI streams progress rather than blocking silently.
  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];

    let source: "quota" | "purchased";
    try {
      source = await reserveGeneration(tenantId, section.blockType, userId);
    } catch (err) {
      // Quota exhausted mid-run — stop cleanly and return what was built. Every
      // remaining section is marked so the user sees why the page is short.
      const message = err instanceof AiCoderQuotaError ? err.message : "Quota check failed";
      for (let j = i; j < sections.length; j++) {
        results.push({
          index: j,
          blockType: sections[j].blockType,
          brief: sections[j].brief,
          variantKey: sections[j].variantKey,
          error: message,
        });
      }
      break;
    }

    generationsUsed++;

    try {
      const content = await generateBlockContent(
        section.blockType,
        "",
        section.brief,
        facts,
      );
      const block = mergeContentIntoBlock(section.blockType, content, section.variantKey);
      const { usedPlaceholders } = await resolveBlockImages(block, content);
      if (usedPlaceholders) anyPlaceholders = true;
      results.push({
        index: i,
        blockType: section.blockType,
        brief: section.brief,
        variantKey: section.variantKey,
        block,
      });
    } catch (err) {
      // The tenant paid for a generation they didn't receive — give it back.
      await refundGeneration(tenantId, source).catch(() => {});
      generationsUsed--;
      results.push({
        index: i,
        blockType: section.blockType,
        brief: section.brief,
        variantKey: section.variantKey,
        error: err instanceof AiCoderError ? err.message : "This section couldn't be generated.",
      });
    }
  }

  const blocks = results
    .filter((r): r is BuiltSection & { block: Block } => !!r.block)
    .map((r, order) => ({ ...r.block, order }));

  return {
    blocks,
    sections: results,
    generationsUsed,
    failedCount: results.filter(r => r.error).length,
    usedPlaceholderImages: anyPlaceholders,
  };
}
