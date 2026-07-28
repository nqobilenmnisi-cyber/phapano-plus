import Link from "next/link";
import { redirect } from "next/navigation";
import { ProfileForm } from "@/components/ProfileForm";
import { AvatarUploader } from "@/components/AvatarUploader";
import { SupportLine } from "@/components/AppChrome";
import { Star, IconProfile } from "@/components/illustrations";
import {
  getProfile,
  getCurrentUser,
  getSavedFunding,
  getSavedProgrammes,
} from "@/lib/queries";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { careerStageLabels, firstName } from "@/lib/utils";

export const metadata = { title: "You — Phapano+" };

export default async function ProfilePage() {
  // Authenticated user's own data only. getProfile self-heals (creates the row
  // if missing) so a signed-in user always has a profile to show.
  const [user, profile, savedProgrammes, savedFunding] =
    await Promise.all([
      getCurrentUser(),
      getProfile(),
      getSavedProgrammes(),
      getSavedFunding(),
    ]);

  if (isSupabaseConfigured && !user) redirect("/login?redirect=/app/profile");

  const name = profile?.full_name ?? "";
  const initial = firstName(name).slice(0, 1).toUpperCase();
  const email = user?.email ?? profile?.email ?? "";
  const stageLabel =
    profile?.career_stage === "other"
      ? profile?.career_stage_other || "Other"
      : profile?.career_stage
        ? careerStageLabels[profile.career_stage]
        : null;

  const counts = {
    programmes: savedProgrammes.filter((programme) => programme.is_saved).length,
    funding: savedFunding.length,
  };

  return (
    <main className="mx-auto max-w-2xl px-6">
      <section className="relative overflow-hidden pt-7">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="font-sora text-2xl font-bold tracking-tight">
              {name || "Your profile"}
            </h1>
            <p className="truncate text-sm text-charcoal-soft">
              {stageLabel ?? "Welcome to Phapano+"}
              {profile?.university ? ` · ${profile.university}` : ""}
            </p>
            {email && (
              <p className="mt-0.5 truncate text-sm text-charcoal-soft">{email}</p>
            )}
          </div>
        </div>

        {/* avatar uploader */}
        {isSupabaseConfigured && user && (
          <div className="mt-5">
            <AvatarUploader
              userId={user.id}
              initialUrl={profile?.avatar_url ?? null}
              initial={initial}
            />
          </div>
        )}

        {profile?.founding_member && (
          <div className="mt-5 flex items-center gap-3 rounded-card border border-bronze-soft bg-gradient-to-b from-white to-[#FBF7F3] px-5 py-4 shadow-card">
            <Star className="h-7 w-7 flex-none" />
            <div>
              <b className="font-sora text-sm font-bold text-bronze-deep">
                Founding member
              </b>
              <p className="text-sm text-charcoal-soft">
                You joined Phapano+ early. Thank you for helping build it.
              </p>
            </div>
          </div>
        )}
      </section>

      {/* saved content summary */}
      <section className="mt-8 grid grid-cols-2 gap-3">
        <SummaryTile label="Programmes saved" value={counts.programmes} href="/app/apply" />
        <SummaryTile label="Funding saved" value={counts.funding} href="/app/funding" />
      </section>

      {/* edit profile */}
      <section className="mt-9">
        <div className="mb-3 flex items-center gap-2">
          <IconProfile className="h-6 w-6" />
          <h2 className="font-sora text-lg font-bold tracking-tight">
            Your details
          </h2>
        </div>
        {profile ? (
          <ProfileForm profile={profile} />
        ) : (
          <p className="rounded-card border border-line bg-soft px-5 py-4 text-sm text-charcoal-soft">
            Connect Supabase to edit your profile.
          </p>
        )}
      </section>

      <section className="mt-9">
        <Link href="/app/settings" className="btn-secondary w-full">
          Settings &amp; privacy
        </Link>
      </section>

      <SupportLine />
    </main>
  );
}

function SummaryTile({
  label,
  value,
  href,
}: {
  label: string;
  value: number;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="card flex flex-col items-center px-3 py-5 text-center transition hover:-translate-y-0.5 hover:shadow-lift"
    >
      <span className="font-sora text-2xl font-extrabold tabular-nums text-blue-action">
        {value}
      </span>
      <span className="mt-1 text-xs font-semibold text-charcoal-soft">
        {label}
      </span>
    </Link>
  );
}
