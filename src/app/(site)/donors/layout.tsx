// Header for these routes comes from the shared (site)/layout.tsx
// (DonorSiteHeader, mounted for the "blood" tenant). This wrapper just
// gives the donor pages a consistent background.
export default function DonorsLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-gray-50">{children}</div>;
}
