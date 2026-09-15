// Restaurant module gating — mirrors requireModule(tenantId, "pos") on the
// web (cms/src/lib/modules/resolve-modules.ts). The restaurant stack rides
// the "pos" module key (docs/business/04-pricing-and-packaging.md, Biz
// price cut) rather than a separate one — same reasoning as web: it's the
// same operational surface, not a separately-sellable feature.
//
// This is UI-gating only (hide the section for a tenant that shouldn't see
// it) — the real enforcement stays server-side (RLS + POS's own plan check
// on write). Two-part check, same as web's resolveEnabledModules(): the
// tenant's PLAN must include "pos" at all (a Pro tenant can't self-enable
// it), AND the tenant hasn't explicitly turned it off. A tenant-level
// override alone (enabled_modules.pos) is not enough on its own — that
// would let a client-side value claim access the plan never granted.

import { supabase } from "./supabase";
import type { Tenant } from "./types";

interface PlanModuleConfig {
  included?: boolean;
  defaultOn?: boolean;
}

/** Reads whether `planId`'s own config includes the "pos" module — the
 *  actual plan-level gate. Cached per plan id for the life of the app
 *  session; plans change rarely enough that a stale read for one session
 *  is an acceptable trade for not re-querying on every screen focus. */
const planPosCache = new Map<string, boolean>();

async function planIncludesPos(planId: string): Promise<boolean> {
  if (planPosCache.has(planId)) return planPosCache.get(planId)!;
  const { data } = await supabase.from("plans").select("modules").eq("id", planId).maybeSingle();
  const modules = (data?.modules ?? {}) as Record<string, PlanModuleConfig>;
  const included = !!modules.pos?.included;
  planPosCache.set(planId, included);
  return included;
}

/** Full check: plan includes "pos" AND the tenant hasn't overridden it off.
 *  Matches web's resolveEnabledModules() logic exactly (included ?? false,
 *  then tenant override if present, else the plan's own defaultOn). */
export async function hasRestaurantAccess(tenant: Pick<Tenant, "plan" | "enabled_modules"> | null | undefined): Promise<boolean> {
  if (!tenant?.plan) return false;
  const included = await planIncludesPos(tenant.plan);
  if (!included) return false;

  const override = tenant.enabled_modules?.pos;
  if (typeof override === "boolean") return override;

  const { data } = await supabase.from("plans").select("modules").eq("id", tenant.plan).maybeSingle();
  const modules = (data?.modules ?? {}) as Record<string, PlanModuleConfig>;
  return !!modules.pos?.defaultOn;
}
