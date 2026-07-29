"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { AuthResult } from "@/app/(auth)/actions";
import { Compass } from "@/components/illustrations";
import { ResendVerification } from "@/components/ResendVerification";
import {
  isPasswordValid,
  PASSWORD_RULES,
  passwordsMatch,
} from "@/lib/password-policy";

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
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const isSignup = mode === "signup";
  const validPassword = isPasswordValid(password);
  const matchingPasswords = passwordsMatch(password, confirmation);
  const signupBlocked =
    isSignup && (!validPassword || !matchingPasswords);

  function onSubmit(formData: FormData) {
    setError(null);
    if (signupBlocked) {
      setError(
        validPassword
          ? "The two passwords don't match. Please re-enter them."
          : "Please meet all the password requirements before creating your account."
      );
      return;
    }
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
        <p className="mx-auto mt-3 max-w-sm text-charcoal-soft" role="status">
          We&apos;ve sent a verification link to{" "}
          <span className="font-semibold text-charcoal">{sentTo}</span>. Click
          the link to confirm your account.
        </p>
        <div className="mt-6 rounded-card border border-line bg-soft px-5 py-4 text-left text-sm text-charcoal-soft">
          <p className="font-semibold text-charcoal">Didn&apos;t receive it?</p>
          <p className="mt-1">
            Give it a minute, then check your spam, junk or promotions folder.
            Look for an email from Phapano+.
          </p>
        </div>
        <div className="mt-4 text-left">
          <ResendVerification email={sentTo} />
        </div>
        <Link href="/login" className="btn-primary mt-4 w-full">
          Go to log in
        </Link>
      </div>
    );
  }

  return (
    <form action={onSubmit} className="space-y-4">
      {isSignup && (
        <p className="text-xs text-charcoal-soft">
          Fields marked with <span aria-hidden="true">*</span>
          <span className="sr-only">an asterisk</span> are required.
        </p>
      )}
      <div>
        <label className="label" htmlFor="email">
          Email {isSignup && <RequiredMark />}
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
          Password {isSignup && <RequiredMark />}
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            required
            autoComplete={isSignup ? "new-password" : "current-password"}
            className="input pr-16"
            placeholder={isSignup ? "Create a strong password" : "••••••••"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <button
            type="button"
            onClick={() => setShowPassword((visible) => !visible)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
            className="absolute inset-y-0 right-0 flex items-center px-3 text-xs font-semibold text-charcoal-soft hover:text-charcoal"
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>
        {isSignup && (
          <ul
            className="mt-2 space-y-1"
            aria-label="Password requirements"
          >
            {PASSWORD_RULES.map((rule) => {
              const met = rule.test(password);
              return (
                <li
                  key={rule.id}
                  className={`flex items-center gap-2 text-xs ${
                    met ? "text-green-700" : "text-charcoal-soft"
                  }`}
                  aria-label={`${rule.label}: ${met ? "met" : "not met"}`}
                >
                  <span aria-hidden="true">{met ? "✓" : "○"}</span>
                  <span>{rule.label}</span>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {isSignup && (
        <div>
          <label className="label" htmlFor="confirm_password">
            Confirm password <RequiredMark />
          </label>
          <div className="relative">
            <input
              id="confirm_password"
              name="confirm_password"
              type={showConfirmation ? "text" : "password"}
              required
              autoComplete="new-password"
              className="input pr-16"
              placeholder="Re-enter your password"
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              aria-describedby={
                confirmation && !matchingPasswords
                  ? "password-match-error"
                  : undefined
              }
            />
            <button
              type="button"
              onClick={() => setShowConfirmation((visible) => !visible)}
              aria-label={
                showConfirmation
                  ? "Hide confirmation password"
                  : "Show confirmation password"
              }
              aria-pressed={showConfirmation}
              className="absolute inset-y-0 right-0 flex items-center px-3 text-xs font-semibold text-charcoal-soft hover:text-charcoal"
            >
              {showConfirmation ? "Hide" : "Show"}
            </button>
          </div>
          {confirmation && !matchingPasswords && (
            <p
              id="password-match-error"
              className="mt-1 text-xs text-bronze-deep"
              aria-live="polite"
            >
              Passwords don&apos;t match yet.
            </p>
          )}
        </div>
      )}

      <input type="hidden" name="redirect" value={redirectTo} />

      {mode === "signup" && (
        <label className="flex items-start gap-2.5 rounded-card border border-line bg-soft px-4 py-3 text-sm text-charcoal-soft">
          <input type="checkbox" name="accept_terms" required className="mt-0.5" />
          <span>
            I agree to the{" "}
            <Link href="/terms" target="_blank" className="font-semibold text-blue-action hover:underline">
              Terms of Use
            </Link>{" "}
            and{" "}
            <Link href="/privacy" target="_blank" className="font-semibold text-blue-action hover:underline">
              Privacy Policy
            </Link>
            . <RequiredMark />
          </span>
        </label>
      )}

      {mode === "login" && (
        <p className="text-right text-sm">
          <Link
            href="/forgot-password"
            className="font-semibold text-charcoal-soft hover:text-charcoal"
          >
            Forgot your password?
          </Link>
        </p>
      )}

      {error && (
        <p className="rounded-chip border border-bronze-soft bg-bronze-soft/40 px-4 py-3 text-sm text-bronze-deep">
          {error}
        </p>
      )}

      <button
        type="submit"
        className="btn-primary w-full"
        disabled={pending || signupBlocked}
        aria-busy={pending}
      >
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
              Create Account
            </Link>
          </>
        )}
      </p>
    </form>
  );
}

function RequiredMark() {
  return (
    <>
      <span aria-hidden="true">*</span>
      <span className="sr-only">(required)</span>
    </>
  );
}
