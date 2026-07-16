import Link from "next/link";
import { getAuthState } from "@/lib/queries";
import { Star } from "@/components/illustrations";

export const metadata = { title: "Email verified — Phapano+" };

/**
 * Shown only after /auth/callback confirms the outcome with Supabase.
 *
 * Two states:
 *   default            → "Email verified successfully"
 *   ?status=already    → "Email already verified"
 *
 * The continue button is auth-aware:
 *   - signed in, onboarding complete   → dashboard
 *   - signed in, onboarding incomplete → onboarding (their correct next step)
 *   - signed out                       → log in
 */
export default async function VerifiedPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const already = searchParams.status === "already";
  const { authed, onboarded } = await getAuthState();

  const href = authed ? (onboarded ? "/dashboard" : "/onboarding") : "/login";
  const label = authed
    ? onboarded
      ? "Go to dashboard"
      : "Continue setting up"
    : "Continue to log in";

  return (
    <div className="animate-fade text-center" role="status">
      <Star className="pointer-events-none mx-auto mb-2 w-24 opacity-90" />
      <h1 className="font-sora text-2xl font-bold tracking-tight">
        {already ? "Email already verified" : "Email verified successfully"}
      </h1>
      <p className="mx-auto mt-3 max-w-sm text-charcoal-soft">
        {already
          ? "Your email address has already been confirmed. You can continue to Phapano+."
          : authed
            ? "Your Phapano+ account is ready."
            : "Your Phapano+ account is ready. You can now log in."}
      </p>
      <Link href={href} className="btn-primary mt-6 w-full">
        {label}
      </Link>
    </div>
  );
}
