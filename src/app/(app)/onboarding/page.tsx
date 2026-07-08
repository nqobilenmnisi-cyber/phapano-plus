import { redirect } from "next/navigation";
import { OnboardingWizard } from "@/components/OnboardingWizard";
import { getProfile, getCurrentUser } from "@/lib/queries";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { Logo } from "@/components/Logo";
import { firstName } from "@/lib/utils";

export const metadata = { title: "Welcome — Phapano+" };

export default async function OnboardingPage() {
  // Guard: must be signed in, and must not have already completed onboarding.
  if (isSupabaseConfigured) {
    const user = await getCurrentUser();
    if (!user) redirect("/login?redirect=/onboarding");
  }

  const profile = await getProfile();
  if (profile?.onboarding_complete) redirect("/dashboard");

  const name = profile?.full_name ?? "";

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
      <div className="mb-6 flex justify-center">
        <Logo href={null} size={60} priority />
      </div>
      <OnboardingWizard defaultName={name} />
      <p className="mt-6 text-center text-xs text-charcoal-soft">
        Welcome{name ? `, ${firstName(name)}` : ""}. Your information is private
        and yours to edit anytime.
      </p>
    </div>
  );
}
