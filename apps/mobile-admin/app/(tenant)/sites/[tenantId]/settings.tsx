import { useCallback, useEffect, useState } from "react";
import { Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { getTenant, updateTenantName } from "../../../../lib/queries/tenant";
import type { Tenant } from "../../../../lib/types";
import { Button, Field, TextField } from "../../../../components/form";
import {
  Badge, Card, Divider, EmptyState, Row, Screen, SectionHeader, Skeleton,
} from "../../../../components/ui";
import { absoluteTime, humanize } from "../../../../lib/format";
import { spacing, type } from "../../../../lib/theme";
import { useTheme } from "../../../../lib/themeContext";
import { useToast } from "../../../../lib/toast";

export default function TenantSettingsScreen() {
  const { tenantId } = useLocalSearchParams<{ tenantId: string }>();
  const { palette } = useTheme();
  const { success, error: toastError } = useToast();

  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!tenantId) return;
    try {
      const t = await getTenant(tenantId);
      setTenant(t);
      setName(t.name);
      setLoadError(null);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Failed to load site");
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    load();
  }, [load]);

  async function save() {
    if (!tenantId) return;
    if (!name.trim()) {
      setNameError("Site name can't be empty.");
      return;
    }
    setNameError(null);
    setSaving(true);
    try {
      await updateTenantName(tenantId, name.trim());
      success("Site name updated");
    } catch (e) {
      toastError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <Screen>
        <Card style={{ gap: spacing.md }}>
          <Skeleton width="40%" height={12} />
          <Skeleton width="65%" height={16} />
        </Card>
        <Card style={{ gap: spacing.md }}>
          <Skeleton width="30%" height={12} />
          <Skeleton height={40} />
        </Card>
      </Screen>
    );
  }

  if (!tenant) {
    return (
      <Screen>
        <EmptyState
          title="Site not found"
          subtitle={loadError ?? "This site may no longer exist."}
          icon="⚠️"
          action={{
            label: "Retry",
            onPress: () => {
              setLoading(true);
              load();
            },
          }}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      {/* ----------------------------------------------------------- Site */}
      <SectionHeader title="Site" />
      <Card style={{ gap: 14 }}>
        <Field
          label="Site name"
          required
          hint="Shown in the dashboard and anywhere the site is listed. Doesn't change the URL."
          error={nameError ?? undefined}
        >
          <TextField
            value={name}
            onChangeText={(t) => {
              setName(t);
              if (nameError) setNameError(null);
            }}
          />
        </Field>
        <Field label="Slug" hint="The site's permanent identifier. Contact support to change it.">
          <Text style={[type.body, { color: palette.textMuted }]}>/{tenant.slug}</Text>
        </Field>
        <Button title="Save changes" onPress={save} loading={saving} />
      </Card>

      {/* ----------------------------------------------------------- Plan */}
      <SectionHeader title="Plan" />
      <Card style={{ padding: 0, gap: 0, overflow: "hidden" }}>
        <Row title="Plan" right={<Text style={[type.bodyStrong, { color: palette.text }]}>{humanize(tenant.plan)}</Text>} />
        <Divider inset />
        <Row title="Status" right={<Badge label={tenant.status} />} />
        {tenant.trial_ends_at ? (
          <>
            <Divider inset />
            <Row
              title="Trial ends"
              right={
                <Text style={[type.body, { color: palette.textMuted }]}>
                  {absoluteTime(tenant.trial_ends_at)}
                </Text>
              }
            />
          </>
        ) : null}
        <Divider inset />
        <Row
          icon="🌐"
          title="Domain"
          subtitle={tenant.custom_domain ?? "No custom domain"}
          right={<Badge label={humanize(tenant.domain_status)} />}
          onPress={() => router.push(`/(tenant)/sites/${tenantId}/domain`)}
        />
      </Card>

      {/* --------------------------------------------------- Danger zone */}
      <SectionHeader title="Danger zone" />
      <Card style={{ padding: 0, gap: 0, overflow: "hidden", borderColor: palette.red50 }}>
        <Row
          icon="🔑"
          title="Transfer ownership"
          subtitle="Hand this site to a different account. This cannot be undone from the app."
          danger
          onPress={() => router.push(`/(tenant)/sites/${tenantId}/transfer`)}
        />
      </Card>
      <View style={{ height: spacing.lg }} />
    </Screen>
  );
}
