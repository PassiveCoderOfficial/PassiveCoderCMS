"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { customerLoginAction, customerSignupAction } from "../actions";

/**
 * Customer login/signup, one form with a mode toggle rather than two pages —
 * matches how most storefronts present this (Shopify, WooCommerce accounts
 * both do a single "sign in or create an account" screen).
 */
const REASONS: Record<string, string> = {
  chat: "Sign in to chat with the seller. It only takes a moment.",
  review: "Sign in to write your review.",
  wishlist: "Sign in to save items to your wishlist.",
};

export function CustomerLoginForm({ next = "/account/orders", reason }: { next?: string; reason?: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [signedUp, setSignedUp] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "login") {
        const result = await customerLoginAction(email, password);
        if (result.error) { setError(result.error); return; }
        router.push(next);
        router.refresh();
      } else {
        const result = await customerSignupAction(email, password, name);
        if (result.error) { setError(result.error); return; }
        // Supabase email-confirmation may be on for this project — rather
        // than assume the session is live immediately, tell the customer to
        // check their inbox and offer to switch to sign-in once confirmed.
        setSignedUp(true);
      }
    } finally {
      setLoading(false);
    }
  }

  if (signedUp) {
    return (
      <div className="max-w-sm mx-auto py-16 px-4 text-center">
        <h1 className="text-xl font-semibold mb-2">Check your email</h1>
        <p className="text-sm text-muted-foreground mb-6">
          We&apos;ve sent a confirmation link to {email}. Confirm your email, then sign in below.
        </p>
        <button
          onClick={() => { setSignedUp(false); setMode("login"); }}
          className="text-sm font-medium underline"
        >
          Back to sign in
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto py-10 sm:py-16 px-4">
     <div className="rounded-2xl bg-card border shadow-sm overflow-hidden">
      <div className="grid grid-cols-2 border-b">
        {(["login", "signup"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => { setMode(m); setError(null); }}
            className={`py-3.5 text-sm font-semibold border-b-2 -mb-px ${mode === m ? "border-primary text-primary" : "border-transparent text-muted-foreground"}`}
          >
            {m === "login" ? "Sign in" : "Create account"}
          </button>
        ))}
      </div>
      <div className="p-6">
      {reason && REASONS[reason] && (
        <p className="mb-4 rounded-xl bg-primary/10 text-primary text-sm font-medium px-4 py-3">{REASONS[reason]}</p>
      )}
      <h1 className="text-xl font-bold mb-1">{mode === "login" ? "Welcome back" : "Create your account"}</h1>
      <p className="text-sm text-muted-foreground mb-6">
        {mode === "login" ? "Track orders, chat with sellers and review purchases." : "Free, and takes less than a minute."}
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === "signup" && (
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              type="text" required value={name} onChange={(e) => setName(e.target.value)}
              className="w-full h-11 rounded-xl border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>
        )}
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
            className="w-full h-11 rounded-xl border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Password</label>
          <input
            type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)}
            className="w-full h-11 rounded-xl border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <button
          type="submit" disabled={loading}
          className="w-full h-11 rounded-xl bg-primary text-primary-foreground text-sm font-bold disabled:opacity-50 hover:opacity-90"
        >
          {loading ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
        </button>
      </form>

      <button
        onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(null); }}
        className="mt-4 text-sm text-muted-foreground hover:text-foreground underline w-full text-center"
      >
        {mode === "login" ? "New here? Create an account" : "Already have an account? Sign in"}
      </button>
      </div>
     </div>
    </div>
  );
}
