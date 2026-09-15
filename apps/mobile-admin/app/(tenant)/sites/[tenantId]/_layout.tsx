import { Stack, useLocalSearchParams } from "expo-router";
import { useTheme } from "../../../../lib/themeContext";
import { useRole } from "../../../../lib/role";
import { TenantHeaderTitle } from "../../../../components/TenantSwitcher";

// Wraps every screen for one selected tenant (pages, leads, settings,
// domain, transfer) into a single Stack segment nested under sites/_layout.
export default function TenantSiteStackLayout() {
  const { palette } = useTheme();
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
        headerStyle: { backgroundColor: palette.primary600 },
        headerTintColor: palette.white,
        headerTitleStyle: { fontWeight: "800" },
        contentStyle: { backgroundColor: palette.bg },
      }}
    >
      <Stack.Screen name="pages/index" options={titled("Pages")} />
      <Stack.Screen name="pages/[pageId]" options={{ title: "Page" }} />
      <Stack.Screen name="leads/index" options={titled("Leads")} />
      <Stack.Screen name="leads/[contactId]" options={{ title: "Lead" }} />
      <Stack.Screen name="settings" options={titled("Settings")} />
      <Stack.Screen name="billing" options={titled("Billing")} />
      <Stack.Screen name="support" options={titled("Support")} />
      <Stack.Screen name="domain" options={titled("Domain")} />
      <Stack.Screen name="transfer" options={{ title: "Transfer ownership" }} />
      <Stack.Screen name="restaurant" options={{ headerShown: false }} />
    </Stack>
  );
}
