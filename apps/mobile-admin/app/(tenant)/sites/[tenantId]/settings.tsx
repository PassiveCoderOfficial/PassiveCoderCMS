import { useCallback, useEffect, useState } from "react";
import { Text, View } from "react-native";
import { useLanguage } from "../../../../lib/languageContext";
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
  const { t } = useLanguage();
  const { success, error: toastError } = useToast();

  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!tenantId) {
      setLoading(false);
      return;
    }
    try {
      const t = await getTenant(tenantId);
      setTenant(t);
      setName(t.name);
      setLoadError(null);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : t("settings.loadFailed"));
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
      setNameError(t("settings.nameEmpty"));
      return;
    }
    setNameError(null);
    setSaving(true);
    try {
      await updateTenantName(tenantId, name.trim());
      success(t("settings.nameUpdated"));
    } catch (e) {
      toastError(e instanceof Error ? e.message : t("settings.saveFailed"));
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
          title={t("settings.notFound")}
          subtitle={loadError ?? t("settings.maybeGone")}
          icon="⚠️"
          action={{
            label: t("common.retry"),
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
      <SectionHeader title={t("settings.site")} />
      <Card style={{ gap: 14 }}>
        <Field
          label={t("settings.siteName")}
          required
          hint={t("settings.siteNameHint")}
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
        <Field label={t("settings.slug")} hint={t("settings.slugHint")}>
          <Text style={[type.body, { color: palette.textMuted }]}>/{tenant.slug}</Text>
        </Field>
        <Button title={t("settings.saveChanges")} onPress={save} loading={saving} />
      </Card>

      {/* ----------------------------------------------------------- Plan */}
      <SectionHeader title={t("settings.plan")} />
      <Card style={{ padding: 0, gap: 0, overflow: "hidden" }}>
        <Row title={t("settings.plan")} right={<Text style={[type.bodyStrong, { color: palette.text }]}>{humanize(tenant.plan)}</Text>} />
        <Divider inset />
        <Row title={t("settings.status")} right={<Badge label={tenant.status} />} />
        {tenant.trial_ends_at ? (
          <>
            <Divider inset />
            <Row
              title={t("settings.trialEnds")}
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
          title={t("settings.domain")}
          subtitle={tenant.custom_domain ?? t("settings.noCustomDomain")}
          right={<Badge label={humanize(tenant.domain_status)} />}
          onPress={() => router.push(`/(tenant)/sites/${tenantId}/domain`)}
        />
      </Card>

      {/* --------------------------------------------------- Danger zone */}
      <SectionHeader title={t("settings.danger")} />
      <Card style={{ padding: 0, gap: 0, overflow: "hidden", borderColor: palette.red50 }}>
        <Row
          icon="🔑"
          title={t("settings.transfer")}
          subtitle={t("settings.transferHint")}
          danger
          onPress={() => router.push(`/(tenant)/sites/${tenantId}/transfer`)}
        />
      </Card>
      <View style={{ height: spacing.lg }} />
    </Screen>
  );
}
