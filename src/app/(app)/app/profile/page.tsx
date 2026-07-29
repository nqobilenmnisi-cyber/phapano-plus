import Link from "next/link";
import { redirect } from "next/navigation";
import { ProfileForm } from "@/components/ProfileForm";
import { CommunityProfileForm } from "@/components/CommunityProfileForm";
import { CommunityProfileView } from "@/components/CommunityProfileView";
import { AvatarUploader } from "@/components/AvatarUploader";
import { SupportLine } from "@/components/AppChrome";
import { Star, IconProfile } from "@/components/illustrations";
import { VerificationBadges } from "@/components/VerificationBadges";
import {
  getManagedOrganisationPages,
  getMemberProfile,
  getMyCommunityProfile,
  getMyUserId,
  getMyProfileVerifications,
} from "@/lib/community";
import {
  getProfile,
  getCurrentUser,
  getSavedFunding,
  getSavedProgrammes,
} from "@/lib/queries";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { careerStageLabels, firstName } from "@/lib/utils";

export const metadata = { title: "You | Phapano+" };

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ section?: string }>;
}) {
  const query = await searchParams;
  const section = query.section === "community" ? "community" : "passport";
  // Authenticated user's own data only. getProfile self-heals (creates the row
  // if missing) so a signed-in user always has a profile to show.
  const [user, profile, savedProgrammes, savedFunding] =
    await Promise.all([
      getCurrentUser(),
      getProfile(),
      getSavedProgrammes(),
      getSavedFunding(),
    ]);
  const [managedPages, verificationBadges] = await Promise.all([
    getManagedOrganisationPages(),
    getMyProfileVerifications(),
  ]);
  const communityProfile =
    section === "community" ? await getMyCommunityProfile() : null;
  const uid = section === "community" ? await getMyUserId() : null;
  const communityMember =
    section === "community" && uid && communityProfile
      ? await getMemberProfile(uid)
      : null;

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
    <main className="mx-auto max-w-2xl px-4 sm:px-6">
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
            {verificationBadges.length ? (
              <span className="mt-2 block">
                <VerificationBadges badges={verificationBadges} />
              </span>
            ) : null}
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

      <nav
        aria-label="You sections"
        className="mt-7 grid grid-cols-2 gap-1 rounded-card border border-line bg-soft p-1"
      >
        <Link
          href="/app/profile"
          aria-current={section === "passport" ? "page" : undefined}
          className={`rounded-chip px-3 py-2.5 text-center text-sm font-bold transition ${
            section === "passport"
              ? "bg-white text-blue-deep shadow-sm"
              : "text-charcoal-soft hover:bg-white/70 hover:text-charcoal"
          }`}
        >
          Phapano Passport
        </Link>
        <Link
          href="/app/profile?section=community"
          aria-current={section === "community" ? "page" : undefined}
          className={`rounded-chip px-3 py-2.5 text-center text-sm font-bold transition ${
            section === "community"
              ? "bg-white text-blue-deep shadow-sm"
              : "text-charcoal-soft hover:bg-white/70 hover:text-charcoal"
          }`}
        >
          Community profile
        </Link>
      </nav>

      {section === "passport" && managedPages.length > 0 && (
        <section className="mt-8">
          <h2 className="font-sora text-lg font-bold tracking-tight">
            Pages you manage
          </h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {managedPages.map((page) => (
              <Link
                key={page.id}
                href={`/app/organisations/${page.id}/edit`}
                className="card p-4 transition hover:-translate-y-0.5 hover:shadow-lift"
              >
                <span className="font-semibold text-charcoal">{page.name}</span>
                <span className="mt-1 block text-xs text-charcoal-soft">
                  Manage official page
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* saved content summary */}
      {section === "passport" && (
      <section className="mt-8 grid grid-cols-2 gap-3">
        <SummaryTile label="Programmes saved" value={counts.programmes} href="/app/apply" />
        <SummaryTile label="Funding saved" value={counts.funding} href="/app/funding" />
      </section>
      )}

      {/* edit profile */}
      {section === "passport" ? (
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
      ) : (
        <>
          <section id="community-settings" className="mt-9 scroll-mt-6">
            <h2 className="font-sora text-lg font-bold tracking-tight">
              Community profile &amp; privacy
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-charcoal-soft">
              Control your Community identity, profile visibility and which
              Passport fields other members can see.
            </p>
            <div className="card mt-4 p-6">
              <CommunityProfileForm
                existing={communityProfile}
                passport={profile}
              />
            </div>
          </section>

          {communityMember?.profile && uid && (
            <section className="mt-9">
              <h2 className="font-sora text-lg font-bold tracking-tight">
                Public profile preview
              </h2>
              <p className="mt-1 text-sm text-charcoal-soft">
                This is how your Community profile and posts appear to members.
              </p>
              <CommunityProfileView
                profile={communityMember.profile}
                followers={communityMember.followers}
                following={communityMember.following}
                connections={communityMember.connections}
                followedByMe={false}
                blockedByMe={false}
                connectionId={null}
                connectionState="none"
                connectionNote={null}
                canConnect={false}
                posts={communityMember.posts}
                viewerId={uid}
                isOwnProfile
                verificationBadges={communityMember.verificationBadges}
              />
            </section>
          )}
        </>
      )}

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
