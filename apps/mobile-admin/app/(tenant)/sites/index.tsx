import { useEffect, useMemo, useState } from "react";
import { FlatList, View } from "react-native";
import { router } from "expo-router";
import { useRole } from "../../../lib/role";
import { useSelectedTenant } from "../../../lib/tenant";
import { TenantCard } from "../../../components/TenantCard";
import { EmptyState, Screen, SkeletonList } from "../../../components/ui";
import { SearchField } from "../../../components/form";
import { spacing } from "../../../lib/theme";

/** Past this many sites, scanning the list gets slow — show the filter. */
const SEARCH_THRESHOLD = 6;

export default function SitesScreen() {
  const { memberships, loading: roleLoading } = useRole();
  const { setSelectedTenantId, loading: tenantLoading } = useSelectedTenant();
  const [query, setQuery] = useState("");

  // Exactly one site — no picker needed, go straight to its pages list.
  useEffect(() => {
    if (roleLoading || tenantLoading) return;
    if (memberships.length === 1) {
      router.replace(`/(tenant)/sites/${memberships[0].tenantId}/pages`);
    }
  }, [memberships, roleLoading, tenantLoading]);

  const showSearch = memberships.length > SEARCH_THRESHOLD;

  const visible = useMemo(() => {
    if (!showSearch || !query.trim()) return memberships;
    const q = query.trim().toLowerCase();
    return memberships.filter(
      (m) =>
        m.tenant.name.toLowerCase().includes(q) || m.tenant.slug.toLowerCase().includes(q),
    );
  }, [memberships, query, showSearch]);

  if (roleLoading || tenantLoading) return <SkeletonList count={4} />;

  if (memberships.length === 0) {
    return (
      <Screen>
        <EmptyState
          title="No sites yet"
          subtitle="You don't have access to any sites."
          icon="🌐"
        />
      </Screen>
    );
  }

  if (memberships.length === 1) {
    // Redirect effect above is in flight.
    return <SkeletonList count={3} />;
  }

  return (
    <Screen scroll={false}>
      {showSearch && (
        <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.lg }}>
          <SearchField value={query} onChangeText={setQuery} placeholder="Search sites" />
        </View>
      )}
      <FlatList
        data={visible}
        keyExtractor={(m) => m.tenantId}
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => (
          <TenantCard
            tenant={item.tenant}
            role={item.role}
            onPress={() => {
              setSelectedTenantId(item.tenantId);
              router.push(`/(tenant)/sites/${item.tenantId}/pages`);
            }}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            title="No matching sites"
            subtitle="Try a different name or slug."
            icon="🔍"
          />
        }
      />
    </Screen>
  );
}
