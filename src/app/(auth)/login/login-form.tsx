"use client";

import React, { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { loginAction } from "./actions";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Eye, EyeOff, CheckCircle } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const resetSchema = z.object({
  email: z.string().email("Invalid email address"),
});

type LoginValues = z.infer<typeof loginSchema>;
type ResetValues = z.infer<typeof resetSchema>;

const ERROR_MESSAGES: Record<string, string> = {
  no_tenant: "Your account isn't linked to a site yet. Complete onboarding or contact support.",
  unauthorized: "You don't have permission to access this area.",
  agent_suspended: "Your agent account has been suspended.",
  "Invalid login credentials": "Incorrect email or password.",
};

export function LoginForm() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [mode, setMode] = useState<"login" | "reset">("login");
  const [resetSent, setResetSent] = useState(false);

  const errorParam = searchParams.get("error");
  const displayError = error ?? (errorParam ? (ERROR_MESSAGES[errorParam] ?? errorParam) : null);

  const loginForm = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const resetForm = useForm<ResetValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: { email: "" },
  });

  const onLogin = async (values: LoginValues) => {
    setLoading(true);
    setError(null);
    const redirectTo = searchParams.get("redirect") ?? "/dashboard";
    const result = await loginAction(values.email, values.password, redirectTo);
    if (result?.error) {
      setError(ERROR_MESSAGES[result.error] ?? result.error);
      setLoading(false);
    }
  };

  const onReset = async (values: ResetValues) => {
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
      redirectTo: `${window.location.origin}/login/update-password`,
    });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    setResetSent(true);
    setLoading(false);
  };

  if (mode === "reset") {
    return (
      <Card>
        <CardContent className="pt-6">
          {resetSent ? (
            <div className="text-center space-y-3 py-4">
              <CheckCircle className="w-10 h-10 text-green-500 mx-auto" />
              <p className="font-semibold">Check your email</p>
              <p className="text-sm text-muted-foreground">Password reset link sent. Check your inbox.</p>
              <button onClick={() => { setMode("login"); setResetSent(false); }} className="text-sm text-primary hover:underline">
                Back to sign in
              </button>
            </div>
          ) : (
            <form onSubmit={resetForm.handleSubmit(onReset)} className="space-y-4">
              <div>
                <p className="text-sm font-semibold mb-1">Reset your password</p>
                <p className="text-xs text-muted-foreground mb-4">Enter your email and we'll send a reset link.</p>
              </div>
              {displayError && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">{displayError}</div>
              )}
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input type="email" {...resetForm.register("email")} placeholder="you@example.com" autoComplete="email" />
                {resetForm.formState.errors.email && <p className="text-xs text-destructive">{resetForm.formState.errors.email.message}</p>}
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Send Reset Link
              </Button>
              <button type="button" onClick={() => setMode("login")} className="w-full text-sm text-muted-foreground hover:text-foreground text-center">
                Back to sign in
              </button>
            </form>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
          {displayError && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
              {displayError}
              {displayError === ERROR_MESSAGES.agent_suspended && (
                <a href="/contact" className="ml-1 underline font-medium">Contact support</a>
              )}
            </div>
          )}
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input type="email" {...loginForm.register("email")} placeholder="admin@example.com" autoComplete="email" />
            {loginForm.formState.errors.email && <p className="text-xs text-destructive">{loginForm.formState.errors.email.message}</p>}
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label>Password</Label>
              <button type="button" onClick={() => setMode("reset")} className="text-xs text-muted-foreground hover:text-primary transition-colors">
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                {...loginForm.register("password")}
                placeholder="••••••••"
                autoComplete="current-password"
                className="pr-10"
              />
              <button type="button" className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {loginForm.formState.errors.password && <p className="text-xs text-destructive">{loginForm.formState.errors.password.message}</p>}
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Sign In
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
