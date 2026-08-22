import { Stack } from "expo-router";
import { colors } from "../../../lib/theme";

// Wraps index.tsx (list) + [tenantId].tsx (detail) into one Stack so the
// parent Tabs layout shows a single "Tenants" tab, not one per file.
export default function TenantsStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.primary600 },
        headerTintColor: colors.white,
        headerTitleStyle: { fontWeight: "800" },
      }}
    >
      <Stack.Screen name="index" options={{ title: "Tenants" }} />
      <Stack.Screen name="[tenantId]" options={{ title: "Site" }} />
    </Stack>
  );
}
