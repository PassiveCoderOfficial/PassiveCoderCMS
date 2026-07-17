import { Stack, router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import * as Notifications from "expo-notifications";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "../lib/auth";
import { colors } from "../lib/theme";

export default function RootLayout() {
  // Tapping an urgent-request push opens the requests tab.
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((res) => {
      const data = res.notification.request.content.data as { type?: string; requestId?: string };
      if (data?.type === "blood_request") router.push("/(tabs)/requests");
    });
    return () => sub.remove();
  }, []);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="light" backgroundColor={colors.red700} />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: colors.red700 },
            headerTintColor: colors.white,
            headerTitleStyle: { fontWeight: "800" },
            contentStyle: { backgroundColor: colors.bg },
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="auth" options={{ title: "Log in" }} />
          <Stack.Screen name="donor/[id]" options={{ title: "Donor" }} />
          <Stack.Screen name="donor/edit/[id]" options={{ title: "Edit donor" }} />
          <Stack.Screen name="donor/claim/[id]" options={{ title: "Claim profile" }} />
          <Stack.Screen name="add" options={{ title: "Add Donor" }} />
          <Stack.Screen name="requests/new" options={{ title: "Post request" }} />
          <Stack.Screen name="requests/edit/[id]" options={{ title: "Edit request" }} />
        </Stack>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
