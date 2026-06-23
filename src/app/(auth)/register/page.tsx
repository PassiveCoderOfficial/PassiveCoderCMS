import { Globe, Zap, ArrowRight, Check } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Sign Up — Passive Coder" };

const WEBSITE_PERKS = [
  "Drag-and-drop page builder",
  "All templates included",
  "Custom domain support",
  "Ecommerce & bookings",
  "No payment required at signup",
];

const AGENT_PERKS = [
  "Earn commission on every referral",
  "Manage client sites from one dashboard",
  "Unique referral link + tracking",
  "Auto-approved, no fees",
  "Access agent portal instantly",
];

export default function SignupChoicePage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-3xl space-y-10">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">How do you want to get started?</h1>
          <p className="text-muted-foreground">Choose your path — you can always switch later.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Website Builder */}
          <Link href="/onboarding"
            className="group relative flex flex-col rounded-2xl border-2 border-border hover:border-primary bg-card p-7 space-y-5 transition-all duration-200 hover:shadow-lg hover:shadow-primary/10">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
              <Globe className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Build a Website</h2>
              <p className="text-sm text-muted-foreground mt-1">Launch your business website in minutes. No coding needed.</p>
            </div>
            <ul className="space-y-1.5">
              {WEBSITE_PERKS.map(p => (
                <li key={p} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check className="w-3.5 h-3.5 text-green-500 shrink-0" /> {p}
                </li>
              ))}
            </ul>
            <div className="mt-auto pt-2">
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary group-hover:gap-2.5 transition-all">
                Get started free <ArrowRight className="w-4 h-4" />
              </span>
            </div>
          </Link>

          {/* Become Agent */}
          <Link href="/become-agent"
            className="group relative flex flex-col rounded-2xl border-2 border-border hover:border-yellow-500 bg-card p-7 space-y-5 transition-all duration-200 hover:shadow-lg hover:shadow-yellow-500/10">
            <div className="w-12 h-12 bg-yellow-500/10 rounded-xl flex items-center justify-center">
              <Zap className="w-6 h-6 text-yellow-500" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Become an Agent</h2>
              <p className="text-sm text-muted-foreground mt-1">Refer clients, earn commissions, manage their sites — all free.</p>
            </div>
            <ul className="space-y-1.5">
              {AGENT_PERKS.map(p => (
                <li key={p} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check className="w-3.5 h-3.5 text-green-500 shrink-0" /> {p}
                </li>
              ))}
            </ul>
            <div className="mt-auto pt-2">
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-yellow-500 group-hover:gap-2.5 transition-all">
                Join as agent — free <ArrowRight className="w-4 h-4" />
              </span>
            </div>
          </Link>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="text-primary hover:underline font-medium">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
