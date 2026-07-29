"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  closeReport,
  setContentStatus,
  setModerationFlag,
  warnUser,
} from "@/app/admin/community/actions";
import { timeAgo } from "@/components/CommunityShared";
import type { CommunityReport } from "@/types/database";

export type PriorAction = {
  action: string;
  notes: string | null;
  created_at: string;
  by_me: boolean;
};

export type ModerationRow = CommunityReport & {
  reporter_name: string;
  reported_name: string;
  prior_reports: number;
  prior_actions: PriorAction[];
  resolved_by_me: boolean;
  content_removed: boolean | null; // null when target is a profile
  posting_restricted: boolean;
  community_suspended: boolean;
};

const CATEGORY_LABELS: Record<string, string> = {
  harassment: "Harassment or bullying",
  misinformation: "False or misleading information",
  scam: "Scam or suspicious opportunity",
  hate: "Hate or discrimination",
  sexual_content: "Sexual or inappropriate content",
  privacy: "Privacy violation",
  impersonation: "Impersonation",
  spam: "Spam or advertising",
  professional_misconduct: "Professional misconduct concern",
  other: "Other",
};

export function ModerationQueue({ rows }: { rows: ModerationRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="text-sm text-charcoal-soft">
        Nothing here. The queue is clear.
      </p>
    );
  }
  return (
    <ul className="space-y-4">
      {rows.map((r) => (
        <ReportCard key={r.id} report={r} />
      ))}
    </ul>
  );
}

