import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CommunityProfileView } from "@/components/CommunityProfileView";
import { getMemberProfile, getMyUserId } from "@/lib/community";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata = { title: "Community profile | Phapano+" };

export default async function CommunityMemberPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!isSupabaseConfigured) notFound();
  const { id } = await params;
  const uid = await getMyUserId();
  if (!uid) notFound();

  if (id === uid) {
    redirect("/app/community/profile");
  }

  const member = await getMemberProfile(id);
  if (!member?.profile) notFound();

  return (
    <main className="mx-auto max-w-3xl px-5 pb-12 sm:px-6">
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
        connections={member.connections}
        followedByMe={member.followedByMe}
        blockedByMe={member.blockedByMe}
        connectionId={member.connectionId}
        connectionState={member.connectionState}
        connectionNote={member.connectionNote}
        canConnect={member.canConnect}
        posts={member.posts}
        viewerId={uid}
      />
    </main>
  );
}
