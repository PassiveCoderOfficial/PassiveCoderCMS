import { redirect } from "next/navigation";
import { currentVendor, vendorApplicationStatus } from "@/lib/marketplace-ecom/vendor-auth";
import VendorSignupForm from "./signup-form";

export const metadata = { title: "Become a seller" };

export default async function VendorSignupPage() {
  // Already selling, or already applied — no point showing the form again.
  const vendor = await currentVendor();
  if (vendor) redirect("/vendor/dashboard");
  const status = await vendorApplicationStatus();
  if (status !== "none") redirect("/vendor-pending");

  return <VendorSignupForm />;
}
