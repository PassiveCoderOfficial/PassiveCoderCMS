import { Stack } from "expo-router";
import { useTheme } from "../../../../../lib/themeContext";
import { useLanguage } from "../../../../../lib/languageContext";

// Restaurant vertical screens for one tenant, nested under sites/[tenantId].
// Only ever reached from the dashboard's Restaurant section, which itself
// only renders for a tenant with real access (hasRestaurantAccess) — no
// extra guard needed here, same trust boundary as the parent sites stack.
export default function RestaurantStackLayout() {
  const { palette } = useTheme();
  const { t } = useLanguage();
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: palette.header },
        headerTintColor: palette.white,
        headerTitleStyle: { fontWeight: "800" },
        contentStyle: { backgroundColor: palette.bg },
      }}
    >
      <Stack.Screen name="kitchen" options={{ title: t("dash.kitchen") }} />
      <Stack.Screen name="pos" options={{ title: t("dash.pos") }} />
      <Stack.Screen name="branches" options={{ title: t("dash.branches") }} />
      <Stack.Screen name="tables" options={{ title: t("rest.tables") }} />
      <Stack.Screen name="riders" options={{ title: t("dash.riders") }} />
      <Stack.Screen name="reservations" options={{ title: t("dash.reservations") }} />
      <Stack.Screen name="sales" options={{ title: t("dash.sales") }} />
    </Stack>
  );
}
