"use client";

import { useMemo, useState, useTransition } from "react";
import type { FundingOpportunity } from "@/types/database";
import { FundingCard } from "@/components/FundingCard";
import { toggleSaveFunding } from "@/app/(app)/app/funding/actions";

const CHIPS: { value: string; label: string }[] = [
  { value: "all", label: "All opportunities" },
  { value: "undergraduate", label: "Undergraduate" },
  { value: "honours", label: "Honours" },
  { value: "masters", label: "Master's" },
  { value: "doctoral", label: "Doctoral" },
  { value: "postdoctoral", label: "Postdoctoral" },
  { value: "research_grant", label: "Research grants" },
  { value: "conference_travel", label: "Conference & travel" },
  { value: "bookmarked", label: "Bookmarked" },
];

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
  const [, start] = useTransition();
  const [chip, setChip] = useState(initialSavedOnly ? "bookmarked" : "all");
  const [q, setQ] = useState("");

  function onToggle(f: FundingOpportunity, isSaved: boolean) {
    if (demo) return;
    setSaved((prev) => {
      const next = new Set(prev);
      if (isSaved) next.delete(f.id);
      else next.add(f.id);
      return next;
    });
    start(() => {
      toggleSaveFunding(f.id, isSaved);
    });
  }

  const filtered = useMemo(() => {
    return funding.filter((f) => {
      if (chip === "bookmarked" && !saved.has(f.id)) return false;
      if (chip !== "all" && chip !== "bookmarked") {
        if (!(f.categories ?? []).includes(chip)) return false;
      }
      if (q.trim()) {
        const s = q.toLowerCase();
        const hay = `${f.provider ?? ""} ${f.title} ${f.field_relevance ?? ""} ${f.level ?? ""}`.toLowerCase();
        if (!hay.includes(s)) return false;
      }
      return true;
    });
  }, [funding, chip, saved, q]);

  return (
    <div className="mt-6">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search funding by provider, name or field…"
        className="input"
      />

      <div className="mt-3 flex flex-wrap gap-2">
        {CHIPS.map((c) => (
          <button
            key={c.value}
            onClick={() => setChip(c.value)}
            className={`choice-pill ${
              chip === c.value
                ? "border-charcoal bg-charcoal text-white"
                : "border-line bg-white text-charcoal-soft hover:border-blue"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      <p className="mt-4 text-sm font-semibold text-charcoal-soft">
        {filtered.length} {filtered.length === 1 ? "opportunity" : "opportunities"}
      </p>

      {filtered.length > 0 ? (
        <div className="mt-3 grid gap-3">
          {filtered.map((f) => (
            <FundingCard
              key={f.id}
              funding={f}
              saved={saved.has(f.id)}
              onToggle={(isSaved) => onToggle(f, isSaved)}
            />
          ))}
        </div>
      ) : (
        <p className="mt-3 rounded-card border border-dashed border-divider px-5 py-8 text-center text-sm text-charcoal-soft">
          No funding matches this filter yet.
        </p>
      )}
    </div>
  );
}
