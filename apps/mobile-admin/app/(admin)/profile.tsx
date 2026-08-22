import { ProfileScreen } from "../../components/ProfileScreen";

// Super admins / staff have no tenant membership list of their own — they
// reach sites through the Tenants tab instead.
export default function AdminProfileScreen() {
  return <ProfileScreen showMemberships={false} />;
}
