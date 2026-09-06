"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { customerLoginAction, customerSignupAction } from "../actions";

/**
 * Customer login/signup, one form with a mode toggle rather than two pages —
 * matches how most storefronts present this (Shopify, WooCommerce accounts
 * both do a single "sign in or create an account" screen).
 */
export function CustomerLoginForm() {
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
        router.push("/account/orders");
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
    <div className="max-w-sm mx-auto py-16 px-4">
      <h1 className="text-xl font-semibold mb-1">{mode === "login" ? "Sign in" : "Create an account"}</h1>
      <p className="text-sm text-muted-foreground mb-6">
        {mode === "login" ? "Sign in to view your orders." : "Create an account to track your orders."}
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === "signup" && (
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              type="text" required value={name} onChange={(e) => setName(e.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm"
            />
          </div>
        )}
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Password</label>
          <input
            type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <button
          type="submit" disabled={loading}
          className="w-full rounded-md bg-primary text-primary-foreground py-2 text-sm font-medium disabled:opacity-50"
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
  );
}
