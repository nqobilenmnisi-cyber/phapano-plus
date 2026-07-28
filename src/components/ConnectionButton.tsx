"use client";

import {
  useEffect,
  useRef,
  useState,
  useTransition,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { useRouter } from "next/navigation";
import {
  cancelConnectionRequest,
  removeConnection,
  respondToConnection,
  sendConnection,
  type ActionResult,
} from "@/app/(app)/app/community/actions";
import { CONNECTION_NOTE_MAX_LENGTH } from "@/lib/community-connections";
import type { CommunityConnectionState } from "@/types/database";

type ConnectionButtonProps = {
  userId: string;
  displayName: string;
  state: CommunityConnectionState;
  connectionId: string | null;
  requestNote: string | null;
  canConnect: boolean;
};

const LABELS: Record<CommunityConnectionState, string> = {
  none: "Connect",
  outgoing_pending: "Request sent",
  incoming_pending: "Respond",
  connected: "Connected",
};

export function ConnectionButton({
  userId,
  displayName,
  state,
  connectionId,
  requestNote,
  canConnect,
}: ConnectionButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  const unavailable = state === "none" && !canConnect;

  useEffect(() => {
    if (!open) return;
    cancelRef.current?.focus();
  }, [open]);

  function close() {
    if (pending) return;
    setOpen(false);
    setError(null);
    setNote("");
  }

  function onDialogKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      close();
      return;
    }
    if (event.key !== "Tab") return;

    const controls = Array.from(
      dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), textarea:not([disabled])'
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

  function run(action: () => Promise<ActionResult>) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setOpen(false);
      setNote("");
      router.refresh();
    });
  }

  function primaryAction() {
    if (state === "none") {
      run(() => sendConnection(userId, note));
      return;
    }
    if (state === "outgoing_pending" && connectionId) {
      run(() => cancelConnectionRequest(connectionId));
      return;
    }
    if (state === "incoming_pending" && connectionId) {
      run(() => respondToConnection(connectionId, "accept"));
      return;
    }
    if (state === "connected" && connectionId) {
      run(() => removeConnection(connectionId));
    }
  }

  const title =
    state === "none"
      ? `Connect with ${displayName}?`
      : state === "outgoing_pending"
        ? "Connection request sent"
        : state === "incoming_pending"
          ? `${displayName} wants to connect`
          : `Connected with ${displayName}`;

  const description =
    state === "none"
      ? "Connections are mutual. If they accept, you will also follow each other's public Community updates."
      : state === "outgoing_pending"
        ? "Your request is waiting for a response. Cancelling it will start a 24-hour pause before you can send another request."
        : state === "incoming_pending"
          ? "Accept to become mutual connections and follow each other's public Community updates."
          : "Removing this connection will not automatically unfollow either person.";

  const primaryLabel =
    state === "none"
      ? "Send request"
      : state === "outgoing_pending"
        ? "Cancel request"
        : state === "incoming_pending"
          ? "Accept"
          : "Remove connection";

  return (
    <>
      <button
        type="button"
        className={
          state === "none" || state === "incoming_pending"
            ? "btn-primary shrink-0 !px-4 !py-2 text-sm"
            : "btn-secondary shrink-0 !px-4 !py-2 text-sm"
        }
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
        disabled={pending || unavailable}
        aria-label={
          unavailable
            ? `${displayName} is not accepting connection requests from you`
            : `${LABELS[state]} ${displayName}`
        }
        title={
          unavailable
            ? "This member is not accepting connection requests from you."
            : undefined
        }
      >
        {LABELS[state]}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/40 px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="connection-dialog-title"
          aria-describedby="connection-dialog-description"
          onKeyDown={onDialogKeyDown}
        >
          <div
            ref={dialogRef}
            className="w-full max-w-md rounded-card border border-line bg-paper p-6 shadow-lg"
          >
            <h2
              id="connection-dialog-title"
              className="font-sora text-lg font-bold tracking-tight"
            >
              {title}
            </h2>
            <p
              id="connection-dialog-description"
              className="mt-2 text-sm leading-relaxed text-charcoal-soft"
            >
              {description}
            </p>

            {state === "none" && (
              <div className="mt-4">
                <label htmlFor="connection-note" className="label">
                  Add a short note
                </label>
                <textarea
                  id="connection-note"
                  className="input min-h-24"
                  maxLength={CONNECTION_NOTE_MAX_LENGTH}
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="Introduce yourself and say why you would like to connect."
                  disabled={pending}
                />
                <p className="mt-1 text-xs text-charcoal-soft">
                  {note.length}/{CONNECTION_NOTE_MAX_LENGTH} characters
                </p>
              </div>
            )}

            {state === "incoming_pending" && requestNote && (
              <blockquote className="mt-4 rounded-card border border-line bg-soft px-4 py-3 text-sm leading-relaxed text-charcoal">
                {requestNote}
              </blockquote>
            )}

            {error && (
              <p className="mt-4 text-sm text-bronze-deep" aria-live="polite">
                {error}
              </p>
            )}

            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button
                ref={cancelRef}
                type="button"
                className="btn-secondary !px-4 !py-2 text-sm"
                onClick={close}
                disabled={pending}
              >
                Close
              </button>
              {state === "incoming_pending" && connectionId && (
                <button
                  type="button"
                  className="btn-secondary !px-4 !py-2 text-sm"
                  onClick={() =>
                    run(() => respondToConnection(connectionId, "decline"))
                  }
                  disabled={pending}
                >
                  Decline
                </button>
              )}
              <button
                type="button"
                className={
                  state === "outgoing_pending" || state === "connected"
                    ? "inline-flex items-center justify-center rounded-chip border border-bronze-soft px-4 py-2 text-sm font-semibold text-bronze-deep transition hover:bg-[#FCF6F2]"
                    : "btn-primary !px-4 !py-2 text-sm"
                }
                onClick={primaryAction}
                disabled={pending}
                aria-busy={pending}
              >
                {pending ? "One moment…" : primaryLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
