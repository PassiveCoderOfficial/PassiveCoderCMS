import { Stack } from "expo-router";
import { useTheme } from "../../../lib/themeContext";
import { LanguageSwitcher } from "../../../components/LanguageSwitcher";
import { useLanguage } from "../../../lib/languageContext";

// Wraps index.tsx (list) + [tenantId].tsx (detail) into one Stack so the
// parent Tabs layout shows a single "Tenants" tab, not one per file.
export default function TenantsStackLayout() {
  const { palette } = useTheme();
  const { t } = useLanguage();
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: palette.primary600 },
        headerTintColor: palette.white,
        headerTitleStyle: { fontWeight: "800" },
        headerRight: () => <LanguageSwitcher />,
        contentStyle: { backgroundColor: palette.bg },
      }}
    >
      <Stack.Screen name="index" options={{ title: t("nav.tenants") }} />
      <Stack.Screen name="[tenantId]" options={{ title: "Site" }} />
    </Stack>
  );
}
