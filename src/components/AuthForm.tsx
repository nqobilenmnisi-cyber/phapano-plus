"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { AuthResult } from "@/app/(auth)/actions";
import { Compass } from "@/components/illustrations";

type Mode = "login" | "signup";

export function AuthForm({
  mode,
  action,
}: {
  mode: Mode;
  action: (formData: FormData) => Promise<AuthResult>;
}) {
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const params = useSearchParams();
  const redirectTo = params.get("redirect") ?? "/dashboard";

  function onSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await action(formData);
      if (result && "error" in result) {
        setError(result.error);
      } else if (result && "pendingVerification" in result) {
        setSentTo(result.email);
      }
    });
  }

  // "Check your email" confirmation screen (after sign up).
  if (sentTo) {
    return (
      <div className="relative animate-fade text-center">
        <Compass className="pointer-events-none mx-auto mb-2 w-28 opacity-90" />
        <h1 className="font-sora text-2xl font-bold tracking-tight">
          Check your email
        </h1>
        <p className="mx-auto mt-3 max-w-sm text-charcoal-soft">
          We&apos;ve sent a verification link to{" "}
          <span className="font-semibold text-charcoal">{sentTo}</span>. Click it
          to confirm your account, then come back and log in.
        </p>
        <div className="mt-6 rounded-card border border-line bg-soft px-5 py-4 text-left text-sm text-charcoal-soft">
          <p className="font-semibold text-charcoal">Didn&apos;t get it?</p>
          <p className="mt-1">
            Give it a minute, and check your spam or promotions folder. The
            sender is Supabase on behalf of Phapano.
          </p>
        </div>
        <Link href="/login" className="btn-primary mt-6 w-full">
          Go to log in
        </Link>
      </div>
    );
  }

  return (
    <form action={onSubmit} className="space-y-4">
      <div>
        <label className="label" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="input"
          placeholder="you@example.com"
        />
      </div>

      <div>
        <label className="label" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
          className="input"
          placeholder={mode === "signup" ? "At least 8 characters" : "••••••••"}
        />
      </div>

      <input type="hidden" name="redirect" value={redirectTo} />

      {error && (
        <p className="rounded-chip border border-bronze-soft bg-bronze-soft/40 px-4 py-3 text-sm text-bronze-deep">
          {error}
        </p>
      )}

      <button type="submit" className="btn-primary w-full" disabled={pending}>
        {pending
          ? "One moment…"
          : mode === "signup"
            ? "Create my account"
            : "Log in"}
      </button>

      <p className="pt-2 text-center text-sm text-charcoal-soft">
        {mode === "signup" ? (
          <>
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-blue-action hover:underline">
              Log in
            </Link>
          </>
        ) : (
          <>
            New to Phapano?{" "}
            <Link href="/signup" className="font-semibold text-blue-action hover:underline">
              Create an account
            </Link>
          </>
        )}
      </p>
    </form>
  );
}
