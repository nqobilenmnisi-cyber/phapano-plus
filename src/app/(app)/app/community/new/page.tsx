import Link from "next/link";
import { redirect } from "next/navigation";
import { CommunityComposer } from "@/components/CommunityComposer";
import {
  getManagedOrganisationPages,
  getMyCommunityProfile,
  getMyModerationState,
  getMyUserId,
  hasAcceptedGuidelines,
} from "@/lib/community";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata = { title: "Create a post | Phapano+" };

export default async function CreateCommunityPostPage() {
  if (!isSupabaseConfigured) {
    return (
      <main className="mx-auto max-w-2xl px-4 pb-12 pt-6 sm:px-6">
        <h1 className="font-sora text-2xl font-bold tracking-tight">
          Create a post
        </h1>
        <p className="mt-3 text-sm text-charcoal-soft">
          Posting becomes available when Phapano+ is connected to a live
          account.
        </p>
      </main>
    );
  }

  const [uid, profile, accepted, moderation, managedPages] = await Promise.all([
    getMyUserId(),
    getMyCommunityProfile(),
    hasAcceptedGuidelines(),
    getMyModerationState(),
    getManagedOrganisationPages(),
  ]);
  if (!uid) redirect("/login?redirect=/app/community/new");
  if (!profile) redirect("/app/profile?section=community");

  const unavailable =
    moderation.community_suspended || moderation.posting_restricted;

  return (
    <main className="mx-auto max-w-2xl px-4 pb-12 pt-6 sm:px-6">
      <Link
        href="/app/community"
        className="inline-flex items-center gap-1 text-sm font-semibold text-charcoal-soft hover:text-charcoal"
      >
        ← Back to Community
      </Link>
      <h1 className="mt-4 font-sora text-2xl font-bold tracking-tight">
        Create a post
      </h1>
      <p className="mt-1 text-sm text-charcoal-soft">
        Share something useful with the psychology community.
      </p>

      {unavailable ? (
        <div className="card mt-5 border-bronze-soft bg-[#FCF6F2] p-5 text-sm text-charcoal">
          Posting is not available on your account right now. You can still
          read and react in Community.
        </div>
      ) : (
        <div className="mt-5">
          <CommunityComposer
            acceptedGuidelines={accepted}
            viewerId={uid}
            personalIdentity={{
              id: uid,
              name: profile.display_name,
              avatarUrl: profile.avatar_url,
              official: false,
            }}
            managedPages={managedPages.map((page) => ({
              id: page.id,
              name: page.name,
              avatarUrl: page.avatar_url,
              official: page.is_official,
            }))}
          />
        </div>
      )}
    </main>
  );
}
