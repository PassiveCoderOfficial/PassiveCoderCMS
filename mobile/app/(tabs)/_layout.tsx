import { Tabs } from "expo-router";
import { Image, Linking, Pressable, StyleSheet, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../lib/theme";

function PoweredByBadge() {
  return (
    <Pressable
      onPress={() => Linking.openURL("https://passivecoder.com")}
      style={styles.badge}
    >
      <Text style={styles.badgeLabel}>powered by</Text>
      <Image
        source={{ uri: "https://mljchiaabgvdzdsfobxs.supabase.co/storage/v1/object/public/media/uploads/1777257556858_Passive_Coder_Web_logo.png" }}
        style={styles.badgeLogo}
        resizeMode="contain"
      />
    </Pressable>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.red700 },
        headerTintColor: colors.white,
        headerTitleStyle: { fontWeight: "800" },
        headerRight: () => <PoweredByBadge />,
        tabBarActiveTintColor: colors.red600,
        tabBarInactiveTintColor: colors.textFaint,
        tabBarStyle: { backgroundColor: colors.white, borderTopColor: colors.border },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Blood Donors BD",
          tabBarLabel: "Donors",
          tabBarIcon: ({ color, size }) => <Ionicons name="water" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="requests"
        options={{
          title: "Urgent Requests",
          tabBarLabel: "Requests",
          tabBarIcon: ({ color, size }) => <Ionicons name="alert-circle" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="me"
        options={{
          title: "My Account",
          tabBarLabel: "Account",
          tabBarIcon: ({ color, size }) => <Ionicons name="person-circle" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginRight: 14,
    paddingLeft: 8,
    borderLeftWidth: 1,
    borderLeftColor: "rgba(255,255,255,0.3)",
  },
  badgeLabel: { color: "rgba(255,255,255,0.8)", fontSize: 9 },
  badgeLogo: { width: 44, height: 20, backgroundColor: colors.white, borderRadius: 4, paddingHorizontal: 2 },
});
