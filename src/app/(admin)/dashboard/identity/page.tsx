import { redirect } from "next/navigation";

export default function IdentityRedirect() {
  redirect("/dashboard/templates/header-footer");
}
