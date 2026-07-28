import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CommunityProfileView } from "@/components/CommunityProfileView";
import { getMemberProfile, getMyUserId } from "@/lib/community";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata = { title: "Community profile — Phapano+" };

export default async function CommunityMemberPage({
  params,
}: {
  params: { id: string };
}) {
  if (!isSupabaseConfigured) notFound();
  const uid = await getMyUserId();
  if (!uid) notFound();

  if (params.id === uid) {
    redirect("/app/community/profile");
  }

  const member = await getMemberProfile(params.id);
  if (!member?.profile) notFound();

  return (
    <main className="mx-auto max-w-2xl px-6 pb-12">
      <section className="pt-7">
        <Link
          href="/app/community/people"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-charcoal-soft hover:text-charcoal"
        >
          ← Back to people
        </Link>
      </section>

      <CommunityProfileView
        profile={member.profile}
        followers={member.followers}
        following={member.following}
        followedByMe={member.followedByMe}
        blockedByMe={member.blockedByMe}
        posts={member.posts}
        viewerId={uid}
      />
    </main>
  );
}
