import { Stack } from "expo-router";
import { useTheme } from "../../../lib/themeContext";

// Wraps the sites picker (index.tsx) and every [tenantId]/... screen into
// one Stack so the parent Tabs layout shows a single "Sites" tab instead of
// one tab per nested file (pages, leads, settings, domain, transfer, ...).
export default function SitesStackLayout() {
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
      <Stack.Screen name="index" options={{ title: "Sites" }} />
    </Stack>
  );
}
