"use client";

import type { FundingOpportunity } from "@/types/database";

/**
 * Text-only funding card (no logos/icons). Shows provider, opportunity, study
 * level, eligible fields, a short description, a Bookmark toggle, and a link to
 * the official funder page.
 */
export function FundingCard({
  funding,
  saved,
  onToggle,
}: {
  funding: FundingOpportunity;
  saved: boolean;
  onToggle: (saved: boolean) => void;
}) {
  const officialUrl = funding.link ?? funding.source_url ?? null;

  return (
    <div className="card flex flex-col p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[0.68rem] font-extrabold uppercase tracking-wider text-charcoal-soft">
            {funding.provider ?? "Funding"}
          </div>
          <h3 className="font-sora font-semibold leading-snug tracking-tight">
            {funding.title}
          </h3>
        </div>
        <button
          onClick={() => onToggle(saved)}
          aria-pressed={saved}
          className={`flex-none rounded-chip px-3 py-1.5 text-sm font-semibold transition ${
            saved
              ? "bg-bronze text-white"
              : "border border-line bg-white text-charcoal hover:border-blue"
          }`}
        >
          {saved ? "Bookmarked" : "Bookmark"}
        </button>
      </div>

      <div className="mt-2 flex flex-wrap gap-1.5 text-[0.72rem] font-bold">
        {funding.level && (
          <span className="rounded-full bg-blue-tint px-2 py-0.5 text-blue-deep">
            {funding.level}
          </span>
        )}
        {funding.field_relevance && (
          <span className="rounded-full bg-soft px-2 py-0.5 text-charcoal-soft">
            {funding.field_relevance}
          </span>
        )}
      </div>

      {funding.description && (
        <p className="mt-2.5 text-sm leading-relaxed text-charcoal-soft">
          {funding.description}
        </p>
      )}

      {officialUrl && (
        <a
          href={officialUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex text-sm font-semibold text-blue-action hover:underline"
        >
          View official page ↗
        </a>
      )}
    </div>
  );
}
