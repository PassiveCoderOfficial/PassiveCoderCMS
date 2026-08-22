import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../lib/themeContext";

export default function AdminTabsLayout() {
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
        name="tenants"
        options={{
          title: "Tenants",
          // tenants/_layout.tsx is its own Stack with its own header —
          // showing the Tabs header too would stack two headers on screen.
          headerShown: false,
          tabBarIcon: ({ color, size }) => <Ionicons name="business" size={size} color={color} />,
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
