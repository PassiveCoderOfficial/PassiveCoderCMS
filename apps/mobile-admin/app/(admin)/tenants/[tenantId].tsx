// Tenant detail for super_admin / pc_staff. Deliberately does NOT duplicate
// the pages/leads/settings/domain screens — "Manage as this tenant" routes
// into the same (tenant)/sites/[tenantId]/... tree tenant owners use.

import { useCallback, useEffect, useState } from "react";
import { Alert, StyleSheet, Text } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { listAllTenants, suspendTenant, activateTenant, type AdminTenantListItem } from "../../../lib/queries/admin";
import { Button, ErrorText } from "../../../components/form";
import { Badge, Card, LoadingSpinner, Screen } from "../../../components/ui";
import { colors } from "../../../lib/theme";

export default function AdminTenantDetailScreen() {
  const { tenantId } = useLocalSearchParams<{ tenantId: string }>();
  const [tenant, setTenant] = useState<AdminTenantListItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // No GET /api/super-admin/sites/[id] single-tenant route exists — reuse
  // the list endpoint and find by id, same data the list screen already has.
  const load = useCallback(async () => {
    if (!tenantId) return;
    try {
      const rows = await listAllTenants();
      const found = rows.find((t) => t.id === tenantId) ?? null;
      setTenant(found);
      if (!found) setError("Site not found");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load site");
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    load();
  }, [load]);

  async function onToggleStatus() {
    if (!tenant) return;
    const suspending = tenant.status !== "suspended";
    setBusy(true);
    setError(null);
    const result = suspending ? await suspendTenant(tenant.id) : await activateTenant(tenant.id);
    setBusy(false);
    if (!result.ok) {
      setError(result.error ?? "Action failed");
      return;
    }
    await load();
  }

  function confirmToggleStatus() {
    if (!tenant) return;
    const suspending = tenant.status !== "suspended";
    Alert.alert(
      suspending ? "Suspend site?" : "Activate site?",
      suspending
        ? "This will suspend the site. It may become inaccessible to its owner."
        : "This will reactivate the site.",
      [
        { text: "Cancel", style: "cancel" },
        { text: suspending ? "Suspend" : "Activate", style: suspending ? "destructive" : "default", onPress: onToggleStatus },
      ]
    );
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
        <Text style={styles.name}>{tenant.name}</Text>
        <Text style={styles.label}>Slug</Text>
        <Text style={styles.value}>{tenant.slug}</Text>
        <Text style={styles.label}>Status</Text>
        <Badge label={tenant.status} />
        <Text style={styles.label}>Custom domain</Text>
        <Text style={styles.value}>{tenant.custom_domain ?? "None"}</Text>
        <Text style={styles.label}>Domain status</Text>
        <Badge label={tenant.domain_status} />
      </Card>

      <ErrorText>{error}</ErrorText>

      <Card style={{ gap: 10 }}>
        <Button
          title={tenant.status === "suspended" ? "Activate site" : "Suspend site"}
          variant={tenant.status === "suspended" ? "primary" : "danger"}
          onPress={confirmToggleStatus}
          loading={busy}
        />
        <Button
          title="Transfer ownership"
          variant="outline"
          onPress={() => router.push(`/(tenant)/sites/${tenant.id}/transfer`)}
        />
        <Button
          title="Manage as this tenant"
          variant="outline"
          onPress={() => router.push(`/(tenant)/sites/${tenant.id}/pages`)}
        />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  name: { fontSize: 18, fontWeight: "800", color: colors.text },
  label: { fontSize: 12, fontWeight: "600", color: colors.textMuted },
  value: { fontSize: 14, color: colors.text },
});
