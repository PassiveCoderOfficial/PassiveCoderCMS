"use client";

// Ecommerce currency now reads the SITE-WIDE base currency (site_settings),
// shared with the accounting system. Kept as a thin re-export so existing
// imports keep working.
export { useSiteCurrency as useEcommerceCurrency } from "@/lib/hooks/use-site-currency";
