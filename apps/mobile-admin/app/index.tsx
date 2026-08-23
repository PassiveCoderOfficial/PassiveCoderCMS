// Redirect gate — decides where a signed-in user belongs. Renders visible UI
// only in the one case with nowhere to send them.

import { useEffect } from "react";
import { router } from "expo-router";
import { Alert } from "react-native";
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
    // way out of the app. Give them the real story and a way to sign out.
    return (
      <Screen>
        <EmptyState
          icon="🔒"
          title="No sites yet"
          subtitle={
            "This account isn't a member of any site, and isn't staff. " +
            "Ask an administrator to add you to a site, then sign in again."
          }
          action={{
            label: "Sign out",
            onPress: () => {
              Alert.alert("Sign out?", "You'll need to sign in again.", [
                { text: "Cancel", style: "cancel" },
                { text: "Sign out", style: "destructive", onPress: () => { logout().catch(() => {}); } },
              ]);
            },
          }}
        />
      </Screen>
    );
  }

  return <LoadingSpinner />;
}
