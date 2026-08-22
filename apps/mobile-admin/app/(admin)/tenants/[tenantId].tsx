// Tenant detail for super_admin / pc_staff. Deliberately does NOT duplicate
// the pages/leads/settings/domain screens — "Manage as this tenant" routes
// into the same (tenant)/sites/[tenantId]/... tree tenant owners use.

import { useCallback, useEffect, useState } from "react";
import { Alert, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import {
  listAllTenants,
  suspendTenant,
  activateTenant,
  type AdminTenantListItem,
} from "../../../lib/queries/admin";
import { Button } from "../../../components/form";
import {
  Badge,
  Card,
  EmptyState,
  Row,
  Screen,
  SectionHeader,
  Skeleton,
  type BadgeTone,
} from "../../../components/ui";
import { absoluteTime, humanize } from "../../../lib/format";
import { radius, spacing, type } from "../../../lib/theme";
import { useTheme } from "../../../lib/themeContext";
import { useToast } from "../../../lib/toast";
import { warningFeedback } from "../../../lib/haptics";

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

function domainTone(status: string): BadgeTone {
  if (status === "active") return "success";
  if (status === "pending" || status === "pending_dns") return "warning";
  if (status === "failed") return "danger";
  return "neutral";
}

export default function AdminTenantDetailScreen() {
  const { tenantId } = useLocalSearchParams<{ tenantId: string }>();
  const { palette } = useTheme();
  const toast = useToast();

  const [tenant, setTenant] = useState<AdminTenantListItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // No GET /api/super-admin/sites/[id] single-tenant route exists — reuse
  // the list endpoint and find by id, same data the list screen already has.
  const load = useCallback(async () => {
    if (!tenantId) {
      setError("No site selected");
      setLoading(false);
      return;
    }
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
      toast.error(result.error ?? "Action failed");
      setError(result.error ?? "Action failed");
      return;
    }
    toast.success(suspending ? "Site suspended" : "Site activated");
    await load();
  }

  function confirmToggleStatus() {
    if (!tenant) return;
    const suspending = tenant.status !== "suspended";
    warningFeedback();
    Alert.alert(
      suspending ? "Suspend site?" : "Activate site?",
      suspending
        ? "This will suspend the site. It may become inaccessible to its owner."
        : "This will reactivate the site.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: suspending ? "Suspend" : "Activate",
          style: suspending ? "destructive" : "default",
          onPress: onToggleStatus,
        },
      ]
    );
  }

  if (loading) {
    return (
      <Screen>
        <Skeleton height={110} radius={radius.lg} />
        <Skeleton height={180} radius={radius.lg} />
        <Skeleton height={120} radius={radius.lg} />
      </Screen>
    );
  }

  if (!tenant) {
    return (
      <Screen>
        <EmptyState
          title="Couldn't load this site"
          subtitle={error ?? "Site not found"}
          icon="⚠️"
          action={{
            label: "Try again",
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

  const suspended = tenant.status === "suspended";

  return (
    <Screen>
      {/* ---------------------------------------------------------- Header */}
      <Card style={{ gap: spacing.sm }}>
        <Text style={[type.title, { color: palette.text }]}>{tenant.name}</Text>
        <Text style={[type.caption, { color: palette.textMuted }]}>{tenant.slug}</Text>
        <View style={{ flexDirection: "row", gap: spacing.sm, flexWrap: "wrap" }}>
          <Badge label={humanize(tenant.status)} tone={statusTone(tenant.status)} />
          {tenant.deletion_requested_at ? <Badge label="Deletion requested" tone="danger" /> : null}
        </View>
      </Card>

      {/* -------------------------------------------------------- Metadata */}
      <SectionHeader title="Details" />
      <Card style={{ padding: 0, gap: 0, overflow: "hidden" }}>
        <Row
          icon="🌐"
          title={tenant.custom_domain ?? "No custom domain"}
          subtitle="Custom domain"
        />
        <Row
          icon="🔌"
          title="Domain status"
          right={
            <Badge label={humanize(tenant.domain_status)} tone={domainTone(tenant.domain_status)} />
          }
        />
        <Row icon="📅" title={absoluteTime(tenant.created_at)} subtitle="Created" />
        <Row
          icon={tenant.onboarding_completed ? "✅" : "⏳"}
          title={tenant.onboarding_completed ? "Completed" : "Not completed"}
          subtitle="Onboarding"
        />
      </Card>

      {/* --------------------------------------------------------- Actions */}
      <SectionHeader title="Actions" />
      <Card style={{ gap: spacing.md }}>
        <Button
          title="Manage as this tenant"
          icon="🛠"
          onPress={() => router.push(`/(tenant)/sites/${tenant.id}/pages`)}
        />
        <Button
          title="Transfer ownership"
          variant="outline"
          onPress={() => router.push(`/(tenant)/sites/${tenant.id}/transfer`)}
        />
      </Card>

      {/* ----------------------------------------------------- Danger zone */}
      <SectionHeader title="Danger zone" />
      <Card style={{ gap: spacing.md, borderColor: palette.red600 }}>
        <Text style={[type.caption, { color: palette.textMuted }]}>
          {suspended
            ? "This site is suspended. Reactivating restores access for its owner."
            : "Suspending takes the site away from its owner until it's reactivated."}
        </Text>
        <Button
          title={suspended ? "Activate site" : "Suspend site"}
          variant={suspended ? "primary" : "danger"}
          onPress={confirmToggleStatus}
          loading={busy}
        />
      </Card>
    </Screen>
  );
}
