"use client";

import { AutoRecoverError } from "@/components/auto-recover-error";

// Dashboard page errors: retry once automatically (see AutoRecoverError).
// Errors in the (admin) layout itself fall through to app/global-error.tsx,
// which uses the same component.
export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <AutoRecoverError error={error} reset={reset} />;
}
