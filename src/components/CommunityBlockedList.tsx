"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { unblockUser } from "@/app/(app)/app/community/actions";
import { MemberAvatar } from "@/components/CommunityShared";
import type { CommunityMemberCard } from "@/types/database";

export function CommunityBlockedList({
  blocked,
}: {
  blocked: CommunityMemberCard[];
}) {
  if (blocked.length === 0) {
    return (
      <p className="text-sm text-charcoal-soft">
        You haven&apos;t blocked anyone.
      </p>
    );
  }
  return (
    <ul className="space-y-2">
      {blocked.map((m) => (
        <BlockedRow key={m.user_id} member={m} />
      ))}
    </ul>
  );
}

function BlockedRow({ member }: { member: CommunityMemberCard }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <li className="flex items-center gap-3 rounded-card border border-line bg-paper px-4 py-3">
      <MemberAvatar
        name={member.display_name}
        avatarUrl={member.avatar_url}
        size={32}
      />
      <span className="min-w-0 flex-1 truncate text-sm font-semibold text-charcoal">
        {member.display_name}
      </span>
      <button
        className="btn-secondary !px-3.5 !py-1.5 text-sm"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await unblockUser(member.user_id);
            if ("error" in result) setError(result.error);
            else router.refresh();
          })
        }
      >
        {pending ? "…" : "Unblock"}
      </button>
      {error && (
        <p className="text-xs text-bronze-deep" aria-live="polite">
          {error}
        </p>
      )}
    </li>
  );
}
