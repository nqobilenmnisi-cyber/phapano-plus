import Link from "next/link";
import { Star } from "@/components/illustrations";

export const metadata = { title: "Email verified — Phapano+" };

/**
 * Shown only after /auth/callback confirms the outcome with Supabase.
 *
 * Two states:
 *   default            → "Your email has been confirmed."
 *   ?status=already    → "This email has already been confirmed."
 *
 * The login page remains auth-aware. If the verification callback established
 * a session, it will send the member to onboarding or the dashboard.
 */
export default async function VerifiedPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const already = searchParams.status === "already";

  return (
    <div className="animate-fade text-center" role="status">
      <Star className="pointer-events-none mx-auto mb-2 w-24 opacity-90" />
      <h1 className="font-sora text-2xl font-bold tracking-tight">
        {already
          ? "This email has already been confirmed."
          : "Your email has been confirmed."}
      </h1>
      <p className="mx-auto mt-3 max-w-sm text-charcoal-soft">
        {already
          ? "The verification link has already been used. You can continue to log in."
          : "Your Phapano+ account is ready. You can now log in."}
      </p>
      <Link href="/login" className="btn-primary mt-6 w-full">
        Continue to Log In
      </Link>
    </div>
  );
}
