import { useCallback, useEffect, useState } from "react";
import { Linking, Pressable, Text, View } from "react-native";
import { useLanguage } from "../../lib/languageContext";
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
import { hasRestaurantAccess } from "../../lib/restaurant";
import { Icon } from "../../components/Icon";
import { publicHost, publicUrl } from "../../lib/siteUrls";

function greeting(t: ReturnType<typeof useLanguage>["t"]): string {
  const h = new Date().getHours();
  if (h < 12) return t("dash.morning");
  if (h < 18) return t("dash.afternoon");
  return t("dash.evening");
}

export default function DashboardScreen() {
  const { memberships } = useRole();
  const { t } = useLanguage();
  const { selectedTenantId, loading: tenantLoading } = useSelectedTenant();
  const { palette } = useTheme();
  const { error: toastError } = useToast();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [leads, setLeads] = useState<RecentLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [restaurantAccess, setRestaurantAccess] = useState(false);

  const membership = memberships.find((m) => m.tenantId === selectedTenantId);
  const tenantId = membership?.tenantId;

  useEffect(() => {
    if (!membership) { setRestaurantAccess(false); return; }
    let cancelled = false;
    hasRestaurantAccess(membership.tenant).then((v) => { if (!cancelled) setRestaurantAccess(v); });
    return () => { cancelled = true; };
  }, [membership]);

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
      toastError(e instanceof Error ? e.message : t("dash.loadFailed"));
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
          title={t("dash.noSite")}
          subtitle={t("dash.noSiteHint")}
          icon="🌐"
          action={{ label: t("dash.chooseSite"), onPress: () => router.push("/(tenant)/sites") }}
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
        <Text style={[type.body, { color: palette.textMuted }]}>{greeting(t)}</Text>
        <Text style={[type.display, { color: palette.text }]} numberOfLines={2}>
          {tenant.name}
        </Text>
        <Badge label={stats?.status ?? tenant.status} />
      </View>

      {/* --------------------------------------------------- Quick actions */}
      <View style={{ flexDirection: "row", gap: 10 }}>
        <QuickAction icon="open-outline" label={t("dash.viewSite")} onPress={() => Linking.openURL(publicUrl(tenant))} />
        <QuickAction icon="document-text-outline" label={t("dash.pages")} onPress={() => router.push(`/(tenant)/sites/${tenant.id}/pages`)} />
        <QuickAction icon="people-outline" label={t("dash.leads")} onPress={() => router.push(`/(tenant)/sites/${tenant.id}/leads`)} />
      </View>

      {/* ----------------------------------------------------------- Stats */}
      <View style={{ flexDirection: "row", gap: 12 }}>
        <StatCard
          loading={loading}
          value={stats?.publishedPages}
          label={t("dash.published")}
          icon="checkmark-circle-outline"
          onPress={() => router.push(`/(tenant)/sites/${tenant.id}/pages`)}
        />
        <StatCard
          loading={loading}
          value={stats?.draftPages}
          label={t("dash.drafts")}
          icon="create-outline"
          onPress={() => router.push(`/(tenant)/sites/${tenant.id}/pages`)}
        />
      </View>
      <View style={{ flexDirection: "row", gap: 12 }}>
        <StatCard
          loading={loading}
          value={stats?.totalLeads}
          label={t("dash.totalLeads")}
          icon="people-outline"
          onPress={() => router.push(`/(tenant)/sites/${tenant.id}/leads`)}
        />
        <StatCard
          loading={loading}
          value={stats?.newLeadsThisWeek}
          label={t("dash.newThisWeek")}
          icon="sparkles-outline"
          highlight
          onPress={() => router.push(`/(tenant)/sites/${tenant.id}/leads`)}
        />
      </View>

      {/* ---------------------------------------------------- Recent leads */}
      <SectionHeader title={t("dash.recentLeads")} />
      <Card style={{ padding: 0, gap: 0, overflow: "hidden" }}>
        {loading ? (
          <View style={{ padding: spacing.lg, gap: spacing.md }}>
            <Skeleton width="55%" height={14} />
            <Skeleton width="35%" height={11} />
          </View>
        ) : leads.length === 0 ? (
          <View style={{ paddingVertical: spacing.xl, paddingHorizontal: spacing.lg, alignItems: "center", gap: 4 }}>
            <Icon name="mail-open-outline" size={28} color={palette.textFaint} />
            <Text style={[type.bodyStrong, { color: palette.text }]}>{t("dash.noLeads")}</Text>
            <Text style={[type.caption, { color: palette.textMuted, textAlign: "center" }]}>
              {t("dash.noLeadsHint")}
            </Text>
          </View>
        ) : (
          leads.map((lead) => (
            <Row
              key={lead.id}
              leading={<Avatar text={initials(lead)} size={36} />}
              title={leadDisplayName(lead)}
              subtitle={relativeTime(lead.created_at)}
              onPress={() => router.push(`/(tenant)/sites/${tenant.id}/leads/${lead.id}`)}
            />
          ))
        )}
      </Card>
      {leads.length > 0 && (
        <Button
          title={t("dash.viewAllLeads")}
          variant="ghost"
          onPress={() => router.push(`/(tenant)/sites/${tenant.id}/leads`)}
        />
      )}

      {/* ------------------------------------------------------------ Site */}
      <SectionHeader title={t("dash.site")} />
      <Card style={{ padding: 0, gap: 0, overflow: "hidden" }}>
        <View style={{ padding: spacing.lg, gap: 6 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Icon name="globe-outline" size={16} />
            <Text style={[type.bodyStrong, { color: palette.text, flex: 1 }]} numberOfLines={1}>
              {stats?.customDomain ?? publicHost(tenant)}
            </Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm, flexWrap: "wrap" }}>
            {(stats?.customDomain ?? tenant.custom_domain) ? (
              <Badge label={humanize(stats?.domainStatus ?? tenant.domain_status)} />
            ) : (
              <Badge label={t("dash.freeSubdomain")} tone="neutral" />
            )}
            <Text style={[type.caption, { color: palette.textMuted }]}>
              {t("dash.planSuffix", { plan: humanize(stats?.plan ?? tenant.plan) })}
            </Text>
          </View>
        </View>
        <Row
          icon="⚙️"
          title={t("dash.siteSettings")}
          onPress={() => router.push(`/(tenant)/sites/${tenant.id}/settings`)}
        />
        <Row
          icon="🌐"
          title={t("dash.domain")}
          onPress={() => router.push(`/(tenant)/sites/${tenant.id}/domain`)}
        />
        <Row
          icon="💳"
          title={t("dash.billing")}
          subtitle={humanize(stats?.plan ?? tenant.plan)}
          onPress={() => router.push(`/(tenant)/sites/${tenant.id}/billing`)}
        />
        <Row
          icon="🎫"
          title={t("dash.support")}
          subtitle={t("dash.supportHint")}
          onPress={() => router.push(`/(tenant)/sites/${tenant.id}/support`)}
        />
      </Card>

      {/* ------------------------------------------------------ Restaurant */}
      {restaurantAccess && (
        <>
          <SectionHeader title={t("dash.restaurant")} />
          <Card style={{ padding: 0, gap: 0, overflow: "hidden" }}>
            <Row icon="🍳" title={t("dash.kitchen")} onPress={() => router.push(`/(tenant)/sites/${tenant.id}/restaurant/kitchen`)} />
            <Row icon="🧾" title={t("dash.pos")} onPress={() => router.push(`/(tenant)/sites/${tenant.id}/restaurant/pos`)} />
            <Row icon="🏪" title={t("dash.branches")} onPress={() => router.push(`/(tenant)/sites/${tenant.id}/restaurant/branches`)} />
            <Row icon="🏍️" title={t("dash.riders")} onPress={() => router.push(`/(tenant)/sites/${tenant.id}/restaurant/riders`)} />
            <Row icon="📅" title={t("dash.reservations")} onPress={() => router.push(`/(tenant)/sites/${tenant.id}/restaurant/reservations`)} />
            <Row icon="📊" title={t("dash.sales")} onPress={() => router.push(`/(tenant)/sites/${tenant.id}/restaurant/sales`)} />
          </Card>
        </>
      )}
    </Screen>
  );
}

/* ---------------------------------------------------------------- StatCard */

function StatCard({
  value,
  label,
  icon,
  loading,
  highlight,
  onPress,
}: {
  value: number | undefined;
  label: string;
  icon: string;
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
          <Icon name={icon} size={18} color={highlight ? palette.primary600 : palette.textFaint} />
          <Text style={[type.display, { color: highlight ? palette.primary700 : palette.text, marginTop: 2 }]}>
            {value ?? 0}
          </Text>
          <Text style={[type.caption, { color: palette.textMuted }]}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

/* ------------------------------------------------------------- QuickAction */

function QuickAction({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) {
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
          alignItems: "center",
          gap: 6,
          paddingVertical: spacing.md,
          borderRadius: radius.lg,
          backgroundColor: palette.card,
          borderWidth: 1,
          borderColor: palette.border,
          opacity: pressed ? 0.75 : 1,
        },
        shadow.card,
      ]}
    >
      <View
        style={{
          width: 38,
          height: 38,
          borderRadius: 19,
          backgroundColor: palette.primary50,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon name={icon} size={20} color={palette.primary600} />
      </View>
      <Text style={[type.label, { color: palette.text }]}>{label}</Text>
    </Pressable>
  );
}
