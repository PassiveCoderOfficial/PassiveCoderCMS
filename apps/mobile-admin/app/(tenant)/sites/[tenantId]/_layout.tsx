import { Stack } from "expo-router";
import { colors } from "../../../../lib/theme";

// Wraps every screen for one selected tenant (pages, leads, settings,
// domain, transfer) into a single Stack segment nested under sites/_layout.
export default function TenantSiteStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.primary600 },
        headerTintColor: colors.white,
        headerTitleStyle: { fontWeight: "800" },
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
