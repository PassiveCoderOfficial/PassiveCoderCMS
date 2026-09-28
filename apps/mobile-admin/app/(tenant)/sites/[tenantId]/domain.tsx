import { useCallback, useEffect, useState } from "react";
import { Alert, Text, View } from "react-native";
import { useLanguage } from "../../../../lib/languageContext";
import { useLocalSearchParams } from "expo-router";
import { getTenant } from "../../../../lib/queries/tenant";
import { connectDomain, disconnectDomain, type DomainDnsType } from "../../../../lib/queries/domain";
import type { Tenant } from "../../../../lib/types";
import { Button, Field, Select, TextField } from "../../../../components/form";
import { Badge, Card, EmptyState, Screen, SectionHeader, Skeleton } from "../../../../components/ui";
import { humanize } from "../../../../lib/format";
import { radius, spacing, type } from "../../../../lib/theme";
import { useTheme } from "../../../../lib/themeContext";
import { useToast } from "../../../../lib/toast";
import { actionFeedback, warningFeedback } from "../../../../lib/haptics";

const DNS_TYPE_OPTIONS = [
  { label: "Nameservers", value: "nameserver" },
  { label: "A Record / CNAME", value: "arecord" },
];

/** Domain status → badge tone, so "active" reads green and "failed" red
 *  rather than everything sharing the neutral default. */
function statusTone(status: string): "success" | "warning" | "danger" | "neutral" {
  if (status === "active") return "success";
  if (status === "pending" || status === "pending_dns") return "warning";
  if (status === "failed") return "danger";
  return "neutral";
}

export default function DomainScreen() {
  const { tenantId } = useLocalSearchParams<{ tenantId: string }>();
  const { palette } = useTheme();
  const { t } = useLanguage();
  const toast = useToast();

  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [domain, setDomain] = useState("");
  const [dnsType, setDnsType] = useState<DomainDnsType>("arecord");
  const [busy, setBusy] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [instructions, setInstructions] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!tenantId) {
      setLoading(false);
      setRefreshing(false);
      return;
    }
    try {
      setTenant(await getTenant(tenantId));
      setLoadError(null);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : t("settings.loadFailed"));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [tenantId]);

  useEffect(() => {
    load();
  }, [load]);

  async function onConnect() {
    const value = domain.trim().toLowerCase();
    if (!tenantId || !value) return;

    // Cheap client-side sanity check — the server validates properly, but
    // catching an obvious typo here saves a round trip and a scary error.
    if (!/^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(value)) {
      setFieldError(t("domain.invalid"));
      return;
    }

    setBusy(true);
    setFieldError(null);
    setInstructions(null);
    const r = await connectDomain({ tenantId, domain: value, type: dnsType });
    setBusy(false);

    if (!r.ok) {
      toast.error(r.error ?? t("domain.connectFailed"));
      return;
    }
    actionFeedback();
    toast.success(t("domain.connected"));
    if (r.instructions) setInstructions(JSON.stringify(r.instructions, null, 2));
    setDomain("");
    await load();
  }

  function onDisconnect() {
    if (!tenantId) return;
    warningFeedback();
    Alert.alert(
      t("domain.disconnectQ"),
      t("domain.disconnectHint", { domain: tenant?.custom_domain ?? t("domain.thisDomain") }),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("domain.disconnect"),
          style: "destructive",
          onPress: async () => {
            setBusy(true);
            const r = await disconnectDomain({ tenantId });
            setBusy(false);
            if (!r.ok) {
              toast.error(r.error ?? t("domain.disconnectFailed"));
              return;
            }
            toast.success(t("domain.disconnected"));
            setInstructions(null);
            await load();
          },
        },
      ],
    );
  }

  if (loading) {
    return (
      <Screen>
        <Skeleton height={120} radius={radius.lg} />
        <Skeleton height={200} radius={radius.lg} />
      </Screen>
    );
  }

  if (!tenant) {
    return (
      <Screen>
        <EmptyState
          title={t("domain.cantLoad")}
          subtitle={loadError ?? undefined}
          icon="⚠️"
          action={{ label: t("domain.tryAgain"), onPress: () => { setLoading(true); load(); } }}
        />
      </Screen>
    );
  }

  const connected = !!tenant.custom_domain;

  return (
    <Screen
      refreshing={refreshing}
      onRefresh={() => {
        setRefreshing(true);
        load();
      }}
    >
      <SectionHeader title={t("domain.current")} />
      <Card style={{ gap: spacing.md }}>
        <Text style={[type.title, { color: connected ? palette.text : palette.textMuted }]} numberOfLines={1}>
          {tenant.custom_domain ?? t("domain.none")}
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm, flexWrap: "wrap" }}>
          <Badge label={humanize(tenant.domain_status)} tone={statusTone(tenant.domain_status)} />
          {!connected && (
            <Text style={[type.caption, { color: palette.textMuted }]}>
              {t("domain.liveDefault")}
            </Text>
          )}
        </View>
        {connected && (
          <Button title={t("domain.disconnectBtn")} variant="danger" onPress={onDisconnect} loading={busy} />
        )}
      </Card>

      <SectionHeader title={connected ? t("domain.connectDifferent") : t("domain.connectOne")} />
      <Card style={{ gap: spacing.lg }}>
        <Field
          label={t("domain.domain")}
          required
          error={fieldError ?? undefined}
          hint={fieldError ? undefined : t("domain.fieldHint")}
        >
          <TextField
            value={domain}
            onChangeText={(v) => {
              setDomain(v);
              if (fieldError) setFieldError(null);
            }}
            placeholder="example.com"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            returnKeyType="go"
            onSubmitEditing={onConnect}
          />
        </Field>

        <Field label={t("domain.dnsMethod")} hint={t(dnsType === "nameserver" ? "domain.nsHint" : "domain.aHint")}>
          <Select
            value={dnsType}
            placeholder={t("domain.dnsMethod")}
            options={DNS_TYPE_OPTIONS.map((o) => ({ ...o, label: t(o.value === "nameserver" ? "domain.nameservers" : "domain.arecord") }))}
            onChange={(v) => setDnsType(v as DomainDnsType)}
          />
        </Field>

        <Button title={t("domain.connect")} icon="🔗" onPress={onConnect} loading={busy} disabled={!domain.trim()} />
      </Card>

      {instructions && (
        <>
          <SectionHeader title={t("domain.recordsTitle")} />
          <Card style={{ gap: spacing.sm }}>
            <Text style={[type.caption, { color: palette.textMuted }]}>
              {t("domain.recordsHint")}
            </Text>
            <View
              style={{
                backgroundColor: palette.bg,
                borderRadius: radius.md,
                borderWidth: 1,
                borderColor: palette.border,
                padding: spacing.md,
              }}
            >
              <Text
                selectable
                style={{ fontFamily: "monospace", fontSize: 12, color: palette.text, lineHeight: 18 }}
              >
                {instructions}
              </Text>
            </View>
            <Text style={[type.caption, { color: palette.textFaint }]}>
              {t("domain.copyTip")}
            </Text>
          </Card>
        </>
      )}
    </Screen>
  );
}
