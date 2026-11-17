import { redirect } from "next/navigation";
import { isStandalone } from "@/lib/flags";

export const metadata = { title: "Sign Up — Passive Coder" };

export default function SignupChoicePage() {
  // A self-hosted install has one site and no public sign-up.
  redirect(isStandalone ? "/login" : "/onboarding");
}
