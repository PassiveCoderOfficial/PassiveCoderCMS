import { useEffect, useState } from "react";
import { Alert, Text, StyleSheet } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { getTenant, updateTenantName } from "../../../../lib/queries/tenant";
import type { Tenant } from "../../../../lib/types";
import { Button, ErrorText, Field, TextField } from "../../../../components/form";
import { Badge, Card, LoadingSpinner, Screen } from "../../../../components/ui";
import { colors } from "../../../../lib/theme";

export default function TenantSettingsScreen() {
  const { tenantId } = useLocalSearchParams<{ tenantId: string }>();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tenantId) return;
    (async () => {
      try {
        const t = await getTenant(tenantId);
        setTenant(t);
        setName(t.name);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load site");
      } finally {
        setLoading(false);
      }
    })();
  }, [tenantId]);

  async function save() {
    if (!tenantId) return;
    setSaving(true);
    setError(null);
    try {
      await updateTenantName(tenantId, name);
      Alert.alert("Saved", "Site name updated.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
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
      <Card style={{ gap: 10 }}>
        <Text style={styles.label}>Plan</Text>
        <Text style={styles.value}>{tenant.plan}</Text>
        <Text style={styles.label}>Status</Text>
        <Badge label={tenant.status} />
        {tenant.trial_ends_at && (
          <>
            <Text style={styles.label}>Trial ends</Text>
            <Text style={styles.value}>{new Date(tenant.trial_ends_at).toLocaleDateString()}</Text>
          </>
        )}
      </Card>

      <Card style={{ gap: 14 }}>
        <Field label="Site name" required>
          <TextField value={name} onChangeText={setName} />
        </Field>
        <ErrorText>{error}</ErrorText>
        <Button title="Save" onPress={save} loading={saving} />
      </Card>

      <Card style={{ gap: 10 }}>
        <Button
          title="Transfer ownership"
          variant="outline"
          onPress={() => router.push(`/(tenant)/sites/${tenantId}/transfer`)}
        />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 12, fontWeight: "600", color: colors.textMuted },
  value: { fontSize: 14, color: colors.text },
});
