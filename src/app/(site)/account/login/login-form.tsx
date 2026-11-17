"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, MailCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { FormAlert, FormField } from "@/components/site/form-field";
import { checkEmailOrPhone, checkName, checkPassword } from "@/lib/validation/customer";
import { customerForgotPasswordAction, customerLoginAction, customerSignupAction } from "../actions";

/**
 * Customer sign in / create account / forgot password, one card with a mode
 * toggle (Shopify and WooCommerce accounts both present it this way). Sign in
 * takes an email or a mobile number. Social buttons show only for providers
 * switched on in the auth project.
 *
 * `seller` turns it into a seller sign-in (the Seller Centre now has its own
 * form at /vendor/login/seller-login-form.tsx): sign in
 * and forgot password only, since seller accounts come from the seller
 * application or the store admin, never a plain sign-up. `provider` does the
 * same for service-booking vendors (/provider/login, Provider Portal).
 */
const REASONS: Record<string, string> = {
  chat: "Sign in to chat with the seller. It only takes a moment.",
  review: "Sign in to write your review.",
  wishlist: "Sign in to save items to your wishlist.",
  not_seller: "The account you're signed in with has no shop on this marketplace. Sign in with your seller account, or apply to sell.",
  not_provider: "The account you're signed in with is not a vendor on this site. Sign in with your vendor account.",
  provider_pending: "Your vendor account isn't active yet. The site team will let you know once it's approved.",
};

type Mode = "login" | "signup" | "forgot";

