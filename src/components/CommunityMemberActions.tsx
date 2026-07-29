"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  useTransition,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { useRouter } from "next/navigation";
import { blockUser, unblockUser } from "@/app/(app)/app/community/actions";
import { FollowButton } from "@/components/CommunityPeople";
import { ConnectionButton } from "@/components/ConnectionButton";
import { ReportDialog } from "@/components/ReportDialog";
import type { CommunityConnectionState } from "@/types/database";

export function CommunityMemberActions({
  userId,
  followedByMe,
  blockedByMe,
  displayName,
  connectionId,
  connectionState,
  connectionNote,
  canConnect,
  allowConnection = true,
  identityLabel = "member",
}: {
  userId: string;
  followedByMe: boolean;
  blockedByMe: boolean;
  displayName: string;
  connectionId: string | null;
  connectionState: CommunityConnectionState;
  connectionNote: string | null;
  canConnect: boolean;
  allowConnection?: boolean;
  identityLabel?: "member" | "page";
}) {
  const router = useRouter();
  const menuId = useId();
  const [reporting, setReporting] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmingBlock, setConfirmingBlock] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const menuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const reportLabel =
    identityLabel === "page" ? "Report page" : "Report profile";
  const blockLabel = identityLabel === "page" ? "Block page" : "Block user";
  const blockTitle =
    identityLabel === "page" ? "Block this page?" : "Block this user?";

  useEffect(() => {
    if (!menuOpen) return;
    menuRef.current
      ?.querySelector<HTMLButtonElement>('[role="menuitem"]')
      ?.focus();

    function onPointerDown(event: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setMenuOpen(false);
      }
    }

    function onEscape(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setMenuOpen(false);
      menuButtonRef.current?.focus();
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onEscape);
    };
  }, [menuOpen]);

  useEffect(() => {
    if (!confirmingBlock) return;
    cancelButtonRef.current?.focus();
  }, [confirmingBlock]);

  function onMenuKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const items = Array.from(
      menuRef.current?.querySelectorAll<HTMLButtonElement>(
        '[role="menuitem"]'
      ) ?? []
    );
    if (!items.length) return;
    const current = items.indexOf(document.activeElement as HTMLButtonElement);
    let next = current;
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = items.length - 1;
    if (event.key === "ArrowDown") next = (current + 1) % items.length;
    if (event.key === "ArrowUp")
      next = (current - 1 + items.length) % items.length;
    items[next]?.focus();
  }

  function closeBlockDialog() {
    setConfirmingBlock(false);
    requestAnimationFrame(() => menuButtonRef.current?.focus());
  }

  function onDialogKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape" && !pending) {
      closeBlockDialog();
      return;
    }
    if (event.key !== "Tab") return;

    const controls = Array.from(
      dialogRef.current?.querySelectorAll<HTMLButtonElement>(
        'button:not([disabled])'
      ) ?? []
    );
    if (!controls.length) return;
    const first = controls[0];
    const last = controls[controls.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function doBlock() {
    setError(null);
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
    setError(null);
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
          type="button"
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
      <div className="min-w-[7rem] flex-1 [&>button]:w-full">
        <FollowButton
          userId={userId}
          initiallyFollowing={followedByMe}
          subtleWhenFollowing={connectionState === "connected"}
        />
      </div>
      {allowConnection && (
        <div className="min-w-[7rem] flex-1 [&>button]:w-full">
          <ConnectionButton
            userId={userId}
            displayName={displayName}
            state={connectionState}
            connectionId={connectionId}
            requestNote={connectionNote}
            canConnect={canConnect}
          />
        </div>
      )}

      <div className="relative" ref={menuRef}>
        <button
          ref={menuButtonRef}
          type="button"
          className="btn-secondary !h-10 !w-10 !rounded-full !px-0 !py-0 text-lg"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          aria-controls={menuOpen ? menuId : undefined}
          aria-label={`More actions for ${displayName}`}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span aria-hidden="true">⋯</span>
        </button>
        {menuOpen && (
          <div
            id={menuId}
            role="menu"
            aria-label={`Actions for ${displayName}`}
            className="absolute right-0 z-20 mt-1 w-44 overflow-hidden rounded-card border border-line bg-paper shadow-lg"
            onKeyDown={onMenuKeyDown}
          >
            <button
              type="button"
              role="menuitem"
              className="block w-full px-4 py-2.5 text-left text-sm text-charcoal hover:bg-soft"
              onClick={() => {
                setMenuOpen(false);
                setReporting(true);
              }}
            >
              {reportLabel}
            </button>
            <button
              type="button"
              role="menuitem"
              className="block w-full px-4 py-2.5 text-left text-sm text-bronze-deep hover:bg-soft"
              onClick={() => {
                setMenuOpen(false);
                setConfirmingBlock(true);
              }}
            >
              {blockLabel}
            </button>
          </div>
        )}
      </div>

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

      {confirmingBlock && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/40 px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="block-user-title"
          aria-describedby="block-user-description"
          onKeyDown={onDialogKeyDown}
        >
          <div
            ref={dialogRef}
            className="w-full max-w-sm rounded-card border border-line bg-paper p-6"
          >
            <h2
              id="block-user-title"
              className="font-sora text-lg font-bold tracking-tight"
            >
              {blockTitle}
            </h2>
            <p
              id="block-user-description"
              className="mt-2 text-sm leading-relaxed text-charcoal-soft"
            >
              {identityLabel === "page" ? (
                <>
                  You will no longer see this page&apos;s Community profile or
                  content. Any follow between you will also end. You can manage
                  blocked pages later in Settings.
                </>
              ) : (
                <>
                  You will no longer see each other&apos;s Community profiles or
                  content. Any follow or connection between you will also end.
                  You can manage blocked users later in Settings.
                </>
              )}
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                ref={cancelButtonRef}
                type="button"
                className="btn-secondary !px-4 !py-2 text-sm"
                onClick={closeBlockDialog}
                disabled={pending}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary !px-4 !py-2 text-sm"
                onClick={doBlock}
                disabled={pending}
                aria-busy={pending}
              >
                {pending ? "Blocking…" : blockLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
