"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentTenantId } from "@/lib/tenant/current";
import type { AccessLevel, ContentStatus, Platform } from "@/lib/scheduler/types";

/** Every mutation here goes through the RLS-scoped client on purpose: the
 *  can_edit_content() policy is the authority on who may write, so a user with
 *  only a 'viewer' grant is rejected by the database rather than by a check we
 *  could forget to repeat in each action. */

const PATH = "/dashboard/scheduler";

async function currentUserId() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}

export type ContentItemInput = {
  id?: string;
  brand_id: string;
  title: string;
  hook?: string | null;
  body?: string | null;
  content_type: string;
  pillar?: string | null;
  status: ContentStatus;
  scheduled_at?: string | null;
  assignee_id?: string | null;
  cta?: string | null;
  tags?: string[];
  platforms: Platform[];
};

export async function saveContentItem(input: ContentItemInput) {
  const tenantId = await getCurrentTenantId();
  const supabase = await createClient();
  const userId = await currentUserId();

  const row = {
    tenant_id: tenantId,
    brand_id: input.brand_id,
    title: input.title,
    hook: input.hook ?? null,
    body: input.body ?? null,
    content_type: input.content_type,
    pillar: input.pillar || null,
    status: input.status,
    scheduled_at: input.scheduled_at || null,
    assignee_id: input.assignee_id || null,
    cta: input.cta ?? null,
    tags: input.tags ?? [],
  };

  let itemId = input.id;

  if (itemId) {
    const { error } = await supabase
      .from("content_items").update(row).eq("id", itemId).eq("tenant_id", tenantId);
    if (error) return { error: error.message };
  } else {
    const { data, error } = await supabase
      .from("content_items")
      .insert({ ...row, created_by: userId })
      .select("id")
      .single();
    if (error) return { error: error.message };
    itemId = data.id as string;
  }

  // Reconcile targets against the selected platforms. Existing rows are kept
  // (they carry published URLs and per-platform overrides that must survive an
  // unrelated edit); only genuinely removed platforms are deleted.
  const { data: existing } = await supabase
    .from("content_targets")
    .select("id, platform")
    .eq("content_item_id", itemId);

  const have = new Set((existing ?? []).map((t) => t.platform as Platform));
  const want = new Set(input.platforms);

  const toAdd = input.platforms.filter((p) => !have.has(p));
  const toRemove = (existing ?? []).filter((t) => !want.has(t.platform as Platform));

  if (toAdd.length) {
    // Link each target to the brand's channel for that platform when one
    // exists, so the row already points at the right account once API
    // publishing lands.
    const { data: channels } = await supabase
      .from("brand_channels")
      .select("id, platform")
      .eq("brand_id", input.brand_id);
    const channelByPlatform = new Map(
      (channels ?? []).map((c) => [c.platform as Platform, c.id as string]),
    );

    const { error } = await supabase.from("content_targets").insert(
      toAdd.map((platform) => ({
        tenant_id: tenantId,
        content_item_id: itemId,
        platform,
        channel_id: channelByPlatform.get(platform) ?? null,
        status: "scheduled",
      })),
    );
    if (error) return { error: error.message };
  }

  if (toRemove.length) {
    const { error } = await supabase
      .from("content_targets").delete().in("id", toRemove.map((t) => t.id));
    if (error) return { error: error.message };
  }

  await supabase.from("content_activity").insert({
    tenant_id: tenantId,
    content_item_id: itemId,
    user_id: userId,
    action: input.id ? "updated" : "created",
  });

  revalidatePath(PATH);
  return { ok: true, id: itemId };
}

export async function updateItemStatus(itemId: string, status: ContentStatus) {
  const tenantId = await getCurrentTenantId();
  const supabase = await createClient();

  const patch: Record<string, unknown> = { status };
  if (status === "published") patch.published_at = new Date().toISOString();

  const { error } = await supabase
    .from("content_items").update(patch).eq("id", itemId).eq("tenant_id", tenantId);
  if (error) return { error: error.message };

  // Marking the item published closes out every target still outstanding —
  // the common case is "I posted it everywhere", and leaving targets behind
  // would keep the item in Needs Attention forever.
  if (status === "published") {
    await supabase
      .from("content_targets")
      .update({ status: "published", published_at: new Date().toISOString() })
      .eq("content_item_id", itemId)
      .eq("status", "scheduled");
  }

  await supabase.from("content_activity").insert({
    tenant_id: tenantId,
    content_item_id: itemId,
    user_id: await currentUserId(),
    action: `status:${status}`,
  });

  revalidatePath(PATH);
  return { ok: true };
}

/** Calendar drag-and-drop and the "move to date" control. */
export async function rescheduleItem(itemId: string, scheduledAt: string | null) {
  const tenantId = await getCurrentTenantId();
  const supabase = await createClient();

  const patch: Record<string, unknown> = { scheduled_at: scheduledAt };
  const { error } = await supabase
    .from("content_items").update(patch).eq("id", itemId).eq("tenant_id", tenantId);
  if (error) return { error: error.message };

  revalidatePath(PATH);
  return { ok: true };
}

export async function markTargetPublished(targetId: string, url: string | null) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("content_targets")
    .update({
      status: "published",
      external_post_url: url,
      published_at: new Date().toISOString(),
    })
    .eq("id", targetId);
  if (error) return { error: error.message };

  revalidatePath(PATH);
  return { ok: true };
}

