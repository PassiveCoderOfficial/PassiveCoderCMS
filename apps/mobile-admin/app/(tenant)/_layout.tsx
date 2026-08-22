// Tabs shown once a tenant is resolved (exactly one membership, or a
// multi-membership user who has picked one via the sites picker). The
// picker screen itself (sites/index.tsx) intercepts and renders its own UI
// before these tabs are reached when there are multiple unselected
// memberships — this layout doesn't gate on that, it just always renders
// the tab bar, since dashboard/sites/profile are all safe destinations
// regardless of selection state.

import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../lib/themeContext";

export default function TenantTabsLayout() {
  const { palette } = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: palette.primary600 },
        headerTintColor: palette.white,
        headerTitleStyle: { fontWeight: "800" },
        tabBarActiveTintColor: palette.primary600,
        tabBarInactiveTintColor: palette.textFaint,
        tabBarStyle: { backgroundColor: palette.bgElevated, borderTopColor: palette.border },
        sceneStyle: { backgroundColor: palette.bg },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="sites"
        options={{
          title: "Sites",
          // sites/_layout.tsx is its own Stack with its own header — showing
          // the Tabs header too would stack two headers on screen.
          headerShown: false,
          tabBarIcon: ({ color, size }) => <Ionicons name="globe" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => <Ionicons name="person-circle" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
