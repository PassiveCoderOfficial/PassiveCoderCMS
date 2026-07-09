import { VerifyPendingClient } from "./verify-pending-client";

const LOGO = process.env.NEXT_PUBLIC_LOGO_URL ?? "https://mljchiaabgvdzdsfobxs.supabase.co/storage/v1/object/public/media/uploads/1777257556858_Passive_Coder_Web_logo.png";

export const metadata = { title: "Verify Your Account" };

export default function VerifyPendingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={LOGO} alt="Passive Coder" className="h-12 w-auto mx-auto mb-4" />
          <h1 className="text-2xl font-bold">Verify your account</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Your 7-day grace period has ended. Please verify your email to regain access.
          </p>
        </div>
        <VerifyPendingClient />
      </div>
    </div>
  );
}