function ReportCard({ report }: { report: ModerationRow }) {
  const router = useRouter();
  const [notes, setNotes] = useState(report.moderator_notes ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const open = report.status === "open";

  function run(fn: () => Promise<{ ok: true } | { error: string }>) {
    setMessage(null);
    startTransition(async () => {
      const result = await fn();
      if ("error" in result) setMessage(result.error);
      else router.refresh();
    });
  }

  return (
    <li className="card p-5">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-charcoal-soft">
        <span className="rounded-chip bg-soft px-2.5 py-1 font-bold text-charcoal">
          {CATEGORY_LABELS[report.category] ?? report.category}
        </span>
        <span className="font-semibold uppercase tracking-wide">
          {report.target_type}
        </span>
        <time dateTime={report.created_at}>{timeAgo(report.created_at)}</time>
        <span
          className={`rounded-chip px-2.5 py-1 font-bold ${
            open
              ? "bg-bronze-soft/50 text-bronze-deep"
              : "bg-soft text-charcoal-soft"
          }`}
        >
          {report.status}
        </span>
      </div>

      <dl className="mt-3 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs font-semibold text-charcoal-soft">Reported member</dt>
          <dd className="font-semibold text-charcoal">
            {report.reported_name}
            {report.prior_reports > 1 && (
              <span className="ml-2 text-xs font-bold text-bronze-deep">
                {report.prior_reports} reports total
              </span>
            )}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold text-charcoal-soft">Reported by</dt>
          <dd className="text-charcoal">{report.reporter_name}</dd>
        </div>
      </dl>

      {report.content_excerpt && (
        <blockquote className="mt-3 rounded-card border border-line bg-soft px-4 py-3 text-sm text-charcoal">
          {report.content_excerpt}
        </blockquote>
      )}
      {report.details && (
        <p className="mt-2 text-sm text-charcoal-soft">
          <span className="font-semibold">Reporter&apos;s note:</span>{" "}
          {report.details}
        </p>
      )}

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-charcoal-soft">
        {report.content_removed !== null && (
          <span>
            Content:{" "}
            <strong className={report.content_removed ? "text-bronze-deep" : ""}>
              {report.content_removed ? "removed" : "visible"}
            </strong>
          </span>
        )}
        <span>
          Posting:{" "}
          <strong className={report.posting_restricted ? "text-bronze-deep" : ""}>
            {report.posting_restricted ? "restricted" : "allowed"}
          </strong>
        </span>
        <span>
          Community profile:{" "}
          <strong className={report.community_suspended ? "text-bronze-deep" : ""}>
            {report.community_suspended ? "suspended" : "active"}
          </strong>
        </span>
        {report.action_taken && <span>Action taken: {report.action_taken}</span>}
      </div>

      {report.prior_actions.length > 0 && (
        <details className="mt-3">
          <summary className="cursor-pointer text-xs font-bold text-charcoal-soft">
            Moderation history for this account ({report.prior_actions.length})
          </summary>
          <ul className="mt-2 space-y-1.5">
            {report.prior_actions.map((a, i) => (
              <li key={i} className="rounded-card border border-line bg-soft px-3 py-2 text-xs text-charcoal-soft">
                <span className="font-bold text-charcoal">{a.action.replaceAll("_", " ")}</span>
                {" · "}
                {timeAgo(a.created_at)}
                {" · "}
                {a.by_me ? "by you" : "by another moderator"}
                {a.notes ? `: ${a.notes}` : ""}
              </li>
            ))}
          </ul>
        </details>
      )}

      {open && (
        <>
          <div className="mt-4 flex flex-wrap gap-2">
            {report.content_removed !== null && (
              <button
                className="btn-secondary !px-3.5 !py-2 text-sm"
                disabled={pending}
                onClick={() =>
                  run(() => setContentStatus(report, !report.content_removed))
                }
              >
                {report.content_removed ? "Restore content" : "Remove content"}
              </button>
            )}
            {report.target_user_id && (
              <>
                <button
                  className="btn-secondary !px-3.5 !py-2 text-sm"
                  disabled={pending}
                  onClick={() =>
                    run(() => warnUser(report.id, report.target_user_id!, notes))
                  }
                >
                  Warn user
                </button>
                <button
                  className="btn-secondary !px-3.5 !py-2 text-sm"
                  disabled={pending}
                  onClick={() =>
                    run(() =>
                      setModerationFlag(
                        report.id,
                        report.target_user_id!,
                        "posting_restricted",
                        !report.posting_restricted
                      )
                    )
                  }
                >
                  {report.posting_restricted
                    ? "Lift posting restriction"
                    : "Restrict posting"}
                </button>
                <button
                  className="btn-secondary !px-3.5 !py-2 text-sm"
                  disabled={pending}
                  onClick={() =>
                    run(() =>
                      setModerationFlag(
                        report.id,
                        report.target_user_id!,
                        "community_suspended",
                        !report.community_suspended
                      )
                    )
                  }
                >
                  {report.community_suspended
                    ? "Lift community suspension"
                    : "Suspend community profile"}
                </button>
              </>
            )}
          </div>

          <label
            className="label mt-4"
            htmlFor={`notes-${report.id}`}
          >
            Moderator notes (internal)
          </label>
          <textarea
            id={`notes-${report.id}`}
            className="input min-h-16"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={pending}
          />
          <div className="mt-3 flex gap-2">
            <button
              className="btn-secondary flex-1"
              disabled={pending}
              onClick={() => run(() => closeReport(report.id, "dismissed", notes, "No action needed"))}
            >
              Dismiss report
            </button>
            <button
              className="btn-primary flex-1"
              disabled={pending}
              onClick={() => run(() => closeReport(report.id, "resolved", notes, "Handled by moderator"))}
            >
              Mark resolved
            </button>
          </div>
        </>
      )}

      {!open && (
        <p className="mt-3 text-xs text-charcoal-soft">
          Closed {report.resolved_at ? timeAgo(report.resolved_at) : ""} by{" "}
          {report.resolved_by_me ? "you" : "another moderator"}
          {report.moderator_notes ? (
            <>
              {" "}
              <span className="font-semibold">Notes:</span>{" "}
              {report.moderator_notes}
            </>
          ) : null}
        </p>
      )}

      {message && (
        <p
          aria-live="polite"
          className="mt-3 rounded-chip border border-bronze-soft bg-bronze-soft/40 px-4 py-2.5 text-sm text-bronze-deep"
        >
          {message}
        </p>
      )}
    </li>
  );
}
