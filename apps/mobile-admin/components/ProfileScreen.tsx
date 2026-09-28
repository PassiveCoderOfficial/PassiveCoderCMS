// Shared profile UI for both the tenant and admin tabs. The two differ only
// in whether a membership list is shown, so the appearance control, sign-out
// and version footer live here once rather than drifting apart in two files.

import { Alert, Linking, Platform, Text, View } from "react-native";
import Constants from "expo-constants";
import { useAuth } from "../lib/auth";
import { useRole } from "../lib/role";
import { useSelectedTenant } from "../lib/tenant";
import { Avatar, Badge, Card, Pill, Row, Screen, SectionHeader, Tag } from "./ui";
import { Button } from "./form";
import { spacing, type } from "../lib/theme";
import { useTheme, type ThemePreference } from "../lib/themeContext";
import { useLanguage } from "../lib/languageContext";
import { useToast } from "../lib/toast";
import { tapFeedback, warningFeedback } from "../lib/haptics";
import { Icon } from "./Icon";

/** Passive Coder support line (same number the web sidebar uses). */
const SUPPORT_WHATSAPP = "8801678669699";

const ROLE_KEY = {
  super_admin: "profile.roleSuperAdmin",
  pc_staff: "profile.roleStaff",
  tenant: "profile.roleMember",
} as const;

export function ProfileScreen({ showMemberships }: { showMemberships: boolean }) {
  const { user, logout } = useAuth();
  const { role, isManager, memberships } = useRole();
  const { selectedTenantId, setSelectedTenantId } = useSelectedTenant();
  const { palette, preference, setPreference } = useTheme();
  const { t } = useLanguage();
  const toast = useToast();

  const APPEARANCE_OPTIONS: { label: string; value: ThemePreference }[] = [
    { label: t("profile.system"), value: "system" },
    { label: t("profile.light"), value: "light" },
    { label: t("profile.dark"), value: "dark" },
  ];

  const email = user?.email ?? "";
  const roleLabel = t(role ? ROLE_KEY[role] : "profile.roleMember");
  const version = Constants.expoConfig?.version;

  function confirmLogout() {
    warningFeedback();
    const doLogout = () => logout().catch(() => toast.error(t("profile.logoutFailed")));
    // Alert.alert is a no-op on react-native-web, which left the web preview
    // with a logout button that did nothing.
    if (Platform.OS === "web") {
      if (typeof window !== "undefined" && window.confirm(`${t("profile.logoutConfirm")} ${t("profile.logoutHint")}`)) doLogout();
      return;
    }
    Alert.alert(t("profile.logoutConfirm"), t("profile.logoutHint"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("profile.logOut"),
        style: "destructive",
        onPress: () => {
          logout().catch(() => toast.error(t("profile.logoutFailed")));
        },
      },
    ]);
  }

  return (
    <Screen>
      <Card style={{ alignItems: "center", gap: spacing.sm, paddingVertical: spacing.xl }}>
        <Avatar text={email.slice(0, 2).toUpperCase() || "?"} size={64} />
        <Text style={[type.heading, { color: palette.text, textAlign: "center" }]} numberOfLines={1}>
          {email || t("profile.signedIn")}
        </Text>
        <View style={{ flexDirection: "row", gap: spacing.sm, flexWrap: "wrap", justifyContent: "center" }}>
          <Badge label={roleLabel} tone="brand" />
          {isManager && <Tag label={t("profile.manager")} />}
        </View>
      </Card>

      <SectionHeader title={t("profile.appearance")} />
      <Card style={{ gap: spacing.md }}>
        <Text style={[type.caption, { color: palette.textMuted }]}>
          {t("profile.systemHint")}
        </Text>
        <View style={{ flexDirection: "row", gap: spacing.sm }}>
          {APPEARANCE_OPTIONS.map((opt) => (
            <Pill
              key={opt.value}
              label={opt.label}
              selected={preference === opt.value}
              onPress={() => {
                tapFeedback();
                setPreference(opt.value);
              }}
            />
          ))}
        </View>
      </Card>

      {showMemberships && (
        <>
          <SectionHeader title={t("profile.yourSites")} />
          <Card style={{ padding: 0, gap: 0, overflow: "hidden" }}>
            {memberships.length === 0 ? (
              <View style={{ padding: spacing.lg }}>
                <Text style={[type.caption, { color: palette.textMuted }]}>{t("profile.noMemberships")}</Text>
              </View>
            ) : (
              memberships.map((m) => (
                <Row
                  key={m.tenantId}
                  title={m.tenant.name}
                  subtitle={m.tenant.slug}
                  right={
                    <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
                      <Tag label={m.role} />
                      {m.tenantId === selectedTenantId && (
                        <Icon name="checkmark-circle" size={20} color={palette.primary600} />
                      )}
                    </View>
                  }
                  onPress={() => {
                    setSelectedTenantId(m.tenantId);
                    toast.success(t("profile.switchedTo", { name: m.tenant.name }));
                  }}
                />
              ))
            )}
          </Card>
        </>
      )}

      <SectionHeader title={t("profile.help")} />
      <Card style={{ padding: 0, gap: 0, overflow: "hidden" }}>
        <Row
          icon="logo-whatsapp"
          title={t("profile.chatUs")}
          subtitle={t("profile.chatUsHint")}
          onPress={() => Linking.openURL(`https://wa.me/${SUPPORT_WHATSAPP}`)}
        />
      </Card>

      <Button title={t("profile.logOut")} icon="log-out-outline" variant="outline" onPress={confirmLogout} style={{ marginTop: spacing.sm }} />

      {!!version && (
        <Text style={[type.caption, { color: palette.textFaint, textAlign: "center" }]}>
          Passive Coder Admin v{version}
        </Text>
      )}
    </Screen>
  );
}
