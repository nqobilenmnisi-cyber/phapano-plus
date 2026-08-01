"use client";

import { useMemo, useState } from "react";
import type { FundingOpportunity } from "@/types/database";
import { FundingCard } from "@/components/FundingCard";
import { BookmarkIcon, SearchIcon } from "@/components/PhapanoIcons";
import { toggleSaveFunding } from "@/app/(app)/app/funding/actions";
import { daysUntil } from "@/lib/utils";

const CHIPS = [
  { value: "all", label: "All opportunities" },
  { value: "undergraduate", label: "Undergraduate" },
  { value: "honours", label: "Honours" },
  { value: "masters", label: "Master's" },
  { value: "doctoral", label: "Doctoral" },
  { value: "postdoctoral", label: "Postdoctoral" },
  { value: "research_grant", label: "Research grants" },
  { value: "conference_travel", label: "Conference & travel" },
] as const;

function availableNow(funding: FundingOpportunity) {
  const days = daysUntil(funding.closing_date);
  return funding.is_open !== false && (days === null || days >= 0);
}

export function FundingDirectory({
  funding,
  savedIds,
  initialSavedOnly = false,
  demo,
}: {
  funding: FundingOpportunity[];
  savedIds: string[];
  initialSavedOnly?: boolean;
  demo: boolean;
}) {
  const [saved, setSaved] = useState<Set<string>>(new Set(savedIds));
  const [savingId, setSavingId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [chip, setChip] = useState(initialSavedOnly ? "saved" : "all");
  const [q, setQ] = useState("");

  async function onToggle(f: FundingOpportunity, wasSaved: boolean) {
    if (demo || savingId) return;
    setSaveError(null);
    setSavingId(f.id);
    setSaved((previous) => {
      const next = new Set(previous);
      wasSaved ? next.delete(f.id) : next.add(f.id);
      return next;
    });
    try {
      const result = await toggleSaveFunding(f.id, wasSaved);
      if (!result.ok) {
        setSaved((previous) => {
          const next = new Set(previous);
          wasSaved ? next.add(f.id) : next.delete(f.id);
          return next;
        });
        setSaveError(
          "error" in result && result.error
            ? result.error
            : "We couldn't update your saved funding. Please try again."
        );
      }
    } finally {
      setSavingId(null);
    }
  }

  const filtered = useMemo(() => {
    return funding
      .filter((f) => {
        if (chip === "saved" && !saved.has(f.id)) return false;
        if (chip !== "all" && chip !== "saved") {
          if (!(f.categories ?? []).includes(chip)) return false;
        }
        if (q.trim()) {
          const search = q.toLowerCase();
          const haystack = `${f.provider ?? ""} ${f.title} ${f.field_relevance ?? ""} ${f.level ?? ""} ${f.description ?? ""}`.toLowerCase();
          if (!haystack.includes(search)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (availableNow(a) !== availableNow(b)) return availableNow(a) ? -1 : 1;
        if (Boolean(a.featured) !== Boolean(b.featured)) return a.featured ? -1 : 1;
        return (a.closing_date ?? "9999-12-31").localeCompare(
          b.closing_date ?? "9999-12-31"
        );
      });
  }, [funding, chip, saved, q]);

  return (
    <div className="mt-6">
      <section className="card overflow-hidden border-blue/25">
        <div className="bg-white p-4 sm:p-5">
          <label className="relative block">
            <span className="sr-only">Search funding</span>
            <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-charcoal-soft" />
            <input
              value={q}
              onChange={(event) => setQ(event.target.value)}
              placeholder="Search provider, opportunity or field…"
              className="input !pl-11"
            />
          </label>

          <div className="mt-3 flex max-w-full gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible" aria-label="Funding filters">
            {CHIPS.map((filter) => (
              <button
                key={filter.value}
                type="button"
                onClick={() => setChip(filter.value)}
                aria-pressed={chip === filter.value}
                className={`choice-pill flex-none ${
                  chip === filter.value
                    ? "border-charcoal bg-charcoal text-white"
                    : "border-line bg-white text-charcoal-soft hover:border-blue"
                }`}
              >
                {filter.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setChip("saved")}
              aria-label="Show saved funding"
              title="Saved funding"
              aria-pressed={chip === "saved"}
              className={`choice-pill aspect-square flex-none !px-0 ${
                chip === "saved"
                  ? "border-bronze bg-bronze text-white"
                  : "border-line bg-white text-charcoal-soft hover:border-bronze hover:text-bronze-deep"
              }`}
            >
              <BookmarkIcon className="h-5 w-5" filled={chip === "saved"} />
            </button>
          </div>
        </div>
      </section>

      {saveError && (
        <p role="alert" className="mt-3 rounded-card border border-bronze-soft bg-[#FCF6F2] px-4 py-3 text-sm font-semibold text-bronze-deep">
          {saveError}
        </p>
      )}

      <div className="mt-7 flex items-end justify-between gap-3 px-1">
        <div>
          <p className="eyebrow">Funding opportunities</p>
          <h2 className="mt-1 font-sora text-xl font-bold tracking-tight">
            {chip === "saved" ? "Your saved opportunities" : "Opportunities for your pathway"}
          </h2>
        </div>
      </div>

      {filtered.length > 0 ? (
        <div className="mt-3 grid gap-4">
          {filtered.map((opportunity) => (
            <FundingCard
              key={opportunity.id}
              funding={opportunity}
              saved={saved.has(opportunity.id)}
              saving={savingId === opportunity.id}
              onToggle={(isSaved) => onToggle(opportunity, isSaved)}
            />
          ))}
        </div>
      ) : (
        <p className="mt-3 rounded-card border border-dashed border-divider bg-white px-5 py-10 text-center text-sm text-charcoal-soft">
          No funding matches these filters yet.
        </p>
      )}
    </div>
  );
}