export async function deleteContentItem(itemId: string) {
  const tenantId = await getCurrentTenantId();
  const supabase = await createClient();
  const { error } = await supabase
    .from("content_items").delete().eq("id", itemId).eq("tenant_id", tenantId);
  if (error) return { error: error.message };
  revalidatePath(PATH);
  return { ok: true };
}

/** Cloning is the single biggest time-saver in daily use — most posts are a
 *  variation of one that already worked. */
export async function duplicateContentItem(itemId: string) {
  const tenantId = await getCurrentTenantId();
  const supabase = await createClient();

  const { data: src, error } = await supabase
    .from("content_items")
    .select("*, content_targets(platform, channel_id)")
    .eq("id", itemId)
    .single();
  if (error || !src) return { error: error?.message ?? "Not found" };

  const { data: copy, error: insErr } = await supabase
    .from("content_items")
    .insert({
      tenant_id: tenantId,
      brand_id: src.brand_id,
      title: `${src.title} (copy)`,
      hook: src.hook,
      body: src.body,
      content_type: src.content_type,
      pillar: src.pillar,
      status: "idea",
      scheduled_at: null,
      cta: src.cta,
      tags: src.tags,
      media: src.media,
      created_by: await currentUserId(),
    })
    .select("id")
    .single();
  if (insErr) return { error: insErr.message };

  const targets = (src.content_targets ?? []) as { platform: string; channel_id: string | null }[];
  if (targets.length) {
    await supabase.from("content_targets").insert(
      targets.map((t) => ({
        tenant_id: tenantId,
        content_item_id: copy.id,
        platform: t.platform,
        channel_id: t.channel_id,
        status: "scheduled",
      })),
    );
  }

  revalidatePath(PATH);
  return { ok: true, id: copy.id as string };
}

// ── Brands ───────────────────────────────────────────────────────────────────

export async function saveBrand(input: {
  id?: string;
  name: string;
  slug: string;
  kind: string;
  description?: string | null;
  color: string;
  timezone: string;
  platforms: Platform[];
}) {
  const tenantId = await getCurrentTenantId();
  const supabase = await createClient();

  const row = {
    tenant_id: tenantId,
    name: input.name,
    slug: input.slug,
    kind: input.kind,
    description: input.description ?? null,
    color: input.color,
    timezone: input.timezone,
  };

  let brandId = input.id;
  if (brandId) {
    const { error } = await supabase
      .from("brand_profiles").update(row).eq("id", brandId).eq("tenant_id", tenantId);
    if (error) return { error: error.message };
  } else {
    const { data, error } = await supabase
      .from("brand_profiles").insert(row).select("id").single();
    if (error) return { error: error.message };
    brandId = data.id as string;
  }

  const { data: existing } = await supabase
    .from("brand_channels").select("id, platform").eq("brand_id", brandId);
  const have = new Set((existing ?? []).map((c) => c.platform as Platform));
  const want = new Set(input.platforms);

  const toAdd = input.platforms.filter((p) => !have.has(p));
  if (toAdd.length) {
    await supabase.from("brand_channels").insert(
      toAdd.map((platform) => ({ tenant_id: tenantId, brand_id: brandId, platform })),
    );
  }
  const toRemove = (existing ?? []).filter((c) => !want.has(c.platform as Platform));
  if (toRemove.length) {
    await supabase.from("brand_channels").delete().in("id", toRemove.map((c) => c.id));
  }

  revalidatePath(PATH);
  revalidatePath(`${PATH}/brands`);
  return { ok: true, id: brandId };
}

export async function deleteBrand(brandId: string) {
  const tenantId = await getCurrentTenantId();
  const supabase = await createClient();
  const { error } = await supabase
    .from("brand_profiles").delete().eq("id", brandId).eq("tenant_id", tenantId);
  if (error) return { error: error.message };
  revalidatePath(`${PATH}/brands`);
  return { ok: true };
}

// ── Access ───────────────────────────────────────────────────────────────────

/** Realtime search box in the access UI. Backed by a SECURITY DEFINER RPC
 *  scoped to this tenant's members, so it can't enumerate platform users. */
export async function searchTenantUsers(q: string) {
  const tenantId = await getCurrentTenantId();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("search_tenant_users", { t: tenantId, q });
  if (error) return { error: error.message, results: [] };
  return {
    results: (data ?? []) as {
      user_id: string; full_name: string | null; email: string;
      role: string; has_access: boolean;
    }[],
  };
}

export async function grantAccess(userId: string, level: AccessLevel) {
  const tenantId = await getCurrentTenantId();
  const supabase = await createClient();
  const { error } = await supabase
    .from("content_module_grants")
    .upsert(
      {
        tenant_id: tenantId,
        user_id: userId,
        access_level: level,
        granted_by: await currentUserId(),
      },
      { onConflict: "tenant_id,user_id" },
    );
  if (error) return { error: error.message };
  revalidatePath(`${PATH}/access`);
  return { ok: true };
}

export async function revokeAccess(userId: string) {
  const tenantId = await getCurrentTenantId();
  const supabase = await createClient();
  const { error } = await supabase
    .from("content_module_grants")
    .delete()
    .eq("tenant_id", tenantId)
    .eq("user_id", userId);
  if (error) return { error: error.message };
  revalidatePath(`${PATH}/access`);
  return { ok: true };
}
