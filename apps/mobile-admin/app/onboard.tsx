// New-tenant signup wizard — mirrors web's onboarding-client.tsx
// Step0..Step6, condensed for mobile. Reachable signed-out (see
// app/_layout.tsx's Gate exception for this route) since step 0 IS the
// signup form, same as web's AuthGate.
//
// No automatic trial exists (docs/business/04-pricing-and-packaging.md,
// "automatic trial removed entirely") — Dodo/shurjoPay both charge at
// signup, "Contact Us" (manual) is the only path to a staff-granted trial,
// never shown as a trial button here.

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLanguage } from "../lib/languageContext";
import { ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import { useAuth } from "../lib/auth";
import { useRole } from "../lib/role";
import { getPlans, checkSubdomain, getTemplates, createTenant, completeOnboarding, type Plan, type OnboardingTemplate } from "../lib/queries/onboarding";
import { startCheckout, type PaymentMethod } from "../lib/queries/billing";
import { openCheckout, checkoutReturnUrl, checkoutCancelUrl } from "../lib/checkout-browser";
import { Card, Screen, SkeletonList, Badge } from "../components/ui";
import { Button, Field, TextField, ErrorText } from "../components/form";
import { spacing, type, radius } from "../lib/theme";
import { useTheme } from "../lib/themeContext";
import { useToast } from "../lib/toast";
import { formatMoney } from "../lib/currency";

const PAY_METHODS: { id: "dodo" | "shurjopay"; label: string; sub: string }[] = [
  { id: "dodo", label: "Card", sub: "Dodo Payments — USD" },
  { id: "shurjopay", label: "bKash / Nagad / Card", sub: "shurjoPay — BDT" },
];

function slugify(s: string): string {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);
}

