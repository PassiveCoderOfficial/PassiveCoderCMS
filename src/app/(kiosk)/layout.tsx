/**
 * Bare layout for standalone, full-screen restaurant displays — MONITOR
 * (/monitor/[branchId]), TABLE screen (/table-screen/[qrToken]), and the
 * rider PWA (/rider/[token]). Split out of (site) on 2026-09-14 after a
 * live platform sweep found MONITOR rendering inside the tenant's full
 * site chrome (header/nav/footer/cart) — these pages are meant to run
 * unattended on a kitchen TV or a rider's phone, never wrapped in a normal
 * website's navigation. No CartProvider, no PageRenderer, no site
 * header/footer — each page builds its own complete screen.
 */
export default function KioskLayout({ children }: { children: React.ReactNode }) {
  return children;
}
