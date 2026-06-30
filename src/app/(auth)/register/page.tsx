import { redirect } from "next/navigation";

export const metadata = { title: "Sign Up — Passive Coder" };

export default function SignupChoicePage() {
  redirect("/onboarding");
}
