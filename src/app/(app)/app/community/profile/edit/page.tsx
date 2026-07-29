import Link from "next/link";
import { CommunityProfileForm } from "@/components/CommunityProfileForm";
import { getMyCommunityProfile } from "@/lib/community";
import { getProfile } from "@/lib/queries";

export const metadata = { title: "Edit Community profile | Phapano+" };

export default async function CommunityProfileEditPage() {
  const [existing, passport] = await Promise.all([
    getMyCommunityProfile(),
    getProfile(),
  ]);

  return (
    <main className="mx-auto max-w-2xl px-6 pb-12">
      <section className="pt-7">
        <Link
          href="/app/community/profile"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-charcoal-soft hover:text-charcoal"
        >
          ← Back to my profile
        </Link>
        <h1 className="mt-3 font-sora text-3xl font-bold tracking-tight">
          Edit Community profile
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-charcoal-soft">
          Choose what other members can see from your Phapano Passport. Your
          private records remain private.
        </p>
      </section>
      <div className="card mt-5 p-6">
        <CommunityProfileForm
          existing={existing}
          passport={passport}
        />
      </div>
    </main>
  );
}
