import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import OnboardingClient from "./onboarding-client";

export default function OnboardingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    }>
      <OnboardingClient />
    </Suspense>
  );
}
