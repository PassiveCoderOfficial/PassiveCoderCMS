import { Stack, useLocalSearchParams } from "expo-router";
import { useTheme } from "../../../../lib/themeContext";
import { useLanguage } from "../../../../lib/languageContext";
import { useRole } from "../../../../lib/role";
import { TenantHeaderTitle } from "../../../../components/TenantSwitcher";

// Wraps every screen for one selected tenant (pages, leads, settings,
// domain, transfer) into a single Stack segment nested under sites/_layout.
export default function TenantSiteStackLayout() {
  const { palette } = useTheme();
  const { t } = useLanguage();
  const { tenantId } = useLocalSearchParams<{ tenantId: string }>();
  const { memberships } = useRole();
  const siteName = memberships.find((m) => m.tenantId === tenantId)?.tenant.name;

  // Each screen supplies its own headerTitle so the switcher's top line
  // (the actual "where am I" context — Pages/Leads/Settings/...) stays
  // correct per screen while the site-name row underneath is shared.
  const titled = (title: string) => ({
    title,
    headerTitle: () => <TenantHeaderTitle title={title} siteName={siteName} />,
  });

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: palette.header },
        headerTintColor: palette.white,
        headerTitleStyle: { fontWeight: "800" },
        contentStyle: { backgroundColor: palette.bg },
      }}
    >
      <Stack.Screen name="pages/index" options={titled(t("screen.pages"))} />
      {/* The page editor has its own inner Stack with its own header; showing
          this one too stacked two app bars ("Page" over "Blocks"). */}
      <Stack.Screen name="pages/[pageId]" options={{ title: t("screen.page"), headerShown: false }} />
      <Stack.Screen name="leads/index" options={titled(t("screen.leads"))} />
      <Stack.Screen name="leads/[contactId]" options={{ title: t("screen.lead") }} />
      <Stack.Screen name="settings" options={titled(t("screen.settings"))} />
      <Stack.Screen name="billing" options={titled(t("screen.billing"))} />
      <Stack.Screen name="support" options={titled(t("screen.support"))} />
      <Stack.Screen name="domain" options={titled(t("screen.domain"))} />
      <Stack.Screen name="transfer" options={{ title: t("screen.transfer") }} />
      <Stack.Screen name="restaurant" options={{ headerShown: false }} />
    </Stack>
  );
}
