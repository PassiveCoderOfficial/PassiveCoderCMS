import { applySectionRhythm } from "./rhythm";
import type { Block } from "@/types/cms";
import type { BusinessFacts } from "./brief";
import type { PageSection } from "./plan";
import { generateBlockContent, AiCoderError } from "./generate";
import { mergeContentIntoBlock, resolveBlockImages } from "./merge";
import { reserveCredits, refundCredits, AiCreditsError, type CreditReservation } from "@/lib/ai/credits";

/**
 * Runs a planned page: one section's credits each (reserved sequentially,
 * generated with a small parallel pool), assembled into an ordered block list.
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
  /** The run stopped early: no credits left for the remaining sections. */
  outOfCredits: boolean;
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
  let outOfCredits = false;

  // 1) Reserve quota sequentially. The reservation is a conditional UPDATE
  //    against a known current value, so concurrent reservations for the same
  //    tenant would collide — but each one is a fast DB round-trip.
  const reserved: { i: number; reservation: CreditReservation }[] = [];
  for (let i = 0; i < sections.length; i++) {
    try {
      reserved.push({ i, reservation: await reserveCredits(tenantId, "section", { userId, detail: sections[i].blockType }) });
      generationsUsed++;
    } catch (err) {
      // Quota exhausted mid-run — build what was reserved. Every remaining
      // section is marked so the user sees why the page is short.
      const message = err instanceof AiCreditsError ? err.message : "Credit check failed";
      outOfCredits = err instanceof AiCreditsError && err.code === "no_credits";
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
  }

  // 2) Generate in parallel with a small pool. Each section is ~30-40 s of
  //    model time; one-at-a-time put a normal 10-section page past the
  //    function's 300 s limit, so the whole build failed.
  const CONCURRENCY = 4;
  const toRefund: CreditReservation[] = [];
  let next = 0;
  async function worker() {
    while (next < reserved.length) {
      const { i, reservation } = reserved[next++];
      const section = sections[i];
      try {
        const content = await generateBlockContent(section.blockType, "", section.brief, facts);
        const block = mergeContentIntoBlock(section.blockType, content, section.variantKey);
        const { usedPlaceholders } = await resolveBlockImages(block, content);
        if (usedPlaceholders) anyPlaceholders = true;
        results.push({ index: i, blockType: section.blockType, brief: section.brief, variantKey: section.variantKey, block });
      } catch (err) {
        // The tenant paid for a section they didn't receive — give it back
        // (after the pool finishes: refunds are read-modify-write, so they
        // must not run concurrently).
        toRefund.push(reservation);
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
  }
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, reserved.length) }, worker));
  for (const reservation of toRefund) await refundCredits(reservation).catch(() => {});
  // Workers finish out of order; the page must keep the planned order.
  results.sort((x, y) => x.index - y.index);

  const blocks = applySectionRhythm(
    results
      .filter((r): r is BuiltSection & { block: Block } => !!r.block)
      .map((r) => r.block),
  ).map((b, order) => ({ ...b, order }));

  return {
    blocks,
    sections: results,
    generationsUsed,
    failedCount: results.filter(r => r.error).length,
    outOfCredits,
    usedPlaceholderImages: anyPlaceholders,
  };
}
