"use client";

import { useState, useTransition } from "react";
import { submitReport } from "@/app/(app)/app/community/actions";
import type {
  CommunityReportCategory,
  CommunityReportTargetType,
} from "@/types/database";

const CATEGORIES: { value: CommunityReportCategory; label: string }[] = [
  { value: "harassment", label: "Harassment or bullying" },
  { value: "misinformation", label: "False or misleading information" },
  { value: "scam", label: "Scam or suspicious opportunity" },
  { value: "hate", label: "Hate or discrimination" },
  { value: "sexual_content", label: "Sexual or inappropriate content" },
  { value: "privacy", label: "Privacy violation" },
  { value: "impersonation", label: "Impersonation" },
  { value: "spam", label: "Spam or advertising" },
  { value: "professional_misconduct", label: "Professional misconduct concern" },
  { value: "other", label: "Other" },
];

export function ReportDialog({
  targetType,
  targetUserId,
  postId,
  commentId,
  onClose,
}: {
  targetType: CommunityReportTargetType;
  targetUserId: string;
  postId?: string;
  commentId?: string;
  onClose: () => void;
}) {
  const [category, setCategory] = useState<CommunityReportCategory | "">("");
  const [details, setDetails] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  function send() {
    if (!category) {
      setMessage("Please choose what this report is about.");
      return;
    }
    setMessage(null);
    startTransition(async () => {
      const result = await submitReport({
        targetType,
        targetUserId,
        postId,
        commentId,
        category,
        details,
      });
      if ("error" in result) setMessage(result.error);
      else setDone(true);
    });
  }

  const noun =
    targetType === "post"
      ? "post"
      : targetType === "comment"
        ? "comment"
        : "profile";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Report this ${noun}`}
      className="fixed inset-0 z-50 flex items-end justify-center bg-charcoal/40 p-4 sm:items-center"
    >
      <div className="card w-full max-w-md p-6">
        {done ? (
          <div className="text-center">
            <h2 className="font-sora text-lg font-bold">Report submitted</h2>
            <p className="mt-2 text-sm text-charcoal-soft">
              Thank you for helping keep the community safe. Our team reviews
              every report.
            </p>
            <button className="btn-primary mt-5 w-full" onClick={onClose}>
              Done
            </button>
          </div>
        ) : (
          <>
            <h2 className="font-sora text-lg font-bold">
              Report this {noun}
            </h2>
            <p className="mt-1 text-sm text-charcoal-soft">
              Reports are private and only visible to the Phapano+ team.
            </p>
            <label className="label mt-4" htmlFor="report-category">
              What&apos;s the issue?
            </label>
            <select
              id="report-category"
              className="input"
              value={category}
              onChange={(e) =>
                setCategory(e.target.value as CommunityReportCategory)
              }
              disabled={pending}
            >
              <option value="">Choose a category…</option>
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
            <label className="label mt-3" htmlFor="report-details">
              Add context (optional)
            </label>
            <textarea
              id="report-details"
              className="input min-h-20"
              maxLength={1000}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              disabled={pending}
            />
            {message && (
              <p
                aria-live="polite"
                className="mt-3 rounded-chip border border-bronze-soft bg-bronze-soft/40 px-4 py-2.5 text-sm text-bronze-deep"
              >
                {message}
              </p>
            )}
            <div className="mt-4 flex gap-2">
              <button
                className="btn-secondary flex-1"
                onClick={onClose}
                disabled={pending}
              >
                Cancel
              </button>
              <button
                className="btn-primary flex-1"
                onClick={send}
                disabled={pending}
                aria-busy={pending}
              >
                {pending ? "Sending…" : "Submit report"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