export function CustomerLoginForm({ next = "/account/orders", reason, google = false, facebook = false, seller = false, provider = false, initialMode = "login" }: { next?: string; reason?: string; google?: boolean; facebook?: boolean; seller?: boolean; provider?: boolean; initialMode?: "login" | "signup" }) {
  // Vendor sign-ins: no account creation, no social buttons.
  const vendorLogin = seller || provider;
  const router = useRouter();
  // ?mode=signup (the header's "Create an account") opens on the sign-up tab; vendors never sign up here.
  const [mode, setMode] = useState<Mode>(initialMode === "signup" && !(seller || provider) ? "signup" : "login");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [notice, setNotice] = useState<"confirm" | "reset" | null>(null);

  const errs = {
    name: mode === "signup" ? checkName(name) : null,
    identifier: checkEmailOrPhone(identifier),
    password: mode === "forgot" ? null : mode === "signup" ? checkPassword(password) : password ? null : "Please enter your password",
  };

  function switchMode(m: Mode) {
    setMode(m);
    setError(null);
    setSubmitted(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    setError(null);
    if (errs.name || errs.identifier || errs.password) return;
    setLoading(true);
    try {
      if (mode === "login") {
        const r = await customerLoginAction(identifier, password);
        if (r.error) return setError(r.error);
        router.push(next);
        router.refresh();
      } else if (mode === "signup") {
        const r = await customerSignupAction(identifier, password, name);
        if (r.error) return setError(r.error);
        if (!r.signedIn) return setNotice("confirm");
        router.push(next);
        router.refresh();
      } else {
        const r = await customerForgotPasswordAction(identifier, next);
        if (r.error) return setError(r.error);
        setNotice("reset");
      }
    } finally {
      setLoading(false);
    }
  }

  async function withProvider(p: "google" | "facebook") {
    setError(null);
    const { error: err } = await createClient().auth.signInWithOAuth({
      provider: p,
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback?next=${encodeURIComponent(next)}`,
        ...(p === "facebook" ? { scopes: "email" } : {}),
      },
    });
    if (err) setError(`${p === "google" ? "Google" : "Facebook"} sign-in isn't available right now. Please use your email or mobile number.`);
  }

  if (notice) {
    return (
      <div className="max-w-md mx-auto py-16 px-4">
        <div className="rounded-2xl bg-card border shadow-sm p-8 text-center">
          <MailCheck className="w-10 h-10 mx-auto text-primary mb-3" />
          <h1 className="text-xl font-bold mb-2">Check your email</h1>
          <p className="text-sm text-muted-foreground mb-6">
            {notice === "reset"
              ? <>If an account uses <b>{identifier}</b>, we&apos;ve emailed it a link to choose a new password. The link works for 1 hour.</>
              : <>We&apos;ve sent a confirmation link to <b>{identifier}</b>. Confirm your email, then sign in.</>}
          </p>
          <button onClick={() => { setNotice(null); switchMode("login"); }} className="text-sm font-semibold text-primary hover:underline">
            Back to sign in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto py-10 sm:py-16 px-4">
      <div className="rounded-2xl bg-card border shadow-sm overflow-hidden">
        {mode === "forgot" ? (
          <button type="button" onClick={() => switchMode("login")} className="flex items-center gap-1.5 px-6 pt-5 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" /> Back to sign in
          </button>
        ) : !vendorLogin ? (
          <div className="grid grid-cols-2 border-b">
            {(["login", "signup"] as const).map((m) => (
              <button key={m} type="button" onClick={() => switchMode(m)}
                className={`py-3.5 text-sm font-semibold border-b-2 -mb-px ${mode === m ? "border-primary text-primary" : "border-transparent text-muted-foreground"}`}>
                {m === "login" ? "Sign in" : "Create account"}
              </button>
            ))}
          </div>
        ) : null}
        <div className="p-6">
          {reason && REASONS[reason] && mode !== "forgot" && (
            <p className="mb-4 rounded-xl bg-primary/10 text-primary text-sm font-medium px-4 py-3">{REASONS[reason]}</p>
          )}
          <h1 className="text-xl font-bold mb-1">{mode === "login" ? (provider ? "Vendor login" : seller ? "Seller login" : "Welcome back") : mode === "signup" ? "Create your account" : "Forgot your password?"}</h1>
          <p className="text-sm text-muted-foreground mb-6">
            {mode === "login" ? (provider ? "Sign in to your Provider Portal to see your bookings, services and profile." : seller ? "Sign in to your Seller Centre to manage products, orders and payouts." : "Track orders, chat with sellers and review purchases.")
              : mode === "signup" ? "Free, and takes less than a minute."
              : "Enter the email or mobile number on your account and we'll email you a reset link."}
          </p>

          {(google || facebook) && !vendorLogin && mode !== "forgot" && (
            <>
              <div className="space-y-2.5">
                {google && (
                  <button type="button" onClick={() => withProvider("google")}
                    className="w-full h-11 rounded-xl border bg-background text-sm font-semibold flex items-center justify-center gap-2.5 hover:bg-muted transition-colors">
                    <svg viewBox="0 0 24 24" className="w-4 h-4" aria-hidden><path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.3-2.1 3.5-5.2 3.5-8.8z"/><path fill="#34A853" d="M12 24c3.2 0 6-1.1 7.9-2.9l-3.9-3c-1.1.7-2.4 1.2-4 1.2-3.1 0-5.7-2.1-6.6-4.9H1.4v3.1A12 12 0 0 0 12 24z"/><path fill="#FBBC05" d="M5.4 14.4a7.2 7.2 0 0 1 0-4.6V6.7h-4a12 12 0 0 0 0 10.8l4-3.1z"/><path fill="#EA4335" d="M12 4.8c1.7 0 3.3.6 4.5 1.8l3.4-3.4A12 12 0 0 0 1.4 6.7l4 3.1C6.3 6.9 8.9 4.8 12 4.8z"/></svg>
                    Continue with Google
                  </button>
                )}
                {facebook && (
                  <button type="button" onClick={() => withProvider("facebook")}
                    className="w-full h-11 rounded-xl bg-[#1877F2] hover:bg-[#166FE5] text-white text-sm font-semibold flex items-center justify-center gap-2.5 transition-colors">
                    <svg viewBox="0 0 24 24" className="w-4 h-4" aria-hidden><path fill="currentColor" d="M24 12a12 12 0 1 0-13.9 11.9v-8.4H7.1V12h3V9.4c0-3 1.8-4.7 4.5-4.7 1.3 0 2.7.2 2.7.2v3h-1.5c-1.5 0-2 .9-2 1.9V12h3.4l-.5 3.5h-2.9v8.4A12 12 0 0 0 24 12z"/></svg>
                    Continue with Facebook
                  </button>
                )}
              </div>
              <div className="flex items-center gap-3 my-5 text-xs text-muted-foreground">
                <span className="flex-1 h-px bg-border" /> or <span className="flex-1 h-px bg-border" />
              </div>
            </>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {mode === "signup" && (
              <FormField label="Full name" required value={name} onChange={setName} error={errs.name} showError={submitted} autoComplete="name" placeholder="e.g. Rahim Uddin" />
            )}
            <FormField
              label="Email or mobile number" required value={identifier} onChange={setIdentifier}
              error={errs.identifier} showError={submitted} autoComplete="username" placeholder={provider ? "name@example.com" : "name@gmail.com or 01712345678"}
            />
            {mode !== "forgot" && (
              <div>
                <FormField
                  label="Password" required type="password" value={password} onChange={setPassword}
                  error={errs.password} showError={submitted} meter={mode === "signup"}
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  hint={mode === "signup" ? "At least 8 characters, with letters and numbers" : undefined}
                />
                {mode === "login" && (
                  <button type="button" onClick={() => switchMode("forgot")} className="mt-2 text-xs font-medium text-primary hover:underline">
                    Forgot password?
                  </button>
                )}
              </div>
            )}

            {error && <FormAlert>{error}</FormAlert>}

            <button type="submit" disabled={loading}
              className="w-full h-11 rounded-xl bg-primary text-primary-foreground text-sm font-bold disabled:opacity-60 hover:opacity-90 flex items-center justify-center gap-2">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {mode === "login" ? "Sign in" : mode === "signup" ? "Create account" : "Send reset link"}
            </button>
          </form>

          {seller && mode !== "forgot" && (
            <p className="mt-4 text-sm text-muted-foreground text-center">
              New seller? <Link href="/vendor/signup" className="font-semibold text-primary hover:underline">Apply to sell</Link>
            </p>
          )}
          {!vendorLogin && mode !== "forgot" && (
            <button onClick={() => switchMode(mode === "login" ? "signup" : "login")}
              className="mt-4 text-sm text-muted-foreground hover:text-foreground underline w-full text-center">
              {mode === "login" ? "New here? Create an account" : "Already have an account? Sign in"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
