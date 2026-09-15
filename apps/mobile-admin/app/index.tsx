// Redirect gate — decides where a signed-in user belongs. Renders visible UI
// only in the one case with nowhere to send them.

import { useEffect } from "react";
import { router } from "expo-router";
import { Alert, Pressable, Text } from "react-native";
import { useAuth } from "../lib/auth";
import { useRole } from "../lib/role";
import { EmptyState, LoadingSpinner, Screen } from "../components/ui";

export default function Index() {
  const { user, loading: authLoading, logout } = useAuth();
  const { role, loading: roleLoading } = useRole();

  const ready = !authLoading && !roleLoading;
  // Signed in, but not a super admin / staff member and not a member of any
  // tenant. There is nowhere to route them.
  const stranded = ready && !!user && role === null;

  useEffect(() => {
    if (!ready || stranded) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    if (role === "super_admin" || role === "pc_staff") {
      router.replace("/(admin)/tenants");
      return;
    }

    if (role === "tenant") {
      router.replace("/(tenant)/sites");
    }
  }, [user, role, ready, stranded]);

  if (stranded) {
    // Previously this redirected to /login, which was a trap: Gate only
    // forces /login when signed OUT, so a signed-in user with no role logged
    // straight back in and bounced here again — an unbreakable loop with no
    // way out of the app. Give them the real story and a way out.
    //
    // A brand-new account with zero tenant memberships is the exact
    // "stranded" case this state describes — but it's also the normal
    // outcome of just having signed up and not finished onboarding yet
    // (the app's own signup, via /onboard's step 0, creates an
    // auth.users row with no tenant_members row until create-tenant
    // runs). "Ask an admin to add you" was a dead end for that person;
    // offer onboarding first, sign-out as the fallback for someone who
    // genuinely landed here by mistake (e.g. staff account with no
    // assignment yet).
    return (
      <Screen>
        <EmptyState
          icon="🚀"
          title="No sites yet"
          subtitle="Create your first site to get started, or ask an administrator to add you to an existing one."
          action={{ label: "Create a site", onPress: () => router.replace("/onboard") }}
        />
        <Pressable
          onPress={() => {
            Alert.alert("Sign out?", "You'll need to sign in again.", [
              { text: "Cancel", style: "cancel" },
              { text: "Sign out", style: "destructive", onPress: () => { logout().catch(() => {}); } },
            ]);
          }}
          style={{ alignSelf: "center", marginTop: 16 }}
        >
          <Text style={{ color: "#888", fontSize: 13 }}>Sign out</Text>
        </Pressable>
      </Screen>
    );
  }

  return <LoadingSpinner />;
}
