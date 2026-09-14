import { redirect } from "next/navigation";

/**
 * Dashboard content merged into /dashboard/analytics (2026-09-14, per Wali)
 * — stats cards, recent orders/transactions, and quick actions now render
 * at the top of that page, above the traffic panel that used to be all
 * Analytics showed. This route just forwards bookmarks/links that still
 * point at the old separate page.
 */
export default function DashboardPage() {
  redirect("/dashboard/analytics");
}
