import { createAdminClient } from "@/lib/supabase/server";
import { CreditCard, Plus } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Subscriptions — Super Admin" };

export default async function SubscriptionsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams;
  const supabase = await createAdminClient();

  let query = supabase
    .from("subscriptions")
    .select("id,plan_id,status,payment_provider,amount_cents,currency,trial_ends_at,current_period_end,created_at,tenant_id,tenants(name,slug)")
    .order("created_at", { ascending: false })
    .limit(100);

  if (status) query = query.eq("status", status);

  const { data: subs } = await query;

  const STATUS_COLORS: Record<string, string> = {
    active: "bg-green-900/50 text-green-400",
    trial: "bg-amber-900/50 text-amber-400",
    past_due: "bg-red-900/50 text-red-400",
    cancelled: "bg-gray-800 text-gray-400",
    expired: "bg-gray-800 text-gray-500",
  };

  const STATUSES = ["", "trial", "active", "past_due", "cancelled", "expired"];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <CreditCard className="w-6 h-6 text-green-400" /> Subscriptions
        </h1>
        <Link href="/super-admin/subscriptions/new"
          className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-lg">
          <Plus className="w-4 h-4" /> Add Subscription
        </Link>
      </div>

      <div className="flex gap-2">
        {STATUSES.map(s => (
          <Link key={s} href={s ? `/super-admin/subscriptions?status=${s}` : "/super-admin/subscriptions"}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${(status ?? "") === s ? "bg-indigo-600 text-white" : "bg-gray-900 border border-gray-700 text-gray-400 hover:border-gray-600"}`}>
            {s || "All"}
          </Link>
        ))}
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto"><table className="w-full text-sm min-w-[640px]">
          <thead>
            <tr className="border-b border-gray-800">
              {["Site", "Plan", "Status", "Provider", "Amount", "Period End", "Created"].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs text-gray-500 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(subs ?? []).map((sub) => {
              const tenantRaw = sub.tenants;
              const tenant = (Array.isArray(tenantRaw) ? tenantRaw[0] : tenantRaw) as { name: string; slug: string } | null;
              return (
                <tr key={sub.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="text-white font-medium">{tenant?.name ?? "—"}</div>
                    <div className="text-xs text-gray-500">{tenant?.slug}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-300 capitalize">{sub.plan_id}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[sub.status] ?? "bg-gray-800 text-gray-400"}`}>{sub.status}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 capitalize">{sub.payment_provider ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-300">
                    {sub.amount_cents ? `$${(sub.amount_cents / 100).toFixed(2)}` : "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {sub.current_period_end ? new Date(sub.current_period_end).toLocaleDateString() :
                     sub.trial_ends_at ? `Trial: ${new Date(sub.trial_ends_at).toLocaleDateString()}` : "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{new Date(sub.created_at).toLocaleDateString()}</td>
                </tr>
              );
            })}
            {!subs?.length && (
              <tr><td colSpan={7} className="px-5 py-10 text-center text-gray-600">No subscriptions found</td></tr>
            )}
          </tbody>
        </table></div>
      </div>
    </div>
  );
}
