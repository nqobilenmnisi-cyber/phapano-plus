import { redirect } from "next/navigation";
import { AuthForm } from "@/components/AuthForm";
import { signIn } from "@/app/(auth)/actions";
import { getAuthState } from "@/lib/queries";

export const metadata = { title: "Log in — Phapano+" };

export default async function LoginPage() {
  // Already signed in? Go where they belong, don't show login again.
  const { authed, onboarded } = await getAuthState();
  if (authed && onboarded) redirect("/dashboard");
  if (authed && !onboarded) redirect("/onboarding");

  return (
    <div>
      <h1 className="font-sora text-2xl font-bold tracking-tight">
        Welcome back
      </h1>
      <p className="mb-6 mt-1 text-sm text-charcoal-soft">
        Let&apos;s pick up where you left off.
      </p>
      <AuthForm mode="login" action={signIn} />
    </div>
  );
}
