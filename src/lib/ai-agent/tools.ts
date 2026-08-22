import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { isSupportedBlockType } from "@/lib/aicoder/schemas";
import { generateBlockContent, AiCoderError } from "@/lib/aicoder/generate";
import { mergeContentIntoBlock, resolveBlockImages } from "@/lib/aicoder/merge";
import { reserveGeneration, refundGeneration, AiCoderQuotaError } from "@/lib/aicoder/quota";
import type { Block } from "@/types/cms";

export type AgentToolContext = {
  tenantId: string;
  userId: string;
  /** Admin (service-role) client — every tool query is manually tenant-scoped
   *  by the tool itself, mirroring the rest of the codebase's admin-client +
   *  explicit `.eq("tenant_id", …)` pattern rather than relying on RLS here. */
  supabase: SupabaseClient;
};

export type AgentToolContextKind = "general" | "editor";

export interface AgentTool {
  name: string;
  description: string;
  argsSchema: z.ZodTypeAny;
  readOnly: boolean;
  contexts: AgentToolContextKind[];
  run: (args: unknown, ctx: AgentToolContext) => Promise<unknown>;
}

/** Renders a short, human-readable description of a pending write action for
 *  the confirm/cancel UI — kept here (next to the tool that produced the
 *  args) so the two never drift apart. */
function describe(tool: string, args: Record<string, unknown>): string {
  switch (tool) {
    case "update_page_meta":
      return `Update page metadata (${Object.keys(args).filter(k => k !== "pageId").join(", ") || "no fields"})`;
    case "add_lead_note":
      return `Add a note to a lead: "${String(args.body ?? "").slice(0, 120)}"`;
    case "change_lead_stage":
      return args.stageId ? "Change this lead's stage" : "Clear this lead's stage";
    case "generate_page_content":
      return `Generate "${args.blockType}" content for this page and add it as a new section`;
    default:
      return `Run ${tool}`;
  }
}

