// Cross-tenant list for super_admin / pc_staff via GET /api/super-admin/sites.

import { useCallback, useEffect, useMemo, useState } from "react";
import { FlatList, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import { listAllTenants, type AdminTenantListItem } from "../../../lib/queries/admin";
import {
  Badge,
  Card,
  EmptyState,
  Pill,
  Screen,
  SkeletonList,
  type BadgeTone,
} from "../../../components/ui";
import { SearchField } from "../../../components/form";
import { humanize, relativeTime } from "../../../lib/format";
import { spacing, type } from "../../../lib/theme";
import { useTheme } from "../../../lib/themeContext";
import { tapFeedback } from "../../../lib/haptics";

/** Tenant status → badge tone. Anything unrecognised stays neutral rather
 *  than borrowing a colour it hasn't earned. */
function statusTone(status: string): BadgeTone {
  switch (status) {
    case "active":
    case "onboarded":
      return "success";
    case "trial":
      return "warning";
    case "suspended":
    case "cancelled":
      return "danger";
    default:
      return "neutral";
  }
}

/** Filters offered regardless of what's in the current payload, so the row
 *  doesn't reshuffle as data changes. Any other status actually present is
 *  appended, so nothing becomes unreachable. */
const BASE_STATUSES = ["onboarded", "active", "suspended", "trial", "cancelled"];

function AdminTenantRow({
  tenant,
  onPress,
}: {
  tenant: AdminTenantListItem;
  onPress: () => void;
}) {
  const { palette } = useTheme();
  return (
    <Pressable
      onPress={() => {
        tapFeedback();
        onPress();
      }}
      style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}
    >
      <Card style={{ gap: spacing.sm }}>
        <View style={{ flexDirection: "row", alignItems: "flex-start", gap: spacing.md }}>
          <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
            <Text style={[type.bodyStrong, { color: palette.text }]} numberOfLines={1}>
              {tenant.name}
            </Text>
            <Text style={[type.caption, { color: palette.textMuted }]} numberOfLines={1}>
              {tenant.slug}
            </Text>
          </View>
          <View style={{ alignItems: "flex-end", gap: 4 }}>
            <Badge label={humanize(tenant.status)} tone={statusTone(tenant.status)} />
            <Text style={[type.caption, { color: palette.textFaint }]}>
              {relativeTime(tenant.created_at)}
            </Text>
          </View>
        </View>
        {tenant.custom_domain ? (
          <Text style={[type.caption, { color: palette.textFaint }]} numberOfLines={1}>
            🌐 {tenant.custom_domain}
          </Text>
        ) : null}
      </Card>
    </Pressable>
  );
}

export default function AdminTenantsScreen() {
  const { palette } = useTheme();
  const [tenants, setTenants] = useState<AdminTenantListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

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

  // Fixed list first (stable ordering), then any status the API actually
  // returned that we didn't anticipate.
  const statuses = useMemo(() => {
    const extra = Array.from(new Set(tenants.map((t) => t.status))).filter(
      (s) => s && !BASE_STATUSES.includes(s),
    );
    return [...BASE_STATUSES, ...extra.sort()];
  }, [tenants]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tenants.filter((t) => {
      if (statusFilter !== "all" && t.status !== statusFilter) return false;
      if (!q) return true;
      return [t.name, t.slug, t.custom_domain]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
    });
  }, [tenants, query, statusFilter]);

  if (loading) return <SkeletonList count={6} />;

  // A failed fetch is not "no sites" — give it its own retryable state so an
  // outage never reads as an empty platform.
  if (error) {
    return (
      <Screen>
        <EmptyState
          title="Couldn't load sites"
          subtitle={error}
          icon="⚠️"
          action={{
            label: "Retry",
            onPress: () => {
              setLoading(true);
              setError(null);
              load();
            },
          }}
        />
      </Screen>
    );
  }

  return (
    <Screen scroll={false}>
      <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.lg, gap: spacing.md }}>
        <SearchField
          value={query}
          onChangeText={setQuery}
          placeholder="Search name, slug, domain…"
        />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ gap: spacing.sm, paddingRight: spacing.lg }}
        >
          <Pill label="All" selected={statusFilter === "all"} onPress={() => setStatusFilter("all")} />
          {statuses.map((s) => (
            <Pill
              key={s}
              label={humanize(s)}
              selected={statusFilter === s}
              onPress={() => setStatusFilter(s)}
            />
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={visible}
        keyExtractor={(t) => t.id}
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
            tintColor={palette.primary600}
            colors={[palette.primary600]}
          />
        }
        renderItem={({ item }) => (
          <AdminTenantRow
            tenant={item}
            onPress={() => router.push(`/(admin)/tenants/${item.id}`)}
          />
        )}
        ListEmptyComponent={
          tenants.length === 0 ? (
            <EmptyState title="No sites found" subtitle="No tenants exist yet." icon="🏢" />
          ) : (
            <EmptyState
              title="No matching sites"
              subtitle="Try a different search or status filter."
              icon="🔍"
            />
          )
        }
      />
    </Screen>
  );
}
