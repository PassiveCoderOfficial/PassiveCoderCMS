"use client";

import { AutoRecoverError } from "@/components/auto-recover-error";

// Replaces Next's bare default ("This page couldn't load"). Renders instead of
// the root layout, so it brings its own <html>/<body>.
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body>
        <AutoRecoverError error={error} reset={reset} />
      </body>
    </html>
  );
}
