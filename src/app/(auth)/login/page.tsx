import { Suspense } from "react";
import Link from "next/link";
import { LoginForm } from "./login-form";

const LOGO = process.env.NEXT_PUBLIC_LOGO_URL ?? "https://mljchiaabgvdzdsfobxs.supabase.co/storage/v1/object/public/media/uploads/1777257556858_Passive_Coder_Web_logo.png";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={LOGO}
              alt="Passive Coder"
              className="h-12 w-auto mx-auto"
            />
          </Link>
          <h1 className="text-2xl font-bold">Welcome back</h1>
          <p className="text-muted-foreground text-sm mt-1">Sign in to your account</p>
        </div>
        <Suspense>
          <LoginForm />
        </Suspense>
        <p className="text-center text-sm text-muted-foreground mt-6">
          Don&apos;t have an account?{" "}
          <Link href="/onboarding" className="text-primary font-medium hover:underline">Sign up free</Link>
        </p>
      </div>
    </div>
  );
}
