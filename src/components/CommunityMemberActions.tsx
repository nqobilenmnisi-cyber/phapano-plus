"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { blockUser, unblockUser } from "@/app/(app)/app/community/actions";
import { FollowButton } from "@/components/CommunityPeople";
import { ReportDialog } from "@/components/ReportDialog";

export function CommunityMemberActions({
  userId,
  followedByMe,
  blockedByMe,
  displayName,
}: {
  userId: string;
  followedByMe: boolean;
  blockedByMe: boolean;
  displayName: string;
}) {
  const router = useRouter();
  const [reporting, setReporting] = useState(false);
  const [confirmingBlock, setConfirmingBlock] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function doBlock() {
    startTransition(async () => {
      const result = await blockUser(userId);
      if ("error" in result) setError(result.error);
      else {
        setConfirmingBlock(false);
        router.refresh();
      }
    });
  }

  function doUnblock() {
    startTransition(async () => {
      const result = await unblockUser(userId);
      if ("error" in result) setError(result.error);
      else router.refresh();
    });
  }

  if (blockedByMe) {
    return (
      <div className="rounded-card border border-line bg-soft px-5 py-4 text-sm">
        <p className="text-charcoal">
          You&apos;ve blocked this member. They can&apos;t see your posts, and
          you won&apos;t see theirs.
        </p>
        <button
          className="btn-secondary mt-3"
          onClick={doUnblock}
          disabled={pending}
        >
          {pending ? "One moment…" : "Unblock"}
        </button>
        {error && (
          <p className="mt-2 text-xs text-bronze-deep" aria-live="polite">
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <FollowButton userId={userId} initiallyFollowing={followedByMe} />
      <button
        className="btn-secondary !px-4 !py-2 text-sm"
        onClick={() => setReporting(true)}
      >
        Report
      </button>
      {confirmingBlock ? (
        <span className="flex items-center gap-2 text-sm">
          <span className="text-charcoal-soft">
            Block {displayName}?
          </span>
          <button
            className="font-bold text-bronze-deep"
            onClick={doBlock}
            disabled={pending}
          >
            {pending ? "Blocking…" : "Yes, block"}
          </button>
          <button
            className="font-semibold text-charcoal-soft"
            onClick={() => setConfirmingBlock(false)}
            disabled={pending}
          >
            Cancel
          </button>
        </span>
      ) : (
        <button
          className="btn-secondary !px-4 !py-2 text-sm"
          onClick={() => setConfirmingBlock(true)}
        >
          Block user
        </button>
      )}
      {error && (
        <p className="w-full text-xs text-bronze-deep" aria-live="polite">
          {error}
        </p>
      )}
      {reporting && (
        <ReportDialog
          targetType="profile"
          targetUserId={userId}
          onClose={() => setReporting(false)}
        />
      )}
    </div>
  );
}
