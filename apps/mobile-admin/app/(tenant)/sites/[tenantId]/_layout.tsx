import { Stack } from "expo-router";
import { useTheme } from "../../../../lib/themeContext";

// Wraps every screen for one selected tenant (pages, leads, settings,
// domain, transfer) into a single Stack segment nested under sites/_layout.
export default function TenantSiteStackLayout() {
  const { palette } = useTheme();
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: palette.primary600 },
        headerTintColor: palette.white,
        headerTitleStyle: { fontWeight: "800" },
        contentStyle: { backgroundColor: palette.bg },
      }}
    >
      <Stack.Screen name="pages/index" options={{ title: "Pages" }} />
      <Stack.Screen name="pages/[pageId]" options={{ title: "Page" }} />
      <Stack.Screen name="leads/index" options={{ title: "Leads" }} />
      <Stack.Screen name="leads/[contactId]" options={{ title: "Lead" }} />
      <Stack.Screen name="settings" options={{ title: "Settings" }} />
      <Stack.Screen name="domain" options={{ title: "Domain" }} />
      <Stack.Screen name="transfer" options={{ title: "Transfer ownership" }} />
    </Stack>
  );
}
