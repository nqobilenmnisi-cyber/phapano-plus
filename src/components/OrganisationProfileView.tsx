import Link from "next/link";
import { CommunityMemberActions } from "@/components/CommunityMemberActions";
import { CommunityPostCard } from "@/components/CommunityPostCard";
import { MemberAvatar } from "@/components/CommunityShared";
import { VerificationBadges } from "@/components/VerificationBadges";
import { safeExternalProfileUrl } from "@/lib/community-profile-fields";
import type {
  CommunityPostView,
  OrganisationPage,
} from "@/types/database";

export function OrganisationProfileView({
  page,
  parentPage,
  followers,
  following,
  followedByMe,
  blockedByMe,
  posts,
  viewerId,
  canManage,
}: {
  page: OrganisationPage;
  parentPage: Pick<OrganisationPage, "id" | "name"> | null;
  followers: number;
  following: number;
  followedByMe: boolean;
  blockedByMe: boolean;
  posts: CommunityPostView[];
  viewerId: string;
  canManage: boolean;
}) {
  const website = safeExternalProfileUrl(page.website_url);

  return (
    <>
      <section className="card mt-4 overflow-hidden">
        <div
          className="h-24 bg-gradient-to-br from-blue-tint via-[#e8f4ff] to-bronze-soft/50 sm:h-28"
          aria-hidden="true"
        />
        <div className="-mt-12 px-5 pb-6 sm:px-7">
          <div className="flex items-end justify-between gap-4">
            <div className="rounded-full bg-white p-1.5 shadow-card">
              <MemberAvatar
                name={page.name}
                avatarUrl={page.avatar_url}
                size={92}
              />
            </div>
            {canManage && (
              <Link
                href={`/app/organisations/${page.id}/edit`}
                className="btn-secondary mb-1 inline-flex !px-4 !py-2 text-sm"
              >
                Manage page
              </Link>
            )}
          </div>

          <div className="mt-4">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="break-words font-sora text-2xl font-bold tracking-tight sm:text-3xl">
                {page.name}
              </h1>
              <VerificationBadges
                organisationType={page.page_type}
                officialOrganisation={page.is_official}
              />
            </div>
            {page.tagline && (
              <p className="mt-2 break-words text-[0.95rem] font-semibold leading-snug text-charcoal">
                {page.tagline}
              </p>
            )}
            {page.about && (
              <p className="mt-3 max-w-2xl whitespace-pre-wrap text-sm leading-relaxed text-charcoal-soft">
                {page.about}
              </p>
            )}
          </div>

          <div className="mt-5 grid grid-cols-2 divide-x divide-line rounded-card border border-line bg-soft/70 py-3">
            <OrganisationStat
              value={followers}
              label={followers === 1 ? "Follower" : "Followers"}
            />
            <OrganisationStat value={following} label="Following" />
          </div>

          <div className="mt-4">
            <CommunityMemberActions
              userId={page.id}
              followedByMe={followedByMe}
              blockedByMe={blockedByMe}
              displayName={page.name}
              connectionId={null}
              connectionState="none"
              connectionNote={null}
              canConnect={false}
              allowConnection={false}
              identityLabel="page"
            />
          </div>

          {(page.parent_page_id ||
            page.location ||
            page.contact_email ||
            website ||
            page.focus_areas.length > 0 ||
            page.services.length > 0) && (
            <div className="mt-6 border-t border-line pt-5">
              <h2 className="text-xs font-extrabold uppercase tracking-[0.14em] text-charcoal-soft">
                Organisation details
              </h2>
              <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
                <OrganisationDetail
                  label="Page type"
                  value={
                    page.page_type === "initiative"
                      ? "Organisation initiative"
                      : "Organisation"
                  }
                />
                {parentPage && (
                  <OrganisationDetail
                    label="Parent organisation"
                    value={parentPage.name}
                    href={`/app/community/member/${parentPage.id}`}
                  />
                )}
                {page.location && (
                  <OrganisationDetail label="Location" value={page.location} />
                )}
                {page.contact_email && (
                  <OrganisationDetail
                    label="Contact"
                    value={page.contact_email}
                    href={`mailto:${page.contact_email}`}
                  />
                )}
                {website && (
                  <OrganisationDetail
                    label="Website"
                    value="Visit website"
                    href={website}
                    external
                  />
                )}
              </dl>
              {page.focus_areas.length > 0 && (
                <TagList label="Focus areas" values={page.focus_areas} />
              )}
              {page.services.length > 0 && (
                <TagList label="What we offer" values={page.services} />
              )}
            </div>
          )}
        </div>
      </section>

      {!blockedByMe && (
        <section className="mt-6">
          <div className="mb-3 flex items-center justify-between border-b border-line">
            <h2 className="border-b-2 border-blue-action px-1 pb-3 font-sora text-base font-bold tracking-tight text-charcoal">
              Posts
            </h2>
            <span className="pb-3 text-xs font-semibold text-charcoal-soft">
              {posts.length} {posts.length === 1 ? "post" : "posts"}
            </span>
          </div>
          {posts.length === 0 ? (
            <p className="text-sm text-charcoal-soft">No posts yet.</p>
          ) : (
            <div className="space-y-3">
              {posts.map((post) => (
                <CommunityPostCard
                  key={post.id}
                  post={post}
                  viewerId={viewerId}
                />
              ))}
            </div>
          )}
        </section>
      )}
    </>
  );
}

function OrganisationStat({ value, label }: { value: number; label: string }) {
  return (
    <span className="flex flex-col items-center px-1 text-center">
      <span className="font-sora text-lg font-bold text-charcoal">{value}</span>
      <span className="mt-0.5 text-[0.68rem] font-semibold text-charcoal-soft sm:text-xs">
        {label}
      </span>
    </span>
  );
}

function OrganisationDetail({
  label,
  value,
  href,
  external = false,
}: {
  label: string;
  value: string;
  href?: string;
  external?: boolean;
}) {
  return (
    <div className="rounded-card bg-soft px-4 py-3">
      <dt className="text-xs font-semibold text-charcoal-soft">{label}</dt>
      <dd className="mt-1 text-sm font-semibold text-charcoal">
        {href ? (
          <a
            href={href}
            target={external ? "_blank" : undefined}
            rel={external ? "noreferrer" : undefined}
            className="text-blue-deep hover:underline"
          >
            {value}
          </a>
        ) : (
          value
        )}
      </dd>
    </div>
  );
}

function TagList({ label, values }: { label: string; values: string[] }) {
  return (
    <div className="mt-4">
      <h3 className="text-xs font-semibold text-charcoal-soft">{label}</h3>
      <ul className="mt-2 flex flex-wrap gap-2">
        {values.map((value) => (
          <li
            key={value}
            className="rounded-chip border border-blue/30 bg-white px-3 py-1.5 text-xs font-semibold text-blue-deep"
          >
            {value}
          </li>
        ))}
      </ul>
    </div>
  );
}
