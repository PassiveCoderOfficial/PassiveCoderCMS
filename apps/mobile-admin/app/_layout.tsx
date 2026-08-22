import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider, useAuth } from "../lib/auth";
import { RoleProvider, useRole } from "../lib/role";
import { SelectedTenantProvider } from "../lib/tenant";
import { LoadingSpinner } from "../components/ui";
import { colors } from "../lib/theme";

function Gate({ children }: { children: React.ReactNode }) {
  const { loading: authLoading } = useAuth();
  const { loading: roleLoading } = useRole();
  if (authLoading || roleLoading) return <LoadingSpinner />;
  return <>{children}</>;
}

export default function RootLayout() {
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
