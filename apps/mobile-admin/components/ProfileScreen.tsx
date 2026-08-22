// Shared profile UI for both the tenant and admin tabs. The two differ only
// in whether a membership list is shown, so the appearance control, sign-out
// and version footer live here once rather than drifting apart in two files.

import { Alert, Text, View } from "react-native";
import Constants from "expo-constants";
import { useAuth } from "../lib/auth";
import { useRole } from "../lib/role";
import { useSelectedTenant } from "../lib/tenant";
import { Avatar, Badge, Card, Pill, Row, Screen, SectionHeader, Tag } from "./ui";
import { Button } from "./form";
import { spacing, type } from "../lib/theme";
import { useTheme, type ThemePreference } from "../lib/themeContext";
import { useToast } from "../lib/toast";
import { tapFeedback, warningFeedback } from "../lib/haptics";

const ROLE_LABEL: Record<string, string> = {
  super_admin: "Super Admin",
  pc_staff: "Passive Coder Staff",
  tenant: "Site member",
};

const APPEARANCE_OPTIONS: { label: string; value: ThemePreference }[] = [
  { label: "System", value: "system" },
  { label: "Light", value: "light" },
  { label: "Dark", value: "dark" },
];

export function ProfileScreen({ showMemberships }: { showMemberships: boolean }) {
  const { user, logout } = useAuth();
  const { role, isManager, memberships } = useRole();
  const { selectedTenantId, setSelectedTenantId } = useSelectedTenant();
  const { palette, preference, setPreference } = useTheme();
  const toast = useToast();

  const email = user?.email ?? "";
  const roleLabel = (role ? ROLE_LABEL[role] : undefined) ?? "Member";
  const version = Constants.expoConfig?.version;

  function confirmLogout() {
    warningFeedback();
    Alert.alert("Log out?", "You'll need to sign in again to manage your sites.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log out",
        style: "destructive",
        onPress: () => {
          logout().catch(() => toast.error("Couldn't log out — try again"));
        },
      },
    ]);
  }

  return (
    <Screen>
      <Card style={{ alignItems: "center", gap: spacing.sm, paddingVertical: spacing.xl }}>
        <Avatar text={email.slice(0, 2).toUpperCase() || "?"} size={64} />
        <Text style={[type.heading, { color: palette.text, textAlign: "center" }]} numberOfLines={1}>
          {email || "Signed in"}
        </Text>
        <View style={{ flexDirection: "row", gap: spacing.sm, flexWrap: "wrap", justifyContent: "center" }}>
          <Badge label={roleLabel} tone="brand" />
          {isManager && <Tag label="Manager" />}
        </View>
      </Card>

      <SectionHeader title="Appearance" />
      <Card style={{ gap: spacing.md }}>
        <Text style={[type.caption, { color: palette.textMuted }]}>
          System follows your device's light or dark setting.
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
          <SectionHeader title="Your sites" />
          <Card style={{ padding: 0, gap: 0, overflow: "hidden" }}>
            {memberships.length === 0 ? (
              <View style={{ padding: spacing.lg }}>
                <Text style={[type.caption, { color: palette.textMuted }]}>No site memberships.</Text>
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
                        <Text style={{ color: palette.primary600, fontSize: 16 }}>✓</Text>
                      )}
                    </View>
                  }
                  onPress={() => {
                    setSelectedTenantId(m.tenantId);
                    toast.success(`Switched to ${m.tenant.name}`);
                  }}
                />
              ))
            )}
          </Card>
        </>
      )}

      <Button title="Log out" variant="danger" onPress={confirmLogout} />

      {!!version && (
        <Text style={[type.caption, { color: palette.textFaint, textAlign: "center" }]}>
          Passive Coder Admin v{version}
        </Text>
      )}
    </Screen>
  );
}
