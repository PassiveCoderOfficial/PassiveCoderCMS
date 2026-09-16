import { useEffect } from "react";
import { Stack, router, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import * as Notifications from "expo-notifications";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider, useAuth } from "../lib/auth";
import { RoleProvider, useRole } from "../lib/role";
import { SelectedTenantProvider } from "../lib/tenant";
import { LoadingSpinner } from "../components/ui";
import { ThemeProvider, useTheme } from "../lib/themeContext";
import { LanguageProvider } from "../lib/languageContext";
import { ToastProvider } from "../lib/toast";

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
  const { user, loading: authLoading } = useAuth();
  const { loading: roleLoading } = useRole();
  const ready = !authLoading && !roleLoading;
  const segments = useSegments();

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  // index.tsx only runs its redirect logic while mounted — logging out from
  // deep inside (admin)/(tenant) doesn't re-mount it, so nothing sends the
  // user back to /login on its own. Force it here, at the root, whenever
  // auth resolves to signed-out after the initial load.
  //
  // /onboard is the one route a signed-out visitor is allowed to be on —
  // it has its own signup step (mirroring web's AuthGate). Without this
  // exception, a brand-new visitor tapping "Create a site" from /login
  // would be bounced straight back to /login by this same effect before
  // they could ever sign up.
  useEffect(() => {
    if (!ready || user) return;
    if (segments[0] === "onboard") return;
    router.replace("/login");
  }, [ready, user, segments]);

  if (!ready) return <LoadingSpinner />;
  return <>{children}</>;
}

// The Stack and StatusBar need useTheme(), which is only available *inside*
// ThemeProvider — hence this inner component rather than inlining them in
// RootLayout.
function ThemedRoot() {
  const { palette } = useTheme();

  return (
    <>
      {/* The header stays brand orange in both schemes, and orange is dark
          enough that light status-bar text is the legible choice either way. */}
      <StatusBar style="light" backgroundColor={palette.primary600} />
      <Gate>
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: palette.primary600 },
            headerTintColor: palette.white,
            headerTitleStyle: { fontWeight: "800" },
            contentStyle: { backgroundColor: palette.bg },
          }}
        >
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="login" options={{ title: "Log in", headerShown: false }} />
          <Stack.Screen name="onboard" options={{ headerShown: false }} />
          <Stack.Screen name="(tenant)" options={{ headerShown: false }} />
          <Stack.Screen name="(admin)" options={{ headerShown: false }} />
        </Stack>
      </Gate>
    </>
  );
}

export default function RootLayout() {
  useDeeplinkNotifications();

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <LanguageProvider>
          <ToastProvider>
            <AuthProvider>
              <RoleProvider>
                <SelectedTenantProvider>
                  <ThemedRoot />
                </SelectedTenantProvider>
              </RoleProvider>
            </AuthProvider>
          </ToastProvider>
        </LanguageProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
