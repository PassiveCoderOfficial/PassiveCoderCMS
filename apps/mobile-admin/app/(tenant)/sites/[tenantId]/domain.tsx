import { useEffect, useState } from "react";
import { Alert, Text, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { getTenant } from "../../../../lib/queries/tenant";
import { connectDomain, disconnectDomain, type DomainDnsType } from "../../../../lib/queries/domain";
import type { Tenant } from "../../../../lib/types";
import { Button, ErrorText, Field, Select, TextField } from "../../../../components/form";
import { Badge, Card, LoadingSpinner, Screen } from "../../../../components/ui";
import { colors } from "../../../../lib/theme";

const DNS_TYPE_OPTIONS = [
  { label: "Nameservers", value: "nameserver" },
  { label: "A Record / CNAME", value: "arecord" },
];

export default function DomainScreen() {
  const { tenantId } = useLocalSearchParams<{ tenantId: string }>();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [domain, setDomain] = useState("");
  const [dnsType, setDnsType] = useState<DomainDnsType>("arecord");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [instructions, setInstructions] = useState<string | null>(null);

  async function load() {
    if (!tenantId) return;
    try {
      const t = await getTenant(tenantId);
      setTenant(t);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load site");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [tenantId]);

  async function onConnect() {
    if (!tenantId || !domain.trim()) return;
    setBusy(true);
    setError(null);
    setInstructions(null);
    const r = await connectDomain({ tenantId, domain: domain.trim(), type: dnsType });
    setBusy(false);
    if (!r.ok) {
      setError(r.error ?? "Failed to connect domain");
      return;
    }
    if (r.instructions) setInstructions(JSON.stringify(r.instructions, null, 2));
    await load();
  }

  async function onDisconnect() {
    if (!tenantId) return;
    Alert.alert("Disconnect domain?", "This will remove the custom domain from this site.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Disconnect",
        style: "destructive",
        onPress: async () => {
          setBusy(true);
          setError(null);
          const r = await disconnectDomain({ tenantId });
          setBusy(false);
          if (!r.ok) {
            setError(r.error ?? "Failed to disconnect domain");
            return;
          }
          setInstructions(null);
          await load();
        },
      },
    ]);
  }

  if (loading) return <LoadingSpinner />;
  if (!tenant) {
    return (
      <Screen>
        <ErrorText>{error ?? "Site not found"}</ErrorText>
      </Screen>
    );
  }

  return (
    <Screen>
      <Card style={{ gap: 8 }}>
        <Text style={styles.label}>Current domain</Text>
        <Text style={styles.value}>{tenant.custom_domain ?? "No custom domain"}</Text>
        <Text style={styles.label}>Status</Text>
        <Badge label={tenant.domain_status} />
        {tenant.custom_domain && (
          <Button title="Disconnect" variant="danger" onPress={onDisconnect} loading={busy} />
        )}
      </Card>

      <Card style={{ gap: 14 }}>
        <Text style={styles.cardTitle}>Connect a domain</Text>
        <Field label="Domain" required>
          <TextField
            value={domain}
            onChangeText={setDomain}
            placeholder="example.com"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </Field>
        <Field label="DNS method">
          <Select value={dnsType} placeholder="DNS method" options={DNS_TYPE_OPTIONS} onChange={(v) => setDnsType(v as DomainDnsType)} />
        </Field>
        <ErrorText>{error}</ErrorText>
        <Button title="Connect" onPress={onConnect} loading={busy} />
      </Card>

      {instructions && (
        <Card>
          <Text style={styles.cardTitle}>DNS instructions</Text>
          <Text style={styles.mono}>{instructions}</Text>
        </Card>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 12, fontWeight: "600", color: colors.textMuted },
  value: { fontSize: 14, color: colors.text },
  cardTitle: { fontSize: 14, fontWeight: "700", color: colors.text },
  mono: { fontFamily: "monospace", fontSize: 12, color: colors.text, marginTop: 8 },
});