export default function OnboardScreen() {
  const { palette } = useTheme();
  const { t } = useLanguage();
  const { user, signup, login } = useAuth();
  const { refresh: refreshRole } = useRole();
  const { error: toastError } = useToast();

  const [step, setStep] = useState(0);

  // Step 0: account
  const [authMode, setAuthMode] = useState<"signup" | "login">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Step 1: plan + payment
  const [plans, setPlans] = useState<Plan[]>([]);
  const [planId, setPlanId] = useState("");
  const [cycle, setCycle] = useState<"monthly" | "yearly">("monthly");
  const [payMethod, setPayMethod] = useState<"dodo" | "shurjopay" | "manual">("dodo");

  // Step 2: business basics
  const [siteName, setSiteName] = useState("");
  const [siteWhat, setSiteWhat] = useState("");

  // Step 3: subdomain
  const [slug, setSlug] = useState("");
  const [slugStatus, setSlugStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const [slugReason, setSlugReason] = useState<string | null>(null);

  // Step 4: template
  const [templates, setTemplates] = useState<OnboardingTemplate[]>([]);
  const [templateId, setTemplateId] = useState<string | null>(null);

  // Step 5: launch
  const [launching, setLaunching] = useState(false);
  const [launchError, setLaunchError] = useState<string | null>(null);

  useEffect(() => {
    getPlans().then((p) => { setPlans(p); if (!planId && p[0]) setPlanId(p[0].id); }).catch(() => {});
    getTemplates().then(setTemplates).catch(() => {});
  }, []);

  // Debounced subdomain check, same 400ms as web.
  useEffect(() => {
    if (!slug || slug.length < 3) { setSlugStatus("idle"); return; }
    setSlugStatus("checking");
    const t = setTimeout(() => {
      checkSubdomain(slug).then((r) => {
        setSlugStatus(r.available ? "available" : "taken");
        setSlugReason(r.reason ?? null);
      });
    }, 400);
    return () => clearTimeout(t);
  }, [slug]);

  useEffect(() => {
    if (siteName && !slug) setSlug(slugify(siteName));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteName]);

  const selectedPlan = plans.find((p) => p.id === planId);
  const pagesLimit = selectedPlan?.pages_limit ?? -1;
  const visibleTemplates = useMemo(
    () => templates, // page-count filtering skipped in v1 (getTemplates doesn't tally counts) — every published template is shown
    [templates],
  );

  async function submitAuth() {
    if (!email.trim() || !password) return;
    setAuthBusy(true);
    setAuthError(null);
    const result = authMode === "signup"
      ? await signup(email.trim(), password, whatsapp.trim())
      : await login(email.trim(), password);
    setAuthBusy(false);
    if (!result.ok) { setAuthError(result.error ?? t("onb.genericError")); return; }
    setStep(1);
  }

  async function launch() {
    if (!user) return;
    setLaunching(true);
    setLaunchError(null);
    try {
      const created = await createTenant({
        siteName, slug, userId: user.id, planId, billingCycle: cycle, payMethod,
        templateId: templateId ?? undefined, templateMode: "full",
      });
      if ("error" in created) { setLaunchError(created.error); return; }

      await completeOnboarding(created.tenantId);

      if (payMethod === "dodo" || payMethod === "shurjopay") {
        const checkout = await startCheckout(created.tenantId, {
          planId, method: payMethod, billingCycle: cycle,
          returnUrl: checkoutReturnUrl(), cancelUrl: checkoutCancelUrl(),
        });
        if (checkout.ok && checkout.checkoutUrl) {
          const outcome = await openCheckout(checkout.checkoutUrl);
          if (outcome === "cancelled") {
            // Site exists either way (create-tenant already ran) — same as
            // web, an abandoned checkout still leaves a billable, working
            // site rather than losing the signup entirely.
            toastError(t("onb.checkoutCancelled"));
          }
        } else if (!checkout.ok) {
          toastError(checkout.error ?? t("onb.checkoutNoStart"));
        }
      }

      await refreshRole();
      router.replace(`/(tenant)/sites/${created.tenantId}/pages`);
    } catch (e) {
      setLaunchError(e instanceof Error ? e.message : t("onb.genericError"));
    } finally {
      setLaunching(false);
    }
  }

  // ── Step 0: account ─────────────────────────────────────────────────────
  if (step === 0 && !user) {
    return (
      <Screen keyboardAvoiding>
        <Text style={[type.title, { color: palette.text, marginBottom: spacing.md }]}>
          {authMode === "signup" ? t("onb.createAccount") : t("onb.logIn")}
        </Text>
        <Card style={{ gap: spacing.md }}>
          <Field label={t("login.email")} required>
            <TextField value={email} onChangeText={setEmail} placeholder="you@example.com" autoCapitalize="none" keyboardType="email-address" />
          </Field>
          <Field label={t("login.password")} required>
            <TextField value={password} onChangeText={setPassword} placeholder="••••••••" secureTextEntry />
          </Field>
          {authMode === "signup" && (
            <Field label={t("onb.whatsapp")} required>
              <TextField value={whatsapp} onChangeText={setWhatsapp} placeholder="+1 555 000 0000" keyboardType="phone-pad" />
            </Field>
          )}
          <ErrorText>{authError}</ErrorText>
          <Button
            title={authMode === "signup" ? t("onb.signUp") : t("onb.logIn")}
            onPress={submitAuth}
            loading={authBusy}
            disabled={!email.trim() || !password || (authMode === "signup" && !whatsapp.trim())}
          />
          <Button
            title={authMode === "signup" ? t("onb.haveAccount") : t("onb.newHere")}
            variant="ghost"
            size="sm"
            onPress={() => { setAuthMode((m) => m === "signup" ? "login" : "signup"); setAuthError(null); }}
          />
        </Card>
      </Screen>
    );
  }
  if (step === 0 && user) setStep(1); // already logged in (e.g. reached /onboard while signed in with 0 tenants)

  // ── Step 1: plan + payment ──────────────────────────────────────────────
  if (step === 1) {
    return (
      <Screen>
        <Text style={[type.title, { color: palette.text, marginBottom: spacing.md }]}>{t("plans.choose")}</Text>
        {plans.length === 0 ? <SkeletonList count={3} /> : (
          <>
            <View style={{ gap: spacing.sm }}>
              {plans.map((p) => (
                <Card
                  key={p.id}
                  style={{ borderColor: planId === p.id ? palette.primary600 : palette.border, borderWidth: 1 }}
                >
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <Text
                      style={[type.bodyStrong, { color: palette.text }]}
                      onPress={() => setPlanId(p.id)}
                    >
                      {p.name}
                    </Text>
                    {planId === p.id && <Badge label={t("plans.selected")} />}
                  </View>
                  <Text
                    style={[type.caption, { color: palette.textMuted, marginTop: 4 }]}
                    onPress={() => setPlanId(p.id)}
                  >
                    {formatMoney((cycle === "monthly" ? p.price_monthly : p.price_yearly), "USD")}/{cycle === "monthly" ? "mo" : "yr"}
                  </Text>
                </Card>
              ))}
            </View>

            <View style={{ flexDirection: "row", gap: spacing.sm, marginTop: spacing.md }}>
              {(["monthly", "yearly"] as const).map((c) => (
                <Text
                  key={c}
                  onPress={() => setCycle(c)}
                  style={[
                    type.caption,
                    {
                      flex: 1, textAlign: "center", paddingVertical: 10, borderRadius: radius.md,
                      color: cycle === c ? palette.onPrimary : palette.textMuted,
                      backgroundColor: cycle === c ? palette.primary600 : palette.bg,
                    },
                  ]}
                >
                  {c === "monthly" ? t("plans.monthly") : t("plans.yearly")}
                </Text>
              ))}
            </View>

            <Text style={[type.caption, { color: palette.textMuted, marginTop: spacing.lg, marginBottom: spacing.sm }]}>{t("plans.paymentMethod")}</Text>
            <View style={{ gap: spacing.sm }}>
              {PAY_METHODS.map((m) => (
                <Card key={m.id} style={{ borderColor: payMethod === m.id ? palette.primary600 : palette.border, borderWidth: 1 }}>
                  <Text style={[type.body, { color: palette.text }]} onPress={() => setPayMethod(m.id)}>{m.id === "dodo" ? t("plans.card") : m.label}</Text>
                  <Text style={[type.caption, { color: palette.textMuted }]}>{m.sub}</Text>
                </Card>
              ))}
              <Text
                onPress={() => setPayMethod("manual")}
                style={[type.caption, { color: payMethod === "manual" ? palette.primary600 : palette.textMuted, textAlign: "center", marginTop: spacing.xs }]}
              >
                {t("plans.contactUsOr")}
              </Text>
            </View>

            <Button title={t("onb.continue")} onPress={() => setStep(2)} style={{ marginTop: spacing.lg }} disabled={!planId} />
          </>
        )}
      </Screen>
    );
  }

  // ── Step 2: business basics ─────────────────────────────────────────────
  if (step === 2) {
    return (
      <Screen keyboardAvoiding>
        <Text style={[type.title, { color: palette.text, marginBottom: spacing.md }]}>{t("onb.aboutBusiness")}</Text>
        <Card style={{ gap: spacing.md }}>
          <Field label={t("onb.businessName")} required>
            <TextField value={siteName} onChangeText={setSiteName} placeholder={t("onb.businessNamePh")} />
          </Field>
          <Field label={t("onb.whatDo")}>
            <TextField value={siteWhat} onChangeText={setSiteWhat} placeholder={t("onb.whatDoPh")} />
          </Field>
          <Button title={t("onb.continue")} onPress={() => setStep(3)} disabled={!siteName.trim()} />
        </Card>
      </Screen>
    );
  }

  // ── Step 3: subdomain ────────────────────────────────────────────────────
  if (step === 3) {
    return (
      <Screen keyboardAvoiding>
        <Text style={[type.title, { color: palette.text, marginBottom: spacing.md }]}>{t("onb.pickAddress")}</Text>
        <Card style={{ gap: spacing.sm }}>
          <Field label={t("onb.subdomain")} required>
            <TextField value={slug} onChangeText={(t) => setSlug(slugify(t))} placeholder="yourbusiness" autoCapitalize="none" />
          </Field>
          <Text style={[type.caption, { color: palette.textMuted }]}>{slug || "yourbusiness"}.passivecoder.com</Text>
          {slugStatus === "checking" && <Text style={[type.caption, { color: palette.textMuted }]}>{t("onb.checking")}</Text>}
          {slugStatus === "available" && <Text style={[type.caption, { color: palette.green600 }]}>{t("onb.available")}</Text>}
          {slugStatus === "taken" && <Text style={[type.caption, { color: palette.red600 }]}>{slugReason ?? t("onb.notAvailable")}</Text>}
          <Button title={t("onb.continue")} onPress={() => setStep(4)} disabled={slugStatus !== "available"} />
        </Card>
      </Screen>
    );
  }

  // ── Step 4: template ─────────────────────────────────────────────────────
  if (step === 4) {
    return (
      <Screen scroll={false}>
        <Text style={[type.title, { color: palette.text, padding: spacing.lg, paddingBottom: 0 }]}>{t("onb.pickTemplate")}</Text>
        <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.sm }}>
          <Card style={{ borderColor: templateId === null ? palette.primary600 : palette.border, borderWidth: 1 }}>
            <Text style={[type.bodyStrong, { color: palette.text }]} onPress={() => setTemplateId(null)}>{t("onb.blank")}</Text>
          </Card>
          {visibleTemplates.map((t) => (
            <Card key={t.id} style={{ borderColor: templateId === t.id ? palette.primary600 : palette.border, borderWidth: 1 }}>
              <Text style={[type.bodyStrong, { color: palette.text }]} onPress={() => setTemplateId(t.id)}>{t.name}</Text>
            </Card>
          ))}
          <Button title={t("onb.launch")} onPress={launch} loading={launching} style={{ marginTop: spacing.md }} />
          <ErrorText>{launchError}</ErrorText>
        </ScrollView>
      </Screen>
    );
  }

  return null;
}
