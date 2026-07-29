import Link from "next/link";
import { CommunityComposer } from "@/components/CommunityComposer";
import { CommunityPostCard } from "@/components/CommunityPostCard";
import { CommunityProfileForm } from "@/components/CommunityProfileForm";
import {
  getFeed,
  getMyCommunityProfile,
  getMyModerationState,
  getMyUserId,
  hasAcceptedGuidelines,
} from "@/lib/community";
import { getProfile } from "@/lib/queries";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata = { title: "Community | Phapano+" };

export default async function CommunityPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; before?: string }>;
}) {
  const query = await searchParams;
  const mode = query.tab === "discover" ? "discover" : "following";

  if (!isSupabaseConfigured) {
    return (
      <main className="mx-auto max-w-2xl px-6 pb-12">
        <Header mode={mode} />
        <p className="mt-6 text-sm text-charcoal-soft">
          The community opens once Phapano+ is connected to a live account.
        </p>
      </main>
    );
  }

  const [uid, communityProfile] = await Promise.all([
    getMyUserId(),
    getMyCommunityProfile(),
  ]);

  // First visit: set up the community profile before anything else.
  if (uid && !communityProfile) {
    const passport = await getProfile();
    return (
      <main className="mx-auto max-w-2xl px-6 pb-12">
        <section className="pb-2 pt-7">
          <h1 className="font-sora text-3xl font-bold tracking-tight">
            Join the community
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-charcoal-soft">
            Choose what fellow psychology students and professionals see about
            you. Your applications, notes, funding and documents stay private.
          </p>
        </section>
        <div className="card mt-4 p-6">
          <CommunityProfileForm
            existing={null}
            passport={passport}
          />
        </div>
        <p className="mt-4 text-center text-xs text-charcoal-soft">
          By joining you agree to our{" "}
          <Link
            href="/community-guidelines"
            className="font-semibold text-blue-action hover:underline"
          >
            Community Guidelines
          </Link>
          .
        </p>
      </main>
    );
  }

  const [{ posts, hasMore }, accepted, moderation] = await Promise.all([
    getFeed({ mode, before: query.before }),
    hasAcceptedGuidelines(),
    getMyModerationState(),
  ]);
  const canCompose =
    !moderation.community_suspended && !moderation.posting_restricted;

  const olderCursor =
    hasMore && posts.length ? posts[posts.length - 1].created_at : null;

  return (
    <main className="mx-auto max-w-2xl px-6 pb-12">
      <Header mode={mode} />

      {moderation.community_suspended ? (
        <div className="card mt-4 border-bronze-soft bg-[#FCF6F2] p-5 text-sm text-charcoal">
          Your community profile is currently suspended, so you can&apos;t post
          or comment. You can still read the community. If you think this was a
          mistake, please{" "}
          <Link href="/contact" className="font-semibold text-blue-action hover:underline">
            contact us
          </Link>
          .
        </div>
      ) : moderation.posting_restricted ? (
        <div className="card mt-4 border-bronze-soft bg-[#FCF6F2] p-5 text-sm text-charcoal">
          Posting is currently restricted on your account, so you can read and
          react but can&apos;t post or comment for now. If you think this was a
          mistake, please{" "}
          <Link href="/contact" className="font-semibold text-blue-action hover:underline">
            contact us
          </Link>
          .
        </div>
      ) : null}

      {canCompose && (
        <div className="mt-4">
          <CommunityComposer acceptedGuidelines={accepted} />
        </div>
      )}

      <div className="mt-5 space-y-3">
        {posts.length === 0 && (
          <div className="card p-6 text-sm text-charcoal-soft">
            {mode === "following" ? (
              <>
                Your feed is quiet for now. Posts from people you follow will
                appear here.{" "}
                <Link
                  href="/app/community/people"
                  className="font-semibold text-blue-action hover:underline"
                >
                  discover members to follow
                </Link>
                .
              </>
            ) : (
              "No community posts yet. Be the first to share something."
            )}
          </div>
        )}
        {posts.map((p) => (
          <CommunityPostCard key={p.id} post={p} viewerId={uid ?? ""} />
        ))}
      </div>

      {olderCursor && (
        <div className="mt-5 text-center">
          <Link
            href={`/app/community?tab=${mode}&before=${encodeURIComponent(olderCursor)}`}
            className="btn-secondary inline-block"
          >
            Load older posts
          </Link>
        </div>
      )}
    </main>
  );
}

function Header({ mode }: { mode: "following" | "discover" }) {
  return (
    <section className="pb-1 pt-7">
      <div className="flex items-center justify-between">
        <h1 className="font-sora text-3xl font-bold tracking-tight">
          Community
        </h1>
        <div className="flex gap-2">
          <Link
            href="/app/community/people"
            className="btn-secondary !px-3.5 !py-2 text-sm"
          >
            People
          </Link>
          <Link
            href="/app/community/profile"
            className="btn-secondary !px-3.5 !py-2 text-sm"
          >
            My profile
          </Link>
        </div>
      </div>
      <nav
        aria-label="Feed views"
        className="mt-5 flex gap-6 border-b border-line"
      >
        <Link
          href="/app/community"
          aria-current={mode === "following" ? "page" : undefined}
          className={`border-b-2 px-1 pb-3 text-sm font-bold transition ${
            mode === "following"
              ? "border-blue-action text-blue-deep"
              : "border-transparent text-charcoal-soft hover:text-charcoal"
          }`}
        >
          Following
        </Link>
        <Link
          href="/app/community?tab=discover"
          aria-current={mode === "discover" ? "page" : undefined}
          className={`border-b-2 px-1 pb-3 text-sm font-bold transition ${
            mode === "discover"
              ? "border-blue-action text-blue-deep"
              : "border-transparent text-charcoal-soft hover:text-charcoal"
          }`}
        >
          Discover
        </Link>
      </nav>
      <p className="mt-3 text-xs leading-relaxed text-charcoal-soft">
        A focused space for the South African psychology pathway. Please read
        the{" "}
        <Link
          href="/community-guidelines"
          className="font-semibold text-blue-action hover:underline"
        >
          Community Guidelines
        </Link>
        .
      </p>
    </section>
  );
}
