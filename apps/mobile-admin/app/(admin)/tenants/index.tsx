// Cross-tenant list for super_admin / pc_staff via GET /api/super-admin/sites.

import { useCallback, useEffect, useState } from "react";
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { listAllTenants, type AdminTenantListItem } from "../../../lib/queries/admin";
import { Badge, EmptyState, LoadingSpinner, Screen } from "../../../components/ui";
import { ErrorText } from "../../../components/form";
import { colors, radius } from "../../../lib/theme";

function AdminTenantRow({ tenant }: { tenant: AdminTenantListItem }) {
  return (
    <Pressable onPress={() => router.push(`/(admin)/tenants/${tenant.id}`)} style={styles.card}>
      <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
        <Text style={styles.name} numberOfLines={1}>{tenant.name}</Text>
        <Text style={styles.slug} numberOfLines={1}>{tenant.slug}</Text>
        <Text style={styles.domain} numberOfLines={1}>
          {tenant.custom_domain ?? "No custom domain"}
        </Text>
      </View>
      <Badge label={tenant.status} />
    </Pressable>
  );
}

export default function AdminTenantsScreen() {
  const [tenants, setTenants] = useState<AdminTenantListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const rows = await listAllTenants();
      setTenants(rows);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load sites");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <LoadingSpinner />;

  return (
    <Screen scroll={false}>
      <FlatList
        data={tenants}
        keyExtractor={(t) => t.id}
        contentContainerStyle={{ padding: 16, gap: 10, flexGrow: 1 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); load(); }}
            tintColor={colors.primary600}
          />
        }
        ListHeaderComponent={error ? <ErrorText>{error}</ErrorText> : null}
        renderItem={({ item }) => <AdminTenantRow tenant={item} />}
        ListEmptyComponent={<EmptyState title="No sites found" />}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row", alignItems: "center", gap: 12,
    padding: 16, backgroundColor: colors.white, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border,
  },
  name: { fontSize: 15, fontWeight: "700", color: colors.text },
  slug: { fontSize: 12, color: colors.textMuted },
  domain: { fontSize: 12, color: colors.textFaint },
});
