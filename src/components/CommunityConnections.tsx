"use client";

import Link from "next/link";
import { ConnectionButton } from "@/components/ConnectionButton";
import { FollowButton } from "@/components/CommunityPeople";
import { MemberAvatar } from "@/components/CommunityShared";
import type {
  CommunityConnectionItem,
  CommunityConnectionState,
} from "@/types/database";

export function CommunityConnections({
  connections,
  incoming,
  outgoing,
}: {
  connections: CommunityConnectionItem[];
  incoming: CommunityConnectionItem[];
  outgoing: CommunityConnectionItem[];
}) {
  return (
    <div className="space-y-7">
      <section aria-labelledby="connection-requests-heading">
        <div className="rounded-card border border-blue/20 bg-gradient-to-r from-blue-tint/60 to-white p-5 sm:flex sm:items-end sm:justify-between sm:gap-4">
          <div>
            <h2
              id="connection-requests-heading"
              className="font-sora text-xl font-bold tracking-tight"
            >
              Connection requests
            </h2>
            <p className="mt-1 text-sm text-charcoal-soft">
              Requests are private between you and the other member.
            </p>
          </div>
          {incoming.length > 0 && (
            <span className="rounded-full bg-blue-tint px-2.5 py-1 text-xs font-bold text-blue-deep">
              {incoming.length} new
            </span>
          )}
        </div>

        {incoming.length === 0 && outgoing.length === 0 ? (
          <div className="card mt-4 border-dashed p-5 text-sm text-charcoal-soft">
            You have no pending connection requests.
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {incoming.map((item) => (
              <ConnectionRow key={item.connection_id} item={item} />
            ))}
            {outgoing.length > 0 && (
              <div className="pt-2">
                <h3 className="mb-2 text-xs font-extrabold uppercase tracking-wider text-charcoal-soft">
                  Sent
                </h3>
                <div className="space-y-3">
                  {outgoing.map((item) => (
                    <ConnectionRow key={item.connection_id} item={item} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      <section aria-labelledby="my-connections-heading">
        <div>
          <h2
            id="my-connections-heading"
            className="font-sora text-xl font-bold tracking-tight"
          >
            Your connections
          </h2>
          <p className="mt-1 text-sm text-charcoal-soft">
            Only you can browse this list. Your public profile shows the count.
          </p>
        </div>

        {connections.length === 0 ? (
          <div className="card mt-4 border-dashed p-5 text-sm text-charcoal-soft">
            No connections yet.{" "}
            <Link
              href="/app/community/people"
              className="font-semibold text-blue-action hover:underline"
            >
              Discover people in the psychology community
            </Link>
            .
          </div>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {connections.map((item) => (
              <ConnectionRow
                key={item.connection_id}
                item={item}
                compact
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function ConnectionRow({
  item,
  compact = false,
}: {
  item: CommunityConnectionItem;
  compact?: boolean;
}) {
  const member = item.member;
  const state: CommunityConnectionState =
    item.direction === "incoming"
      ? "incoming_pending"
      : item.direction === "outgoing"
        ? "outgoing_pending"
        : "connected";

  return (
    <div
      className={`card border-line/90 p-4 transition hover:border-blue/35 hover:shadow-md ${
        compact ? "h-full" : ""
      }`}
    >
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
          <Link
            href={`/app/community/member/${member.user_id}`}
            className="block truncate font-semibold text-charcoal hover:underline"
          >
            {member.display_name}
          </Link>
          {(member.headline || member.institution) && (
            <p className="truncate text-xs text-charcoal-soft">
              {member.headline || member.institution}
            </p>
          )}
          <p className="mt-1 text-xs text-charcoal-soft">
            {item.direction === "incoming"
              ? "Wants to connect"
              : item.direction === "outgoing"
                ? "Request sent"
                : "Connected"}
          </p>
        </div>
      </div>

      {item.direction === "incoming" && item.note && (
        <blockquote className="mt-3 rounded-card border border-line bg-soft px-3 py-2.5 text-sm leading-relaxed text-charcoal">
          {item.note}
        </blockquote>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        {item.direction === "connected" && (
          <FollowButton
            userId={member.user_id}
            initiallyFollowing={member.followed_by_me}
          />
        )}
        <ConnectionButton
          userId={member.user_id}
          displayName={member.display_name}
          state={state}
          connectionId={item.connection_id}
          requestNote={item.note}
          canConnect
        />
      </div>
    </div>
  );
}
