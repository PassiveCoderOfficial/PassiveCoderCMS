// Pure redirect gate — no visible UI. RootLayout already shows a spinner
// while auth/role are loading, so by the time this renders we know enough
// to route the user to where they belong.

import { useEffect } from "react";
import { router } from "expo-router";
import { useAuth } from "../lib/auth";
import { useRole } from "../lib/role";
import { LoadingSpinner } from "../components/ui";

export default function Index() {
  const { user, loading: authLoading } = useAuth();
  const { role, loading: roleLoading } = useRole();

  useEffect(() => {
    if (authLoading || roleLoading) return;

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
      return;
    }

    // Logged in but no resolvable role (no memberships, not staff/SA) —
    // send back to login; there's nowhere useful to land in v1.
    router.replace("/login");
  }, [user, role, authLoading, roleLoading]);

  return <LoadingSpinner />;
}
