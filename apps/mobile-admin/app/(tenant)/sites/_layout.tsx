import { Stack } from "expo-router";
import { useTheme } from "../../../lib/themeContext";
import { LanguageSwitcher } from "../../../components/LanguageSwitcher";
import { useLanguage } from "../../../lib/languageContext";

// Wraps the sites picker (index.tsx) and every [tenantId]/... screen into
// one Stack so the parent Tabs layout shows a single "Sites" tab instead of
// one tab per nested file (pages, leads, settings, domain, transfer, ...).
export default function SitesStackLayout() {
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
      <Stack.Screen name="index" options={{ title: t("nav.sites") }} />
      {/* Without this, Expo Router briefly shows the raw segment name
          ("[tenantId]") as the header title during the transition into the
          nested stack below, before that stack's own per-screen title takes
          over — headerShown:false hides that flash entirely since the
          nested layout (sites/[tenantId]/_layout.tsx) renders its own
          header immediately. */}
      <Stack.Screen name="[tenantId]" options={{ headerShown: false }} />
    </Stack>
  );
}
