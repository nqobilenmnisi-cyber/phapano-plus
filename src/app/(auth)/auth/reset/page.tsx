"use client";

import { useState, useTransition } from "react";
import { updatePassword } from "@/app/(auth)/actions";

export default function ResetPasswordPage() {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

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
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className="input"
            placeholder="At least 8 characters"
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
          {pending ? "Saving…" : "Save new password"}
        </button>
      </form>
    </div>
  );
}
