"use client";

import { useState, useTransition } from "react";
import { updatePassword } from "@/app/(auth)/actions";
import {
  isPasswordValid,
  PASSWORD_RULES,
} from "@/lib/password-policy";

export default function ResetPasswordPage() {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const validPassword = isPasswordValid(password);

  function submit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await updatePassword(formData);
      if (result && "error" in result && result.error) setError(result.error);
    });
  }

  return (
    <div>
      <h1 className="font-sora text-2xl font-bold tracking-tight">
        Choose a new password
      </h1>
      <p className="mt-2 text-sm text-charcoal-soft">
        You&apos;re securely signed in through your reset link. Pick a new
        password to finish.
      </p>
      <form action={submit} className="mt-5 space-y-4">
        <div>
          <label className="label" htmlFor="password">
            New password
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              required
              autoComplete="new-password"
              className="input pr-16"
              placeholder="Create a strong password"
              disabled={pending}
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
          <ul className="mt-2 space-y-1" aria-label="Password requirements">
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
        </div>
        {error && (
          <p
            aria-live="polite"
            className="rounded-chip border border-bronze-soft bg-bronze-soft/40 px-4 py-3 text-sm text-bronze-deep"
          >
            {error}
          </p>
        )}
        <button
          type="submit"
          className="btn-primary w-full"
          disabled={pending || !validPassword}
          aria-busy={pending}
        >
          {pending ? "Saving…" : "Save new password"}
        </button>
      </form>
    </div>
  );
}
