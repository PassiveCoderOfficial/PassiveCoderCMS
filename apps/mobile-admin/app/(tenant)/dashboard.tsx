import { useCallback, useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { useRole } from "../../lib/role";
import { useSelectedTenant } from "../../lib/tenant";
import {
  getDashboardStats,
  getRecentLeads,
  type DashboardStats,
  type RecentLead,
} from "../../lib/queries/dashboard";
import {
  Avatar,
  Badge,
  Card,
  EmptyState,
  Row,
  Screen,
  SectionHeader,
  Skeleton,
} from "../../components/ui";
import { Button } from "../../components/form";
import { initials, leadDisplayName, relativeTime, humanize } from "../../lib/format";
import { radius, shadow, spacing, type } from "../../lib/theme";
import { useTheme } from "../../lib/themeContext";
import { useToast } from "../../lib/toast";
import { tapFeedback } from "../../lib/haptics";

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export default function DashboardScreen() {
  const { memberships } = useRole();
  const { selectedTenantId, loading: tenantLoading } = useSelectedTenant();
  const { palette } = useTheme();
  const { error: toastError } = useToast();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [leads, setLeads] = useState<RecentLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const membership = memberships.find((m) => m.tenantId === selectedTenantId);
  const tenantId = membership?.tenantId;

  const load = useCallback(async () => {
    if (!tenantId) {
      setLoading(false);
      setRefreshing(false);
      return;
    }
    try {
      const [s, l] = await Promise.all([getDashboardStats(tenantId), getRecentLeads(tenantId, 3)]);
      setStats(s);
      setLeads(l);
    } catch (e) {
      toastError(e instanceof Error ? e.message : "Failed to load dashboard");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [tenantId, toastError]);

  useEffect(() => {
    load();
  }, [load]);

  if (tenantLoading) {
    return (
      <Screen>
        <Skeleton width="45%" height={12} />
        <Skeleton width="70%" height={28} />
        <View style={{ flexDirection: "row", gap: 12, marginTop: spacing.md }}>
          <Skeleton height={92} style={{ flex: 1 }} radius={radius.lg} />
          <Skeleton height={92} style={{ flex: 1 }} radius={radius.lg} />
        </View>
      </Screen>
    );
  }

  if (!membership) {
    return (
      <Screen>
        <EmptyState
          title="No site selected"
          subtitle="Pick a site to see its dashboard."
          icon="🌐"
          action={{ label: "Choose a site", onPress: () => router.push("/(tenant)/sites") }}
        />
      </Screen>
    );
  }

  const { tenant } = membership;

  return (
    <Screen
      refreshing={refreshing}
      onRefresh={() => {
        setRefreshing(true);
        load();
      }}
    >
      {/* -------------------------------------------------------- Greeting */}
      <View style={{ gap: 6 }}>
        <Text style={[type.body, { color: palette.textMuted }]}>{greeting()}</Text>
        <Text style={[type.display, { color: palette.text }]} numberOfLines={2}>
          {tenant.name}
        </Text>
        <Badge label={stats?.status ?? tenant.status} />
      </View>

      {/* ----------------------------------------------------------- Stats */}
      <View style={{ flexDirection: "row", gap: 12 }}>
        <StatCard
          loading={loading}
          value={stats?.publishedPages}
          label="Published"
          onPress={() => router.push(`/(tenant)/sites/${tenant.id}/pages`)}
        />
        <StatCard
          loading={loading}
          value={stats?.draftPages}
          label="Drafts"
          onPress={() => router.push(`/(tenant)/sites/${tenant.id}/pages`)}
        />
      </View>
      <View style={{ flexDirection: "row", gap: 12 }}>
        <StatCard
          loading={loading}
          value={stats?.totalLeads}
          label="Total leads"
          onPress={() => router.push(`/(tenant)/sites/${tenant.id}/leads`)}
        />
        <StatCard
          loading={loading}
          value={stats?.newLeadsThisWeek}
          label="New this week"
          highlight
          onPress={() => router.push(`/(tenant)/sites/${tenant.id}/leads`)}
        />
      </View>

      {/* ---------------------------------------------------- Recent leads */}
      <SectionHeader title="Recent leads" />
      <Card style={{ padding: 0, gap: 0, overflow: "hidden" }}>
        {loading ? (
          <View style={{ padding: spacing.lg, gap: spacing.md }}>
            <Skeleton width="55%" height={14} />
            <Skeleton width="35%" height={11} />
          </View>
        ) : leads.length === 0 ? (
          <View style={{ paddingVertical: spacing.xl, paddingHorizontal: spacing.lg, alignItems: "center", gap: 4 }}>
            <Text style={{ fontSize: 28 }}>📭</Text>
            <Text style={[type.bodyStrong, { color: palette.text }]}>No leads yet</Text>
            <Text style={[type.caption, { color: palette.textMuted, textAlign: "center" }]}>
              New enquiries from your site will show up here.
            </Text>
          </View>
        ) : (
          leads.map((lead) => (
            <Row
              key={lead.id}
              leading={<Avatar text={initials(lead)} size={36} />}
              title={leadDisplayName(lead)}
              subtitle={relativeTime(lead.created_at)}
              right={<Text style={{ color: palette.textFaint, fontSize: 18 }}>›</Text>}
              onPress={() => router.push(`/(tenant)/sites/${tenant.id}/leads/${lead.id}`)}
            />
          ))
        )}
      </Card>
      {leads.length > 0 && (
        <Button
          title="View all leads"
          variant="ghost"
          onPress={() => router.push(`/(tenant)/sites/${tenant.id}/leads`)}
        />
      )}

      {/* ------------------------------------------------------------ Site */}
      <SectionHeader title="Site" />
      <Card style={{ padding: 0, gap: 0, overflow: "hidden" }}>
        <View style={{ padding: spacing.lg, gap: 6 }}>
          <Text style={[type.bodyStrong, { color: palette.text }]} numberOfLines={1}>
            {stats?.customDomain ?? tenant.custom_domain ?? "No custom domain"}
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm, flexWrap: "wrap" }}>
            <Badge label={humanize(stats?.domainStatus ?? tenant.domain_status)} />
            <Text style={[type.caption, { color: palette.textMuted }]}>
              {humanize(stats?.plan ?? tenant.plan)} plan
            </Text>
          </View>
        </View>
        <Row
          icon="⚙️"
          title="Site settings"
          onPress={() => router.push(`/(tenant)/sites/${tenant.id}/settings`)}
          right={<Text style={{ color: palette.textFaint, fontSize: 18 }}>›</Text>}
        />
        <Row
          icon="🌐"
          title="Domain"
          onPress={() => router.push(`/(tenant)/sites/${tenant.id}/domain`)}
          right={<Text style={{ color: palette.textFaint, fontSize: 18 }}>›</Text>}
        />
      </Card>
    </Screen>
  );
}

/* ---------------------------------------------------------------- StatCard */

function StatCard({
  value,
  label,
  loading,
  highlight,
  onPress,
}: {
  value: number | undefined;
  label: string;
  loading: boolean;
  highlight?: boolean;
  onPress: () => void;
}) {
  const { palette } = useTheme();
  return (
    <Pressable
      onPress={() => {
        tapFeedback();
        onPress();
      }}
      style={({ pressed }) => [
        {
          flex: 1,
          backgroundColor: highlight ? palette.primary50 : palette.card,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: highlight ? palette.primary100 : palette.border,
          padding: spacing.lg,
          gap: 4,
          minHeight: 92,
          justifyContent: "center",
          opacity: pressed ? 0.8 : 1,
        },
        shadow.card,
      ]}
    >
      {loading ? (
        <>
          <Skeleton width="45%" height={26} />
          <Skeleton width="70%" height={11} />
        </>
      ) : (
        <>
          <Text style={[type.display, { color: highlight ? palette.primary700 : palette.text }]}>
            {value ?? 0}
          </Text>
          <Text style={[type.caption, { color: palette.textMuted }]}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}
