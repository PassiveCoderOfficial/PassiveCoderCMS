import { Stack } from "expo-router";
import { useTheme } from "../../../../../lib/themeContext";

// Restaurant vertical screens for one tenant, nested under sites/[tenantId].
// Only ever reached from the dashboard's Restaurant section, which itself
// only renders for a tenant with real access (hasRestaurantAccess) — no
// extra guard needed here, same trust boundary as the parent sites stack.
export default function RestaurantStackLayout() {
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
      <Stack.Screen name="kitchen" options={{ title: "Kitchen" }} />
      <Stack.Screen name="pos" options={{ title: "POS" }} />
      <Stack.Screen name="branches" options={{ title: "Branches" }} />
      <Stack.Screen name="tables" options={{ title: "Tables" }} />
      <Stack.Screen name="riders" options={{ title: "Riders" }} />
      <Stack.Screen name="reservations" options={{ title: "Reservations" }} />
      <Stack.Screen name="sales" options={{ title: "Sales" }} />
    </Stack>
  );
}
