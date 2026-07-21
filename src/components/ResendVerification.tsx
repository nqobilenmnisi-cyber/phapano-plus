"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { resendVerification } from "@/app/(auth)/actions";

const COOLDOWN_SECONDS = 60;

/**
 * Lets a user request a fresh verification email.
 *
 * Two modes:
 *   - `email` prop provided (check-your-email screen): a single button.
 *   - no `email` prop (expired-link page): an email field plus button.
 *
 * States handled: loading, cooldown with countdown, success, friendly error.
 * Status changes are announced via an aria-live region.
 */
export function ResendVerification({ email }: { email?: string }) {
  const [typedEmail, setTypedEmail] = useState("");
  const [message, setMessage] = useState<
    { kind: "success" | "error"; text: string } | null
  >(null);
  const [cooldown, setCooldown] = useState(0);
  const [pending, startTransition] = useTransition();
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, []);

  function startCooldown() {
    setCooldown(COOLDOWN_SECONDS);
    timer.current = setInterval(() => {
      setCooldown((s) => {
        if (s <= 1) {
          if (timer.current) clearInterval(timer.current);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  }

  function send() {
    const target = (email ?? typedEmail).trim();
    if (!target) {
      setMessage({ kind: "error", text: "Please enter your email address." });
      return;
    }
    setMessage(null);
    startTransition(async () => {
      const result = await resendVerification(target);
      if ("error" in result) {
        setMessage({ kind: "error", text: result.error });
      } else {
        setMessage({
          kind: "success",
          text: "A new verification email is on its way. Give it a minute to arrive.",
        });
        startCooldown();
      }
    });
  }

  const disabled = pending || cooldown > 0;

  return (
    <div>
      {!email && (
        <div>
          <label className="label" htmlFor="resend-email">
            Email
          </label>
          <input
            id="resend-email"
            type="email"
            autoComplete="email"
            className="input"
            placeholder="you@example.com"
            value={typedEmail}
            onChange={(e) => setTypedEmail(e.target.value)}
            disabled={pending}
          />
        </div>
      )}

      <button
        type="button"
        onClick={send}
        disabled={disabled}
        aria-busy={pending}
        className={`btn-secondary w-full ${email ? "" : "mt-4"}`}
      >
        {pending
          ? "Sending…"
          : cooldown > 0
            ? `Sent — resend available in ${cooldown}s`
            : "Resend verification email"}
      </button>

      <p aria-live="polite" className="min-h-[1.25rem]">
        {message && (
          <span
            className={`mt-2 block rounded-chip border px-4 py-3 text-sm ${
              message.kind === "success"
                ? "border-line bg-soft text-charcoal"
                : "border-bronze-soft bg-bronze-soft/40 text-bronze-deep"
            }`}
          >
            {message.text}
          </span>
        )}
      </p>
    </div>
  );
}
