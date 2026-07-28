import Link from "next/link";
import { CommunityProfileForm } from "@/components/CommunityProfileForm";
import { getMyCommunityProfile } from "@/lib/community";
import { getProfile } from "@/lib/queries";

export const metadata = { title: "Community profile — Phapano+" };

export default async function CommunityProfileEditPage() {
  const [existing, passport] = await Promise.all([
    getMyCommunityProfile(),
    getProfile(),
  ]);

  return (
    <main className="mx-auto max-w-2xl px-6 pb-12">
      <section className="pt-7">
        <Link
          href="/app/community"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-charcoal-soft hover:text-charcoal"
        >
          ← Back to community
        </Link>
        <h1 className="mt-3 font-sora text-3xl font-bold tracking-tight">
          Your community profile
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-charcoal-soft">
          This is what other members can see. Your Phapano Passport,
          applications, notes and funding records are never shown here.
        </p>
      </section>
      <div className="card mt-5 p-6">
        <CommunityProfileForm
          existing={existing}
          defaults={{
            name: passport?.full_name ?? "",
            stage: passport?.career_stage ?? "",
            stageOther: passport?.career_stage_other ?? "",
            institution: passport?.university ?? "",
          }}
        />
      </div>
    </main>
  );
}
