import { useEffect } from "react";
import { FlatList } from "react-native";
import { router } from "expo-router";
import { useRole } from "../../../lib/role";
import { useSelectedTenant } from "../../../lib/tenant";
import { TenantCard } from "../../../components/TenantCard";
import { EmptyState, LoadingSpinner, Screen } from "../../../components/ui";

export default function SitesScreen() {
  const { memberships, loading: roleLoading } = useRole();
  const { selectedTenantId, setSelectedTenantId, loading: tenantLoading } = useSelectedTenant();

  // Exactly one site — no picker needed, go straight to its pages list.
  useEffect(() => {
    if (roleLoading || tenantLoading) return;
    if (memberships.length === 1) {
      router.replace(`/(tenant)/sites/${memberships[0].tenantId}/pages`);
    }
  }, [memberships, roleLoading, tenantLoading]);

  if (roleLoading || tenantLoading) return <LoadingSpinner />;

  if (memberships.length === 0) {
    return (
      <Screen>
        <EmptyState title="No sites yet" subtitle="You don't have access to any sites." />
      </Screen>
    );
  }

  if (memberships.length === 1) {
    // Redirect effect above is in flight.
    return <LoadingSpinner />;
  }

  return (
    <Screen scroll={false}>
      <FlatList
        data={memberships}
        keyExtractor={(m) => m.tenantId}
        contentContainerStyle={{ padding: 16, gap: 12 }}
        renderItem={({ item }) => (
          <TenantCard
            tenant={item.tenant}
            onPress={() => {
              setSelectedTenantId(item.tenantId);
              router.push(`/(tenant)/sites/${item.tenantId}/pages`);
            }}
          />
        )}
      />
    </Screen>
  );
}