export const AGENT_TOOLS: AgentTool[] = [
  {
    name: "get_tenant_settings",
    description: "Get the caller's site/tenant settings: name, plan, status. No args.",
    argsSchema: z.object({}),
    readOnly: true,
    contexts: ["general", "editor"],
    run: async (_args, ctx) => {
      const { data, error } = await ctx.supabase
        .from("tenants")
        .select("name, plan, status")
        .eq("id", ctx.tenantId)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data ?? null;
    },
  },
  {
    name: "list_pages",
    description: "List this site's pages: id, title, slug, status, order_index. No args.",
    argsSchema: z.object({}),
    readOnly: true,
    contexts: ["general", "editor"],
    run: async (_args, ctx) => {
      const { data, error } = await ctx.supabase
        .from("pages")
        .select("id, title, slug, status, order_index")
        .eq("tenant_id", ctx.tenantId)
        .order("order_index", { ascending: true });
      if (error) throw new Error(error.message);
      return data ?? [];
    },
  },
  {
    name: "get_page",
    description: "Get the full row for one page by id (must belong to this site). Args: { pageId: string }.",
    argsSchema: z.object({ pageId: z.string().uuid() }),
    readOnly: true,
    contexts: ["editor"],
    run: async (args, ctx) => {
      const { pageId } = args as { pageId: string };
      const { data, error } = await ctx.supabase
        .from("pages")
        .select("*")
        .eq("id", pageId)
        .eq("tenant_id", ctx.tenantId)
        .maybeSingle();
      if (error) throw new Error(error.message);
      if (!data) throw new Error("Page not found on this site.");
      return data;
    },
  },
  {
    name: "update_page_meta",
    description:
      "Propose updating a page's metadata. Args: { pageId: string, title?: string, status?: 'draft'|'published'|'scheduled'|'archived', excerpt?: string, seoTitle?: string, seoDescription?: string }. Requires confirmation before it takes effect.",
    argsSchema: z.object({
      pageId: z.string().uuid(),
      title: z.string().min(1).optional(),
      status: z.enum(["draft", "published", "scheduled", "archived"]).optional(),
      excerpt: z.string().optional(),
      seoTitle: z.string().optional(),
      seoDescription: z.string().optional(),
    }),
    readOnly: false,
    contexts: ["editor"],
    run: async (args, ctx) => {
      const { pageId, title, status, excerpt, seoTitle, seoDescription } = args as {
        pageId: string; title?: string; status?: string; excerpt?: string; seoTitle?: string; seoDescription?: string;
      };

      const { data: page, error: fetchError } = await ctx.supabase
        .from("pages")
        .select("id, seo, published_at")
        .eq("id", pageId)
        .eq("tenant_id", ctx.tenantId)
        .maybeSingle();
      if (fetchError) throw new Error(fetchError.message);
      if (!page) throw new Error("Page not found on this site.");

      const patch: Record<string, unknown> = {};
      if (title !== undefined) patch.title = title;
      if (status !== undefined) {
        patch.status = status;
        if (status === "published" && !page.published_at) patch.published_at = new Date().toISOString();
      }
      if (excerpt !== undefined) patch.excerpt = excerpt;
      if (seoTitle !== undefined || seoDescription !== undefined) {
        const seo = (page.seo ?? {}) as Record<string, unknown>;
        patch.seo = {
          ...seo,
          ...(seoTitle !== undefined ? { title: seoTitle } : {}),
          ...(seoDescription !== undefined ? { description: seoDescription } : {}),
        };
      }

      const { data, error } = await ctx.supabase
        .from("pages")
        .update(patch)
        .eq("id", pageId)
        .eq("tenant_id", ctx.tenantId)
        .select("id, title, slug, status, excerpt, seo")
        .single();
      if (error) throw new Error(error.message);
      return data;
    },
  },
  {
    name: "get_domain_status",
    description: "Get this site's custom domain and its connection status. No args.",
    argsSchema: z.object({}),
    readOnly: true,
    contexts: ["general", "editor"],
    run: async (_args, ctx) => {
      const { data, error } = await ctx.supabase
        .from("tenants")
        .select("custom_domain, domain_status")
        .eq("id", ctx.tenantId)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data ?? null;
    },
  },
  {
    name: "list_leads",
    description: "List up to 20 most recently active leads/contacts. No args.",
    argsSchema: z.object({}),
    readOnly: true,
    contexts: ["general"],
    run: async (_args, ctx) => {
      const { data, error } = await ctx.supabase
        .from("contacts")
        .select("id, first_name, last_name, email, phone, company, stage_id, last_activity_at")
        .eq("tenant_id", ctx.tenantId)
        .order("last_activity_at", { ascending: false })
        .limit(20);
      if (error) throw new Error(error.message);
      return data ?? [];
    },
  },
  {
    name: "get_lead",
    description: "Get a lead/contact's full details plus its 10 most recent activity events. Args: { contactId: string }.",
    argsSchema: z.object({ contactId: z.string().uuid() }),
    readOnly: true,
    contexts: ["general"],
    run: async (args, ctx) => {
      const { contactId } = args as { contactId: string };
      const [{ data: contact, error: contactError }, { data: events, error: eventsError }] = await Promise.all([
        ctx.supabase.from("contacts").select("*, crm_stages(id, name, color)")
          .eq("id", contactId).eq("tenant_id", ctx.tenantId).maybeSingle(),
        ctx.supabase.from("contact_events").select("*")
          .eq("contact_id", contactId).eq("tenant_id", ctx.tenantId)
          .order("created_at", { ascending: false }).limit(10),
      ]);
      if (contactError) throw new Error(contactError.message);
      if (eventsError) throw new Error(eventsError.message);
      if (!contact) throw new Error("Lead not found on this site.");
      return { contact, events: events ?? [] };
    },
  },
  {
    name: "add_lead_note",
    description: "Propose adding a note to a lead/contact's timeline. Args: { contactId: string, body: string }. Requires confirmation.",
    argsSchema: z.object({ contactId: z.string().uuid(), body: z.string().min(1) }),
    readOnly: false,
    contexts: ["general"],
    run: async (args, ctx) => {
      const { contactId, body } = args as { contactId: string; body: string };

      const { data: contact, error: contactError } = await ctx.supabase
        .from("contacts").select("id").eq("id", contactId).eq("tenant_id", ctx.tenantId).maybeSingle();
      if (contactError) throw new Error(contactError.message);
      if (!contact) throw new Error("Lead not found on this site.");

      const { data, error } = await ctx.supabase
        .from("contact_events")
        .insert({
          tenant_id: ctx.tenantId,
          contact_id: contactId,
          type: "note",
          title: "Note",
          body,
          actor_user_id: ctx.userId,
        })
        .select("*")
        .single();
      if (error) throw new Error(error.message);
      return data;
    },
  },
  {
    name: "change_lead_stage",
    description: "Propose changing a lead/contact's CRM stage. Args: { contactId: string, stageId: string | null }. Requires confirmation.",
    argsSchema: z.object({ contactId: z.string().uuid(), stageId: z.string().uuid().nullable() }),
    readOnly: false,
    contexts: ["general"],
    run: async (args, ctx) => {
      const { contactId, stageId } = args as { contactId: string; stageId: string | null };

      const { data: prev, error: prevError } = await ctx.supabase
        .from("contacts")
        .select("stage_id, crm_stages(name)")
        .eq("id", contactId).eq("tenant_id", ctx.tenantId).maybeSingle();
      if (prevError) throw new Error(prevError.message);
      if (!prev) throw new Error("Lead not found on this site.");

      if (prev.stage_id !== stageId) {
        const { data: newStage } = stageId
          ? await ctx.supabase.from("crm_stages").select("name").eq("id", stageId).maybeSingle()
          : { data: null };
        await ctx.supabase.from("contact_events").insert({
          tenant_id: ctx.tenantId,
          contact_id: contactId,
          type: "stage_change",
          title: `Stage → ${newStage?.name ?? "None"}`,
          meta: { from_stage: prev.stage_id, to_stage: stageId },
          actor_user_id: ctx.userId,
        });
      }

      const { data, error } = await ctx.supabase
        .from("contacts")
        .update({ stage_id: stageId, updated_at: new Date().toISOString() })
        .eq("id", contactId).eq("tenant_id", ctx.tenantId)
        .select("*, crm_stages(id, name, color)")
        .single();
      if (error) throw new Error(error.message);
      return data;
    },
  },
  {
    name: "generate_page_content",
    description:
      "Propose generating AI copy for a new page section and adding it to the page. Args: { pageId: string, blockType: string, instructions: string }. Counts against the site's AiCoder generation quota. Requires confirmation.",
    argsSchema: z.object({
      pageId: z.string().uuid(),
      blockType: z.string().min(1),
      instructions: z.string().min(1),
    }),
    readOnly: false,
    contexts: ["editor"],
    run: async (args, ctx) => {
      const { pageId, blockType, instructions } = args as { pageId: string; blockType: string; instructions: string };
      if (!isSupportedBlockType(blockType)) {
        throw new Error(`Unsupported block type for AiCoder: ${blockType}`);
      }

      const { data: page, error: pageError } = await ctx.supabase
        .from("pages")
        .select("id, blocks")
        .eq("id", pageId)
        .eq("tenant_id", ctx.tenantId)
        .maybeSingle();
      if (pageError) throw new Error(pageError.message);
      if (!page) throw new Error("Page not found on this site.");

      const { data: settings } = await ctx.supabase
        .from("site_settings")
        .select("site_name, site_description")
        .eq("tenant_id", ctx.tenantId)
        .maybeSingle();
      const businessContext = [settings?.site_name, settings?.site_description].filter(Boolean).join(" — ");

      let quotaSource: "quota" | "purchased";
      try {
        quotaSource = await reserveGeneration(ctx.tenantId, blockType, ctx.userId);
      } catch (err) {
        throw new Error(err instanceof AiCoderQuotaError ? err.message : "Failed to check AiCoder usage");
      }

      try {
        const content = await generateBlockContent(blockType, businessContext, instructions);
        const block = mergeContentIntoBlock(blockType, content);
        await resolveBlockImages(block, content);

        const existingBlocks = Array.isArray(page.blocks) ? (page.blocks as Block[]) : [];
        const newBlock = { ...block, order: existingBlocks.length };
        const nextBlocks = [...existingBlocks, newBlock];

        const { error: updateError } = await ctx.supabase
          .from("pages")
          .update({ blocks: nextBlocks, updated_at: new Date().toISOString() })
          .eq("id", pageId)
          .eq("tenant_id", ctx.tenantId);
        if (updateError) throw new Error(updateError.message);

        return { block: newBlock };
      } catch (err) {
        await refundGeneration(ctx.tenantId, quotaSource).catch(() => {});
        if (err instanceof AiCoderError) throw new Error(err.message);
        throw err;
      }
    },
  },
];

export function toolsForContext(context: AgentToolContextKind): AgentTool[] {
  return AGENT_TOOLS.filter(t => t.contexts.includes(context));
}

export function findTool(name: string): AgentTool | undefined {
  return AGENT_TOOLS.find(t => t.name === name);
}

export function describePendingAction(toolName: string, args: Record<string, unknown>): string {
  return describe(toolName, args);
}
