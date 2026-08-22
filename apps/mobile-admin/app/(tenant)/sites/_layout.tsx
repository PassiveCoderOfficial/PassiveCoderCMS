import { Stack } from "expo-router";
import { colors } from "../../../lib/theme";

// Wraps the sites picker (index.tsx) and every [tenantId]/... screen into
// one Stack so the parent Tabs layout shows a single "Sites" tab instead of
// one tab per nested file (pages, leads, settings, domain, transfer, ...).
export default function SitesStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.primary600 },
        headerTintColor: colors.white,
        headerTitleStyle: { fontWeight: "800" },
      }}
    >
      <Stack.Screen name="index" options={{ title: "Sites" }} />
    </Stack>
  );
}
