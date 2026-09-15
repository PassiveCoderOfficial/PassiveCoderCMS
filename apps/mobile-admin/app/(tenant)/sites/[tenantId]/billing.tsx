// Subscription + billing — plan, status, receipts, cancel. Mirrors web's
// dashboard/subscription/page.tsx content for one tenant, direct Supabase
// reads (RLS), same pattern as lib/queries/dashboard.ts. "Change plan"
// opens the checkout flow — hosted Dodo/shurjoPay pages, opened via
// expo-web-browser (see lib/checkout-browser.ts) since there's no card-form
// API to call instead.

import { useCallback, useEffect, useState } from "react";
import { Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { getSubscription, getPlans, getReceipts, type Subscription, type Plan, type Receipt } from "../../../../lib/queries/subscription";
import { cancelSubscription } from "../../../../lib/queries/billing";
import { Card, Screen, SectionHeader, Skeleton, Badge, Row } from "../../../../components/ui";
import { Button } from "../../../../components/form";
import { spacing, type } from "../../../../lib/theme";
import { useTheme } from "../../../../lib/themeContext";
import { useToast } from "../../../../lib/toast";
import { formatMoney } from "../../../../lib/currency";
import { humanize } from "../../../../lib/format";
import { PlanPickerSheet } from "../../../../components/PlanPickerSheet";

export default function BillingScreen() {
  const { tenantId } = useLocalSearchParams<{ tenantId: string }>();
  const { palette } = useTheme();
  const { error: toastError, success } = useToast();

  const [sub, setSub] = useState<Subscription | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [showPlanPicker, setShowPlanPicker] = useState(false);

  const load = useCallback(async () => {
    if (!tenantId) { setLoading(false); return; }
    try {
      const [s, p] = await Promise.all([getSubscription(tenantId), getPlans()]);
      setSub(s);
      setPlans(p);
      if (s) setReceipts(await getReceipts(s.id, tenantId));
    } catch (e) {
      toastError(e instanceof Error ? e.message : "Failed to load billing info");
    } finally {
      setLoading(false);
    }
  }, [tenantId, toastError]);

  useEffect(() => { load(); }, [load]);

  async function handleCancel() {
    if (!tenantId) return;
    setCancelling(true);
    try {
      const res = await cancelSubscription(tenantId);
      if (!res.ok) { toastError(res.error ?? "Cancel failed"); return; }
      success("Subscription cancelled");
      load();
    } finally {
      setCancelling(false);
    }
  }

  if (loading) return <Screen><Skeleton height={120} /><Skeleton height={200} /></Screen>;

  const plan = plans.find((p) => p.id === sub?.plan_id);
  const currency = sub?.currency ?? "USD";
  const price = sub?.billing_cycle === "monthly" ? plan?.price_monthly : plan?.price_yearly;
  // Only a real, staff-granted trial shows a cancel option — matches web's
  // own condition exactly (no automatic trial exists any more, see
  // docs/business/04-pricing-and-packaging.md "automatic trial removed").
  const canCancel = !!sub?.trial_ends_at && sub.status !== "cancelled";

  return (
    <Screen>
      <View style={{ gap: 6 }}>
        <Text style={[type.display, { color: palette.text }]}>{plan?.name ?? humanize(sub?.plan_id ?? "—")}</Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
          <Badge label={humanize(sub?.status ?? "—")} />
          {price != null && (
            <Text style={[type.caption, { color: palette.textMuted }]}>
              {formatMoney(price, currency)}/{sub?.billing_cycle === "monthly" ? "mo" : "yr"}
            </Text>
          )}
        </View>
      </View>

      {sub?.status === "past_due" && (
        <Card style={{ backgroundColor: palette.bgElevated }}>
          <Text style={[type.bodyStrong, { color: palette.text }]}>Payment needs attention</Text>
          <Text style={[type.caption, { color: palette.textMuted, marginTop: 2 }]}>
            Usually just an expired card — update it to keep your site running smoothly.
          </Text>
        </Card>
      )}

      <Button title="Change plan" onPress={() => setShowPlanPicker(true)} />
      {canCancel && (
        <Button title="Cancel subscription" variant="danger" onPress={handleCancel} loading={cancelling} />
      )}

      <SectionHeader title="Receipts" />
      <Card style={{ padding: 0, gap: 0, overflow: "hidden" }}>
        {receipts.length === 0 ? (
          <View style={{ padding: spacing.lg, alignItems: "center" }}>
            <Text style={[type.caption, { color: palette.textMuted }]}>No payments yet.</Text>
          </View>
        ) : (
          receipts.map((r) => (
            <Row
              key={r.id}
              title={formatMoney(r.amount_cents / 100, r.currency)}
              subtitle={`${r.receipt_number} · ${new Date(r.paid_at).toLocaleDateString()}`}
              right={<Text style={{ color: palette.textFaint, fontSize: 12 }}>{r.method ?? ""}</Text>}
            />
          ))
        )}
      </Card>

      {showPlanPicker && tenantId && (
        <PlanPickerSheet
          tenantId={tenantId}
          currentPlanId={sub?.plan_id}
          plans={plans}
          onClose={() => setShowPlanPicker(false)}
          onDone={() => { setShowPlanPicker(false); load(); }}
        />
      )}
    </Screen>
  );
}
