"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import {
  searchMembersAction,
  toggleFollow,
} from "@/app/(app)/app/community/actions";
import { MemberAvatar } from "@/components/CommunityShared";
import { VerificationBadges } from "@/components/VerificationBadges";
import { careerStageLabels, streamLabels } from "@/lib/utils";
import type { CommunityMemberCard } from "@/types/database";

type Tab = "discover" | "followers" | "following";

export function CommunityPeople({
  initialMembers,
  followers,
  following,
}: {
  initialMembers: CommunityMemberCard[];
  followers: CommunityMemberCard[];
  following: CommunityMemberCard[];
}) {
  const [tab, setTab] = useState<Tab>("discover");
  const [q, setQ] = useState("");
  const [stage, setStage] = useState("");
  const [stream, setStream] = useState("");
  const [institution, setInstitution] = useState("");
  const [members, setMembers] = useState(initialMembers);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firstRun = useRef(true);

  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(async () => {
      setLoading(true);
      setFailed(false);
      try {
        const results = await searchMembersAction({
          q,
          stage,
          stream,
          institution,
        });
        setMembers(results);
      } catch {
        setFailed(true);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => {
      if (debounce.current) clearTimeout(debounce.current);
    };
  }, [q, stage, stream, institution]);

  const tabs: { id: Tab; label: string }[] = [
    { id: "discover", label: "Discover" },
    { id: "followers", label: `Followers (${followers.length})` },
    { id: "following", label: `Following (${following.length})` },
  ];

  const list =
    tab === "discover" ? members : tab === "followers" ? followers : following;

  return (
    <div>
      <div
        role="tablist"
        aria-label="People views"
        className="grid grid-cols-3 gap-1 rounded-card border border-line bg-soft p-1"
      >
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-chip px-2 py-2.5 text-xs font-bold transition sm:px-4 sm:text-sm ${
              tab === t.id
                ? "bg-white text-blue-deep shadow-sm"
                : "text-charcoal-soft hover:bg-white/70 hover:text-charcoal"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "discover" && (
        <div className="mt-4 grid gap-2 rounded-card border border-blue/20 bg-blue-tint/35 p-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="sr-only" htmlFor="people-search">
              Search members by display name
            </label>
            <input
              id="people-search"
              type="search"
              className="input"
              placeholder="Search by name…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <select
            aria-label="Filter by pathway stage"
            className="input"
            value={stage}
            onChange={(e) => setStage(e.target.value)}
          >
            <option value="">All stages</option>
            {Object.entries(careerStageLabels).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
          <select
            aria-label="Filter by psychology stream"
            className="input"
            value={stream}
            onChange={(e) => setStream(e.target.value)}
          >
            <option value="">All streams</option>
            {Object.entries(streamLabels).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
          <div className="sm:col-span-2">
            <label className="sr-only" htmlFor="people-institution">
              Filter by institution
            </label>
            <input
              id="people-institution"
              className="input"
              placeholder="Institution (e.g. UCT)…"
              value={institution}
              onChange={(e) => setInstitution(e.target.value)}
            />
          </div>
        </div>
      )}

      <div aria-live="polite" className="mt-5">
        {loading && (
          <p className="text-sm text-charcoal-soft">Searching members…</p>
        )}
        {failed && (
          <p className="text-sm text-bronze-deep">
            We couldn&apos;t load members.{" "}
            <button
              className="font-bold underline"
              onClick={() => setQ((v) => v + "")}
            >
              Try again
            </button>
          </p>
        )}
        {!loading && !failed && list.length === 0 && (
          <p className="text-sm text-charcoal-soft">
            {tab === "discover"
              ? "No members match that search yet. Try broadening your filters."
              : tab === "followers"
                ? "No followers yet. As you take part in the community, people will find you."
                : "You aren't following anyone yet. Discover members to build your feed."}
          </p>
        )}
        <ul className="grid gap-3 sm:grid-cols-2">
          {list.map((m) => (
            <MemberRow key={m.user_id} member={m} />
          ))}
        </ul>
      </div>
    </div>
  );
}

export function MemberRow({ member }: { member: CommunityMemberCard }) {
  return (
    <li className="card flex min-h-[8.5rem] flex-col items-stretch p-4">
      <div className="flex items-start gap-3">
      <Link
        href={`/app/community/member/${member.user_id}`}
        aria-label={`View ${member.display_name}'s profile`}
      >
        <MemberAvatar
          name={member.display_name}
          avatarUrl={member.avatar_url}
        />
      </Link>
      <div className="min-w-0 flex-1">
        <span className="flex min-w-0 items-center gap-1">
          <Link
            href={`/app/community/member/${member.user_id}`}
            className="truncate font-semibold text-charcoal hover:underline"
          >
            {member.display_name}
          </Link>
          {(member.verification_badges?.length ||
            member.official_organisation) && (
            <VerificationBadges
              badges={member.verification_badges}
              organisationType={member.organisation_type}
              officialOrganisation={member.official_organisation}
            />
          )}
        </span>
        {(member.headline || member.institution) && (
          <p className="truncate text-xs text-charcoal-soft">
            {member.headline || member.institution}
          </p>
        )}
      </div>
      </div>
      {member.bio && (
        <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-charcoal-soft">
          {member.bio}
        </p>
      )}
      <div className="mt-auto pt-3 [&>button]:w-full">
        <FollowButton
          userId={member.user_id}
          initiallyFollowing={member.followed_by_me}
        />
      </div>
    </li>
  );
}

export function FollowButton({
  userId,
  initiallyFollowing,
  subtleWhenFollowing = false,
}: {
  userId: string;
  initiallyFollowing: boolean;
  subtleWhenFollowing?: boolean;
}) {
  const [following, setFollowing] = useState(initiallyFollowing);
  const [pending, startTransition] = useTransition();

  function toggle() {
    const next = !following;
    setFollowing(next);
    startTransition(async () => {
      const result = await toggleFollow(userId, next);
      if ("error" in result) setFollowing(!next); // roll back
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      aria-pressed={following}
      className={
        following
          ? subtleWhenFollowing
            ? "shrink-0 rounded-chip px-4 py-2 text-sm font-semibold text-charcoal-soft transition hover:bg-soft hover:text-charcoal"
            : "btn-secondary shrink-0 !px-4 !py-2 text-sm"
          : "btn-primary shrink-0 !px-4 !py-2 text-sm"
      }
    >
      {following ? "Following" : "Follow"}
    </button>
  );
}
