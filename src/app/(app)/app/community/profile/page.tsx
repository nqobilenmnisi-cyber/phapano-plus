import Link from "next/link";
import { notFound } from "next/navigation";
import { CommunityProfileView } from "@/components/CommunityProfileView";
import { getMemberProfile, getMyUserId } from "@/lib/community";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata = { title: "My Community profile — Phapano+" };

export default async function MyCommunityProfilePage() {
  if (!isSupabaseConfigured) notFound();
  const uid = await getMyUserId();
  if (!uid) notFound();
  const member = await getMemberProfile(uid);

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
          My profile
        </h1>
      </section>

      {member?.profile ? (
        <CommunityProfileView
          profile={member.profile}
          followers={member.followers}
          following={member.following}
          followedByMe={false}
          blockedByMe={false}
          posts={member.posts}
          viewerId={uid}
          isOwnProfile
        />
      ) : (
        <section className="card mt-4 p-6">
          <h2 className="font-sora text-xl font-bold tracking-tight">
            Create your Community profile
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-charcoal-soft">
            Add the identity other members will see when you post and take
            part in Community.
          </p>
          <Link
            href="/app/community/profile/edit"
            className="btn-primary mt-5 inline-flex"
          >
            Create profile
          </Link>
        </section>
      )}
    </main>
  );
}
