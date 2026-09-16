import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../lib/themeContext";
import { LanguageSwitcher } from "../../components/LanguageSwitcher";
import { useLanguage } from "../../lib/languageContext";

export default function AdminTabsLayout() {
  const { palette } = useTheme();
  const { t } = useLanguage();
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: palette.primary600 },
        headerTintColor: palette.white,
        headerTitleStyle: { fontWeight: "800" },
        headerRight: () => <LanguageSwitcher />,
        tabBarActiveTintColor: palette.primary600,
        tabBarInactiveTintColor: palette.textFaint,
        tabBarStyle: { backgroundColor: palette.bgElevated, borderTopColor: palette.border },
        sceneStyle: { backgroundColor: palette.bg },
      }}
    >
      <Tabs.Screen
        name="tenants"
        options={{
          title: t("nav.tenants"),
          // tenants/_layout.tsx is its own Stack with its own header —
          // showing the Tabs header too would stack two headers on screen.
          headerShown: false,
          tabBarIcon: ({ color, size }) => <Ionicons name="business" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t("nav.profile"),
          tabBarIcon: ({ color, size }) => <Ionicons name="person-circle" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
