"use client";

// page.tsx is a server component (fetches gateways directly) — same split
// pattern as pages/pages-header.tsx.

import { useT } from "@/lib/i18n/language-provider";

export function PaymentsHeader() {
  const t = useT();
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-bold">{t("payments.title")}</h1>
      <p className="text-muted-foreground text-sm mt-1">{t("payments.subtitle")}</p>
    </div>
  );
}
