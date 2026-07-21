"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { requestPasswordReset } from "@/app/(auth)/actions";

export default function ForgotPasswordPage() {
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await requestPasswordReset(formData);
      if (result && "error" in result && result.error) setError(result.error);
      else if (result && "email" in result) setSentTo(result.email ?? "");
    });
  }

  if (sentTo) {
    return (
      <div className="text-center">
        <h1 className="font-sora text-2xl font-bold tracking-tight">
          Check your email
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-charcoal-soft">
          If an account exists for <b>{sentTo}</b>, we&apos;ve sent a link to
          reset your password. The link opens a page where you can choose a
          new one.
        </p>
        <Link href="/login" className="btn-secondary mt-6 inline-block">
          Back to log in
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-sora text-2xl font-bold tracking-tight">
        Reset your password
      </h1>
      <p className="mt-2 text-sm text-charcoal-soft">
        Enter the email you use for Phapano+ and we&apos;ll send you a reset
        link.
      </p>
      <form action={submit} className="mt-5 space-y-4">
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
            disabled={pending}
          />
        </div>
        {error && (
          <p
            aria-live="polite"
            className="rounded-chip border border-bronze-soft bg-bronze-soft/40 px-4 py-3 text-sm text-bronze-deep"
          >
            {error}
          </p>
        )}
        <button type="submit" className="btn-primary w-full" disabled={pending}>
          {pending ? "Sending…" : "Send reset link"}
        </button>
        <p className="pt-1 text-center text-sm text-charcoal-soft">
          Remembered it?{" "}
          <Link
            href="/login"
            className="font-semibold text-blue-action hover:underline"
          >
            Log in
          </Link>
        </p>
      </form>
    </div>
  );
}
