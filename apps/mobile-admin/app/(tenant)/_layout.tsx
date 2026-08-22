// Tabs shown once a tenant is resolved (exactly one membership, or a
// multi-membership user who has picked one via the sites picker). The
// picker screen itself (sites/index.tsx) intercepts and renders its own UI
// before these tabs are reached when there are multiple unselected
// memberships — this layout doesn't gate on that, it just always renders
// the tab bar, since dashboard/sites/profile are all safe destinations
// regardless of selection state.

import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../lib/theme";

export default function TenantTabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.primary600 },
        headerTintColor: colors.white,
        headerTitleStyle: { fontWeight: "800" },
        tabBarActiveTintColor: colors.primary600,
        tabBarInactiveTintColor: colors.textFaint,
        tabBarStyle: { backgroundColor: colors.white, borderTopColor: colors.border },
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
