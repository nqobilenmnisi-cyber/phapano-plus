"use client";

import { BookmarkIcon } from "@/components/PhapanoIcons";
import { daysUntil, formatDate, formatDateShort } from "@/lib/utils";
import type { FundingOpportunity } from "@/types/database";

function availability(funding: FundingOpportunity) {
  const days = daysUntil(funding.closing_date);
  if (funding.is_open === false || (days !== null && days < 0)) {
    return { label: "Closed", tone: "bg-line text-charcoal-soft", days };
  }
  if (days !== null && days <= 14) {
    return { label: "Closing soon", tone: "bg-[#FBEDE9] text-[#9B3F2E]", days };
  }
  return { label: "Available", tone: "bg-[#E4F1EA] text-ok", days };
}

export function FundingCard({
  funding,
  saved,
  saving,
  onToggle,
}: {
  funding: FundingOpportunity;
  saved: boolean;
  saving: boolean;
  onToggle: (saved: boolean) => void;
}) {
  const officialUrl = funding.link ?? funding.source_url ?? null;
  const state = availability(funding);

  return (
    <article className="card relative overflow-hidden border-line/90 transition hover:border-blue/40 hover:shadow-lift">
      {funding.featured && <div className="h-1 bg-gradient-to-r from-blue-action via-blue to-bronze" />}
      <div className="p-5 sm:p-6">
        <div className="flex min-w-0 items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-full px-2.5 py-1 text-[0.67rem] font-extrabold uppercase tracking-wide ${state.tone}`}>
                {state.label}
              </span>
              {funding.provider && (
                <span className="min-w-0 break-words text-[0.68rem] font-extrabold uppercase tracking-wider text-blue-deep">
                  {funding.provider}
                </span>
              )}
            </div>
            <h3 className="mt-2 break-words font-sora text-lg font-bold leading-snug tracking-tight text-charcoal">
              {funding.title}
            </h3>
          </div>
          <button
            type="button"
            onClick={() => onToggle(saved)}
            disabled={saving}
            aria-pressed={saved}
            aria-label={saved ? "Remove from saved funding" : "Save funding"}
            title={saved ? "Remove from saved funding" : "Save funding"}
            className={`grid h-11 w-11 flex-none place-items-center rounded-full border transition disabled:opacity-60 ${
              saved
                ? "border-bronze bg-bronze text-white"
                : "border-line bg-white text-charcoal-soft hover:border-bronze hover:text-bronze-deep"
            }`}
          >
            <BookmarkIcon className="h-5 w-5" filled={saved} />
          </button>
        </div>

        <div className="mt-3 flex min-w-0 flex-wrap gap-1.5 text-[0.72rem] font-bold">
          {funding.level && (
            <span className="max-w-full break-words rounded-full border border-blue/25 bg-blue-tint/55 px-2.5 py-1 text-blue-deep">
              {funding.level}
            </span>
          )}
          {funding.field_relevance && (
            <span className="max-w-full break-words rounded-full border border-line bg-white px-2.5 py-1 text-charcoal-soft">
              {funding.field_relevance}
            </span>
          )}
        </div>

        {funding.description && (
          <p className="mt-3 text-sm leading-relaxed text-charcoal-soft">
            {funding.description}
          </p>
        )}

        <dl className="mt-4 grid gap-2 rounded-card border border-line bg-soft/65 p-3 sm:grid-cols-2">
          <div className="min-w-0">
            <dt className="text-[0.65rem] font-extrabold uppercase tracking-wider text-charcoal-soft">Closing date</dt>
            <dd className="mt-0.5 text-sm font-bold text-charcoal">
              {funding.closing_date ? formatDate(funding.closing_date) : "Check the official page"}
            </dd>
            {state.days !== null && state.days >= 0 && (
              <p className="mt-0.5 text-xs font-semibold text-bronze-deep">
                {state.days === 0 ? "Closes today" : `${state.days} ${state.days === 1 ? "day" : "days"} remaining`}
              </p>
            )}
          </div>
          <div className="min-w-0">
            <dt className="text-[0.65rem] font-extrabold uppercase tracking-wider text-charcoal-soft">Support</dt>
            <dd className="mt-0.5 break-words text-sm font-bold text-charcoal">
              {funding.amount_description || "See the award details"}
            </dd>
          </div>
        </dl>

        {funding.eligibility && (
          <details className="group mt-3 rounded-card border border-line bg-white px-4 py-3">
            <summary className="cursor-pointer list-none text-sm font-bold text-charcoal">
              Who this may suit <span aria-hidden="true" className="float-right text-blue-action group-open:rotate-45">+</span>
            </summary>
            <p className="mt-2 text-sm leading-relaxed text-charcoal-soft">{funding.eligibility}</p>
          </details>
        )}

        <div className="mt-4 flex flex-col gap-3 border-t border-line pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="min-w-0 text-xs leading-relaxed text-charcoal-soft">
            {funding.last_verified_at
              ? `Source checked ${formatDateShort(funding.last_verified_at)}`
              : "Confirm details on the official source before applying."}
          </p>
          {officialUrl && (
            <a
              href={officialUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary flex-none !min-h-10 !px-4 !py-2 text-sm"
            >
              Official details <span aria-hidden="true">↗</span>
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
