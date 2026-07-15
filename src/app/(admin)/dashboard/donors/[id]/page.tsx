import { DonorDashboardForm } from "../donor-form";

export const metadata = { title: "Edit Donor — Dashboard" };

export default async function EditDashboardDonorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <DonorDashboardForm donorId={id} />;
}
