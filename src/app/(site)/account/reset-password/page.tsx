import { ResetPasswordForm } from "./reset-form";
import { safeRedirectPath } from "@/lib/auth/safe-redirect";

export const metadata = { title: "Choose a new password" };

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string; next?: string }> }) {
  const { token, next } = await searchParams;
  // Only same-site paths, so ?next= can't bounce anyone off-site. Sellers'
  // reset links carry /vendor/dashboard.
  const safe = safeRedirectPath(next, "") || undefined;
  return <ResetPasswordForm token={token ?? ""} next={safe} />;
}
