"use client";

import { useMemo, useState } from "react";
import type {
  PsychologyUniversityCatalogue as CatalogueRow,
  PsychologyUniversityLevel,
  PsychologyUniversityLevels,
} from "@/types/database";
import { UniversityBadge } from "@/components/UniversityBadge";

const LEVELS: {
  key: keyof PsychologyUniversityLevels;
  label: string;
  shortLabel: string;
}[] = [
  { key: "undergraduate", label: "Undergraduate Psychology", shortLabel: "Undergraduate" },
  { key: "honours", label: "Psychology Honours", shortLabel: "Honours" },
  { key: "masters", label: "Psychology Master’s", shortLabel: "Master’s" },
  { key: "doctoral", label: "Psychology doctorate", shortLabel: "PhD / doctorate" },
];

function LevelLink({ level, label }: { level: PsychologyUniversityLevel; label: string }) {
  if (level.status !== "offered" || !level.url) return null;

  return (
    <a
      href={level.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex min-w-0 items-center justify-between gap-3 rounded-card border border-line bg-white px-3 py-2.5 transition hover:border-blue"
    >
      <span className="min-w-0">
        <span className="block text-xs font-bold text-blue-action">{label}</span>
        <span className="mt-0.5 block text-xs leading-snug text-charcoal-soft">
          {level.title}
        </span>
      </span>
      <span aria-hidden="true" className="flex-none text-blue-action transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5">
        ↗
      </span>
    </a>
  );
}

export function PsychologyUniversityCatalogue({ rows }: { rows: CatalogueRow[] }) {
  const [query, setQuery] = useState("");
  const [province, setProvince] = useState("all");
  const [level, setLevel] = useState<"all" | keyof PsychologyUniversityLevels>("all");

  const universitiesWithOfferings = useMemo(
    () => rows.filter((row) => LEVELS.some((item) => row.levels[item.key].status === "offered")),
    [rows]
  );

  const provinces = useMemo(
    () => Array.from(new Set(universitiesWithOfferings.map((row) => row.province))).sort(),
    [universitiesWithOfferings]
  );

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return universitiesWithOfferings.filter((row) => {
      if (province !== "all" && row.province !== province) return false;
      if (level !== "all" && row.levels[level].status !== "offered") return false;
      if (term && !row.institution.toLowerCase().includes(term)) return false;
      return true;
    });
  }, [level, province, query, universitiesWithOfferings]);

  return (
    <section className="mt-7" aria-labelledby="national-psychology-catalogue">
      <div className="rounded-card border border-line bg-soft px-4 py-4 sm:px-5">
        <h2 id="national-psychology-catalogue" className="font-sora text-lg font-bold tracking-tight">
          Psychology programmes at public universities
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-charcoal-soft">
          Only institutions with a verified Psychology qualification are shown. Every programme
          links directly to an official university source.
        </p>
        <p className="mt-2 text-xs font-semibold text-charcoal-soft">
          Verified 2 August 2026 · next full review due within 90 days
        </p>
      </div>

      <div className="mt-4 space-y-3">
        <div className="flex max-w-full gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <button
            type="button"
            onClick={() => setLevel("all")}
            className={`choice-pill flex-none ${
              level === "all" ? "border-charcoal bg-charcoal text-white" : "border-line bg-white text-charcoal-soft"
            }`}
          >
            All institutions
          </button>
          {LEVELS.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setLevel(item.key)}
              className={`choice-pill flex-none ${
                level === item.key ? "border-charcoal bg-charcoal text-white" : "border-line bg-white text-charcoal-soft"
              }`}
            >
              {item.shortLabel}
            </button>
          ))}
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search universities…"
            aria-label="Search universities"
            className="input"
          />
          <select
            value={province}
            onChange={(event) => setProvince(event.target.value)}
            aria-label="Filter by province"
            className="input"
          >
            <option value="all">All provinces</option>
            {provinces.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-3 flex items-baseline justify-between gap-4">
        <p className="text-sm font-semibold text-charcoal">
          {filtered.length} {filtered.length === 1 ? "university" : "universities"}
        </p>
        {(query || province !== "all" || level !== "all") && (
          <button
            type="button"
            onClick={() => { setQuery(""); setProvince("all"); setLevel("all"); }}
            className="text-sm font-semibold text-blue-action hover:underline"
          >
            Clear filters
          </button>
        )}
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {filtered.map((row) => (
          <article key={row.id} className="card min-w-0 p-5">
            <header className="flex min-w-0 items-start gap-3">
              <UniversityBadge institution={row.institution} />
              <div className="min-w-0">
                <h3 className="font-sora text-base font-bold leading-tight tracking-tight">
                  {row.institution}
                </h3>
                <p className="mt-1 text-xs font-semibold text-charcoal-soft">{row.province}</p>
              </div>
            </header>

            <div className="mt-4 grid min-w-0 gap-2">
              {LEVELS.filter((item) => row.levels[item.key].status === "offered").map((item) => (
                <LevelLink key={item.key} level={row.levels[item.key]} label={item.label} />
              ))}
            </div>

            <a
              href={row.audit_source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex text-xs font-bold text-blue-action hover:underline"
            >
              Check the official catalogue ↗
            </a>
          </article>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="mt-4 rounded-card border border-dashed border-divider px-5 py-8 text-center text-sm text-charcoal-soft">
          Try a different search or filter.
        </p>
      )}
    </section>
  );
}
