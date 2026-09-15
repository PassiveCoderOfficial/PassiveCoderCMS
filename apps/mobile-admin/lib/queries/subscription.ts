// Subscription + receipts — direct Supabase reads (RLS-scoped), same
// pattern web's subscription/page.tsx uses (it reads straight through the
// browser Supabase client too, no API route for any of this). Scoped to
// one tenant per call, unlike web's all-memberships-at-once load, since
// this screen sits under sites/[tenantId] here.

import { supabase } from "../supabase";

export interface Subscription {
  id: string;
  tenant_id: string;
  plan_id: string;
  status: string;
  billing_cycle: "monthly" | "yearly";
  payment_provider: string | null;
  amount_cents: number | null;
  currency: string | null;
  trial_ends_at: string | null;
  cancelled_at: string | null;
  total_billed_cents: number | null;
  total_paid_cents: number | null;
  balance_due_cents: number | null;
}

export interface Plan {
  id: string;
  name: string;
  price_monthly: number;
  price_yearly: number;
  price_monthly_bdt: number | null;
  price_yearly_bdt: number | null;
  features: string[] | null;
}

export interface Receipt {
  id: string;
  receipt_number: string;
  amount_cents: number;
  currency: string;
  method: string | null;
  paid_at: string;
  is_advance: boolean;
}

export async function getSubscription(tenantId: string): Promise<Subscription | null> {
  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("tenant_id", tenantId)
    .maybeSingle();
  if (error) throw error;
  return data as Subscription | null;
}

export async function getPlans(): Promise<Plan[]> {
  const { data, error } = await supabase.from("plans").select("*").eq("is_active", true).order("sort_order");
  if (error) throw error;
  return (data ?? []) as Plan[];
}

export async function getReceipts(subscriptionId: string, tenantId: string): Promise<Receipt[]> {
  const { data, error } = await supabase
    .from("subscription_payments")
    .select("id, receipt_number, amount_cents, currency, method, paid_at, is_advance")
    .eq("subscription_id", subscriptionId)
    .eq("tenant_id", tenantId)
    .order("paid_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Receipt[];
}
