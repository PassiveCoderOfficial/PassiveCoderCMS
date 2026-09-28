// Shared plan-pick + checkout sheet — used by billing.tsx (existing
// tenant changing plan) and the onboarding wizard (new tenant's first
// payment). Payment-method choice + checkout itself is the same either
// way: pick a plan, pick monthly/yearly, pick Dodo (card, USD) / shurjoPay
// (BDT) / Contact Us (manual, no trial — see docs/business/04-pricing-and-
// packaging.md "automatic trial removed", never show trial copy here).

import { useState } from "react";
import { useLanguage } from "../lib/languageContext";
import { Modal, Pressable, ScrollView, Text, View, StyleSheet, Linking } from "react-native";
import type { Plan } from "../lib/queries/subscription";
import { startCheckout, type PaymentMethod } from "../lib/queries/billing";
import { openCheckout, checkoutReturnUrl, checkoutCancelUrl } from "../lib/checkout-browser";
import { Card, Badge } from "./ui";
import { Button } from "./form";
import { spacing, type, radius } from "../lib/theme";
import { useTheme } from "../lib/themeContext";
import { useToast } from "../lib/toast";
import { formatMoney } from "../lib/currency";

const PAY_METHODS: { id: PaymentMethod; label: string; currency: string }[] = [
  { id: "dodo", label: "Card (Dodo)", currency: "USD" },
  { id: "shurjopay", label: "bKash / Nagad / Card", currency: "BDT" },
];

export function PlanPickerSheet({
  tenantId, currentPlanId, plans, onClose, onDone,
}: {
  tenantId: string;
  currentPlanId?: string;
  plans: Plan[];
  onClose: () => void;
  onDone: () => void;
}) {
  const { palette } = useTheme();
  const { t } = useLanguage();
  const { error: toastError, success } = useToast();
  const [planId, setPlanId] = useState(currentPlanId ?? plans[0]?.id ?? "");
  const [cycle, setCycle] = useState<"monthly" | "yearly">("monthly");
  const [method, setMethod] = useState<PaymentMethod>("dodo");
  const [submitting, setSubmitting] = useState(false);

  const plan = plans.find((p) => p.id === planId);
  const currency = method === "shurjopay" ? "BDT" : "USD";
  const price = method === "shurjopay"
    ? (cycle === "monthly" ? plan?.price_monthly_bdt : plan?.price_yearly_bdt)
    : (cycle === "monthly" ? plan?.price_monthly : plan?.price_yearly);

  async function confirm() {
    if (!planId) return;
    setSubmitting(true);
    try {
      const res = await startCheckout(tenantId, {
        planId, method, billingCycle: cycle,
        returnUrl: checkoutReturnUrl(), cancelUrl: checkoutCancelUrl(),
      });
      if (!res.ok) { toastError(res.error ?? t("plans.checkoutFailed")); return; }

      if (res.mode === "manual") {
        success(t("plans.requestSent"));
        onDone();
        return;
      }

      if (!res.checkoutUrl) { toastError(t("plans.noCheckoutLink")); return; }
      const outcome = await openCheckout(res.checkoutUrl);
      if (outcome === "paid") {
        success(t("plans.paid"));
        onDone();
      } else if (outcome === "cancelled") {
        toastError(t("plans.checkoutCancelled"));
      } else {
        // Dismissed without a clear redirect — a webhook may still land
        // shortly after, so re-check rather than assuming nothing happened.
        onDone();
      }
    } finally {
      setSubmitting(false);
    }
  }

  function contactUs() {
    const rootDomain = process.env.EXPO_PUBLIC_ROOT_DOMAIN ?? "passivecoder.com";
    Linking.openURL(`https://wa.me/8801678669699?text=${encodeURIComponent(t("plans.waMessage", { plan: plan?.name ?? planId ?? "", domain: rootDomain }))}`);
  }

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={[styles.backdrop, { backgroundColor: palette.overlay }]} onPress={onClose}>
        <Pressable style={[styles.sheet, { backgroundColor: palette.bgElevated }]} onPress={() => {}}>
          <Text style={[type.heading, { color: palette.text, marginBottom: spacing.md }]}>{t("plans.choose")}</Text>

          <ScrollView style={{ maxHeight: 400 }} showsVerticalScrollIndicator={false}>
            <View style={{ gap: spacing.sm, marginBottom: spacing.lg }}>
              {plans.map((p) => (
                <Pressable
                  key={p.id}
                  onPress={() => setPlanId(p.id)}
                  style={{
                    borderWidth: 1, borderRadius: radius.md, padding: spacing.md,
                    borderColor: planId === p.id ? palette.primary600 : palette.border,
                    backgroundColor: planId === p.id ? `${palette.primary600}14` : "transparent",
                  }}
                >
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <Text style={[type.bodyStrong, { color: palette.text }]}>{p.name}</Text>
                    {p.id === currentPlanId && <Badge label={t("plans.current")} />}
                  </View>
                </Pressable>
              ))}
            </View>

            <View style={{ flexDirection: "row", gap: spacing.sm, marginBottom: spacing.md }}>
              {(["monthly", "yearly"] as const).map((c) => (
                <Pressable
                  key={c}
                  onPress={() => setCycle(c)}
                  style={{
                    flex: 1, paddingVertical: 10, borderRadius: radius.md, alignItems: "center",
                    borderWidth: 1, borderColor: cycle === c ? palette.primary600 : palette.border,
                    backgroundColor: cycle === c ? palette.primary600 : "transparent",
                  }}
                >
                  <Text style={{ color: cycle === c ? palette.onPrimary : palette.textMuted, fontWeight: "700", fontSize: 13 }}>
                    {c === "monthly" ? t("plans.monthly") : t("plans.yearly")}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={[type.caption, { color: palette.textMuted, marginBottom: spacing.sm }]}>{t("plans.paymentMethod")}</Text>
            <View style={{ gap: spacing.sm, marginBottom: spacing.md }}>
              {PAY_METHODS.map((m) => (
                <Pressable
                  key={m.id}
                  onPress={() => setMethod(m.id)}
                  style={{
                    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
                    borderWidth: 1, borderRadius: radius.md, padding: spacing.md,
                    borderColor: method === m.id ? palette.primary600 : palette.border,
                  }}
                >
                  <Text style={[type.body, { color: palette.text }]}>{m.id === "dodo" ? t("plans.cardDodo") : m.label}</Text>
                  <Text style={[type.caption, { color: palette.textMuted }]}>{m.currency}</Text>
                </Pressable>
              ))}
            </View>

            {price != null && (
              <Text style={[type.bodyStrong, { color: palette.text, marginBottom: spacing.md }]}>
                {formatMoney(method === "shurjopay" ? price : price / 100, currency)}/{cycle === "monthly" ? "mo" : "yr"}
              </Text>
            )}

            <Button title={t("plans.continueToPayment")} onPress={confirm} loading={submitting} disabled={!planId} />
            <Button title={t("plans.contactInstead")} variant="ghost" size="sm" onPress={contactUs} style={{ marginTop: spacing.sm }} />
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: "flex-end" },
  sheet: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    maxHeight: "85%",
    padding: spacing.lg,
  },
});
