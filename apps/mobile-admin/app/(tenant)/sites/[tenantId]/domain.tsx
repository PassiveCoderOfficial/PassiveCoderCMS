import { useCallback, useEffect, useState } from "react";
import { Alert, Text, View } from "react-native";
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

const DNS_HINTS: Record<DomainDnsType, string> = {
  nameserver:
    "Point your domain's nameservers at us. Simplest option — we manage all DNS records for you afterwards.",
  arecord:
    "Keep your DNS where it is and add a single record. Choose this if you already run email or other services on this domain.",
};

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
      setLoadError(e instanceof Error ? e.message : "Failed to load site");
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
      setFieldError("That doesn't look like a domain. Enter it without https:// or a trailing slash.");
      return;
    }

    setBusy(true);
    setFieldError(null);
    setInstructions(null);
    const r = await connectDomain({ tenantId, domain: value, type: dnsType });
    setBusy(false);

    if (!r.ok) {
      toast.error(r.error ?? "Failed to connect domain");
      return;
    }
    actionFeedback();
    toast.success("Domain connected — add the DNS records below");
    if (r.instructions) setInstructions(JSON.stringify(r.instructions, null, 2));
    setDomain("");
    await load();
  }

  function onDisconnect() {
    if (!tenantId) return;
    warningFeedback();
    Alert.alert(
      "Disconnect domain?",
      `${tenant?.custom_domain ?? "This domain"} will stop serving this site. The site stays reachable at its default address.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Disconnect",
          style: "destructive",
          onPress: async () => {
            setBusy(true);
            const r = await disconnectDomain({ tenantId });
            setBusy(false);
            if (!r.ok) {
              toast.error(r.error ?? "Failed to disconnect domain");
              return;
            }
            toast.success("Domain disconnected");
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
          title="Couldn't load this site"
          subtitle={loadError ?? undefined}
          icon="⚠️"
          action={{ label: "Try again", onPress: () => { setLoading(true); load(); } }}
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
      <SectionHeader title="Current domain" />
      <Card style={{ gap: spacing.md }}>
        <Text style={[type.title, { color: connected ? palette.text : palette.textMuted }]} numberOfLines={1}>
          {tenant.custom_domain ?? "No custom domain"}
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm, flexWrap: "wrap" }}>
          <Badge label={humanize(tenant.domain_status)} tone={statusTone(tenant.domain_status)} />
          {!connected && (
            <Text style={[type.caption, { color: palette.textMuted }]}>
              Your site is live at its default address
            </Text>
          )}
        </View>
        {connected && (
          <Button title="Disconnect domain" variant="danger" onPress={onDisconnect} loading={busy} />
        )}
      </Card>

      <SectionHeader title={connected ? "Connect a different domain" : "Connect a domain"} />
      <Card style={{ gap: spacing.lg }}>
        <Field
          label="Domain"
          required
          error={fieldError ?? undefined}
          hint={fieldError ? undefined : "Just the domain — no https://, no trailing slash."}
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

        <Field label="DNS method" hint={DNS_HINTS[dnsType]}>
          <Select
            value={dnsType}
            placeholder="DNS method"
            options={DNS_TYPE_OPTIONS}
            onChange={(v) => setDnsType(v as DomainDnsType)}
          />
        </Field>

        <Button title="Connect" icon="🔗" onPress={onConnect} loading={busy} disabled={!domain.trim()} />
      </Card>

      {instructions && (
        <>
          <SectionHeader title="DNS records to add" />
          <Card style={{ gap: spacing.sm }}>
            <Text style={[type.caption, { color: palette.textMuted }]}>
              Add these at your domain registrar. Verification can take up to a few hours.
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
              Tip: long-press the text above to copy it.
            </Text>
          </Card>
        </>
      )}
    </Screen>
  );
}
