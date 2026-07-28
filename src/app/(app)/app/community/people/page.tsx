import Link from "next/link";
import { CommunityPeople } from "@/components/CommunityPeople";
import { getFollowLists, searchMembers } from "@/lib/community";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata = { title: "People — Phapano+" };

export default async function CommunityPeoplePage() {
  const [initialMembers, lists] = isSupabaseConfigured
    ? await Promise.all([searchMembers({}), getFollowLists()])
    : [[], { followers: [], following: [] }];

  return (
    <main className="mx-auto max-w-2xl px-6 pb-12">
      <section className="pb-4 pt-7">
        <Link
          href="/app/community"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-charcoal-soft hover:text-charcoal"
        >
          ← Back to community
        </Link>
        <div className="mt-3 flex items-center justify-between gap-4">
          <h1 className="font-sora text-3xl font-bold tracking-tight">
            People
          </h1>
          <Link
            href="/app/community/connections"
            className="btn-secondary shrink-0 !px-3.5 !py-2 text-sm"
          >
            Connections
          </Link>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-charcoal-soft">
          Find fellow psychology students and professionals across South
          Africa. Only members who chose to be visible appear here.
        </p>
      </section>
      <CommunityPeople
        initialMembers={initialMembers}
        followers={lists.followers}
        following={lists.following}
      />
    </main>
  );
}
