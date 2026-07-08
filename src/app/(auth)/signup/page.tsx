import { redirect } from "next/navigation";
import { AuthForm } from "@/components/AuthForm";
import { signUp } from "@/app/(auth)/actions";
import { getAuthState } from "@/lib/queries";

export const metadata = { title: "Create your account — Phapano+" };

export default async function SignupPage() {
  // A returning, signed-in user should never see sign-up/onboarding again.
  const { authed, onboarded } = await getAuthState();
  if (authed && onboarded) redirect("/dashboard");
  if (authed && !onboarded) redirect("/onboarding");

  return (
    <div>
      <h1 className="font-sora text-2xl font-bold tracking-tight">
        Start with your psychology pathway
      </h1>
      <p className="mb-6 mt-1 text-sm text-charcoal-soft">
        Create your Phapano+ account to track applications, funding
        opportunities and next steps.
      </p>
      <AuthForm mode="signup" action={signUp} />
    </div>
  );
}
