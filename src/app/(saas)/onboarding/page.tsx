import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import OnboardingClient from "./onboarding-client";
import { fetchPublishedTemplates } from "@/lib/templates/published-templates";

export default async function OnboardingPage() {
  // Fetched here rather than in the client: the picker must only ever offer
  // templates that actually exist, otherwise a new customer picks one and
  // silently gets a blank site.
  const templates = await fetchPublishedTemplates();

  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    }>
      <OnboardingClient templates={templates} />
    </Suspense>
  );
}
