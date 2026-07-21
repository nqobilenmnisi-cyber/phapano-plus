import Link from "next/link";
import { ResendVerification } from "@/components/ResendVerification";
import { Compass } from "@/components/illustrations";

export const metadata = { title: "Verification link unavailable — Phapano+" };

/**
 * Shown when a verification link is invalid, expired or already used and the
 * visitor has no active session. Offers a safe way to request a fresh link —
 * the visitor types their email, so nothing personal ever travels in the URL.
 */
export default function AuthErrorPage() {
  return (
    <div className="animate-fade text-center">
      <Compass className="pointer-events-none mx-auto mb-2 w-24 opacity-90" />
      <h1 className="font-sora text-2xl font-bold tracking-tight">
        Verification link unavailable
      </h1>
      <p className="mx-auto mt-3 max-w-sm text-charcoal-soft">
        This verification link is invalid or has expired. Request a new
        verification email to continue.
      </p>

      <div className="mt-6 text-left">
        <ResendVerification />
      </div>

      <p className="mt-6 text-center text-sm text-charcoal-soft">
        <Link
          href="/login"
          className="font-semibold text-blue-action hover:underline"
        >
          Back to log in
        </Link>{" "}
        ·{" "}
        <Link
          href="/signup"
          className="font-semibold text-blue-action hover:underline"
        >
          Create an account
        </Link>
      </p>
    </div>
  );
}
