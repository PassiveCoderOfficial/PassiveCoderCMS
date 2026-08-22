import { useEffect } from "react";
import { Stack, router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import * as Notifications from "expo-notifications";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider, useAuth } from "../lib/auth";
import { RoleProvider, useRole } from "../lib/role";
import { SelectedTenantProvider } from "../lib/tenant";
import { LoadingSpinner } from "../components/ui";
import { colors } from "../lib/theme";

// Keep the native splash screen up until auth/role are resolved, then fade
// it out ourselves instead of an abrupt swap to the loading spinner.
SplashScreen.preventAutoHideAsync().catch(() => {});
SplashScreen.setOptions({ duration: 400, fade: true });

/**
 * Tapping a push notification whose payload carries a deeplink (shape
 * "pcadmin://sites/{tenantId}/leads/{contactId}", matching app.json's
 * "scheme") routes straight to that lead. Registered once at the app root so
 * it fires regardless of which screen is currently mounted.
 */
function useDeeplinkNotifications() {
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((response: Notifications.NotificationResponse) => {
      const deeplink = response.notification.request.content.data?.deeplink;
      if (typeof deeplink !== "string" || !deeplink) return;

      // Strip the "pcadmin://" scheme prefix, leaving "sites/{tenantId}/leads/{contactId}".
      const path = deeplink.replace(/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//, "");
      const match = path.match(/^sites\/([^/]+)\/leads\/([^/]+)$/);
      if (!match) return;
      const [, tenantId, contactId] = match;
      router.push(`/(tenant)/sites/${tenantId}/leads/${contactId}`);
    });
    return () => sub.remove();
  }, []);
}

function Gate({ children }: { children: React.ReactNode }) {
  const { loading: authLoading } = useAuth();
  const { loading: roleLoading } = useRole();
  const ready = !authLoading && !roleLoading;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  if (!ready) return <LoadingSpinner />;
  return <>{children}</>;
}

export default function RootLayout() {
  useDeeplinkNotifications();

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <RoleProvider>
          <SelectedTenantProvider>
            <StatusBar style="light" backgroundColor={colors.primary600} />
            <Gate>
              <Stack
                screenOptions={{
                  headerStyle: { backgroundColor: colors.primary600 },
                  headerTintColor: colors.white,
                  headerTitleStyle: { fontWeight: "800" },
                  contentStyle: { backgroundColor: colors.bg },
                }}
              >
                <Stack.Screen name="index" options={{ headerShown: false }} />
                <Stack.Screen name="login" options={{ title: "Log in", headerShown: false }} />
                <Stack.Screen name="(tenant)" options={{ headerShown: false }} />
                <Stack.Screen name="(admin)" options={{ headerShown: false }} />
              </Stack>
            </Gate>
          </SelectedTenantProvider>
        </RoleProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
