// v1.5: cross-tenant list via Bearer-authed GET /api/super-admin/sites —
// deliberately not implemented in v1. This stub exists only so super_admin
// / pc_staff users have somewhere to land after login instead of a dead
// route on the (admin) tab bar.

import { EmptyState, Screen } from "../../../components/ui";

export default function AdminTenantsScreen() {
  return (
    <Screen>
      <EmptyState
        title="Coming soon"
        subtitle="Cross-tenant management is not yet available in the mobile app."
      />
    </Screen>
  );
}
