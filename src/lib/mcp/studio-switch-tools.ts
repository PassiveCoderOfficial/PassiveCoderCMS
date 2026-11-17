import { z } from "zod";
import type { McpCtx, McpTool } from "@/lib/mcp/tools";
import { previewSwitch, prepareSwitch, publishSwitch, switchBack, type SwitchArea } from "@/modules/studio-switch/run";
import { noteText } from "@/modules/studio-switch/types";

/**
 * MCP: "Switch to Studio" (menus P5). Converts the site's classic header
 * and/or footer into Header / Footer Studio DRAFTS (the same converter as the
 * owner's button and the staff batch tool) and reports how faithful the
 * conversion is. Nothing goes live unless publish: true. Decision 2026-11-17:
 * nothing is ever switched automatically, so the AI only does this when the
 * user asks for it.
 *
 * Imports nothing that needs the Next.js runtime (tests/mcp run it against a
 * fake client).
 */
type Args = { action?: "preview" | "prepare" | "switch_back"; area?: "header" | "footer" | "both"; publish?: boolean; replace?: boolean };

function report(pv: Awaited<ReturnType<typeof previewSwitch>>, areas: SwitchArea[]) {
  const one = (area: SwitchArea) => {
    const a = pv[area];
    return {
      state: a.state,
      faithfulness: a.fidelity.level,
      contentDifferences: a.fidelity.diffs,
      otherDifferences: a.conversion.notes.filter((n) => n.level === "minor").map(noteText),
      cannotConvertBecause: a.conversion.notes.filter((n) => n.level === "unsupported").map(noteText),
      ...(area === "header" && pv.header.conversion.menu ? {
        menu: pv.header.conversion.menu?.kind === "saved" ? `saved menu ${pv.header.conversion.menu.menuId} (${pv.header.conversion.menu.why === "reads" ? "the header already reads it" : "same links"})`
          : pv.header.conversion.menu?.kind === "new" ? `a new saved menu "Main menu" with the header's ${pv.header.conversion.menu.items.length} top-level links (location none)`
            : "the site's default menu",
      } : {}),
      ...(area === "footer" && pv.footer.conversion.newMenus.length ? { newMenus: pv.footer.conversion.newMenus.map((m) => m.name) } : {}),
      ...(a.ownDraft ? { note: "A Studio draft that did not come from a switch exists; pass replace: true to overwrite it." } : {}),
    };
  };
  return Object.fromEntries(areas.map((a) => [a, one(a)]));
}

export const STUDIO_SWITCH_TOOLS: McpTool[] = [
  {
    name: "switch_to_studio",
    title: "Switch the classic header/footer to the Studio",
    description: "Converts the site's classic header (navigation block or container header row) and/or classic footer block into Header Studio / Footer Studio DRAFTS: logo, menu (as a saved menu by id: an existing one with the same links, else a new \"Main menu\" at location none), buttons, contact items, top bar text and colours, sticky/transparent, phone layout; footer columns, socials, copyright, legal links. Returns a faithfulness report per area (exact / minor / unsupported, content differences, other differences, or why it cannot convert). action: \"preview\" = report only, writes nothing; \"prepare\" (default) = save the drafts (the live site does not change); \"switch_back\" = back to the classic version (a live Studio is kept for later, a prepared draft is dropped). publish: true publishes the prepared drafts at once; only when the user asked for it. The classic header/footer data is never changed. Only do this when the user asks.",
    schema: z.object({
      action: z.enum(["preview", "prepare", "switch_back"]).optional(),
      area: z.enum(["header", "footer", "both"]).optional().describe("Default both."),
      publish: z.boolean().optional().describe("prepare only: publish the drafts now (the site shows them at once)."),
      replace: z.boolean().optional().describe("prepare only: overwrite a Studio draft the owner was already working on."),
    }),
    write: true,
    run: async (a: Args, ctx: McpCtx) => {
      const areas: SwitchArea[] = !a.area || a.area === "both" ? ["header", "footer"] : [a.area];
      const action = a.action ?? "prepare";
      if (action === "preview") {
        return { preview: true, written: false, ...report(await previewSwitch(ctx.supabase, ctx.tenantId), areas) };
      }
      if (action === "switch_back") {
        const out: Record<string, unknown> = {};
        for (const area of areas) {
          const r = await switchBack(ctx.supabase, ctx.tenantId, area);
          if (!r.ok) throw new Error(r.error ?? "Could not switch back");
          out[area] = r.result;
        }
        return { switchedBack: out, note: "classic = the site shows the classic version again (the Studio version is kept); discarded = the prepared draft was dropped; nothing = it was already classic." };
      }
      const before = await previewSwitch(ctx.supabase, ctx.tenantId);
      const res = await prepareSwitch(ctx.supabase, ctx.tenantId, { areas, via: "mcp", userId: ctx.userId, replace: a.replace === true });
      if (!res.ok) throw new Error(res.error ?? "Could not prepare the Studio drafts");
      let published: SwitchArea[] = [];
      if (a.publish) {
        const ready = areas.filter((x) => res[x]?.prepared);
        if (ready.length) {
          const p = await publishSwitch(ctx.supabase, ctx.tenantId, { areas: ready, userId: ctx.userId });
          if (!p.ok) throw new Error(p.error ?? "Could not publish");
          published = p.published;
        }
      }
      return {
        prepared: Object.fromEntries(areas.map((x) => [x, res[x]?.prepared ? true : res[x]?.reason ?? false])),
        published,
        live: published.length ? `The site now shows the Studio ${published.join(" and ")}.` : "Nothing is live yet: the drafts open in Header Builder > Studio / Footer Studio, or call again with publish: true when the user wants them live.",
        ...report(before, areas),
      };
    },
  },
];
