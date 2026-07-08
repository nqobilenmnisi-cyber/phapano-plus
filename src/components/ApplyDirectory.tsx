"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import type { ApplyProgramme } from "@/types/database";
import { applyStreamLabel, APPLY_STREAMS } from "@/lib/utils";
import { toggleSaveProgramme } from "@/app/(app)/app/apply/actions";
import { UniversityBadge } from "@/components/UniversityBadge";

const PROVINCES = [
  "Eastern Cape",
  "Free State",
  "Gauteng",
  "KwaZulu-Natal",
  "Limpopo",
  "Mpumalanga",
  "North West",
  "Northern Cape",
  "Western Cape",
];

function fmtDate(d: string | null): string | null {
  if (!d) return null;
  const dt = new Date(d + "T00:00:00");
  if (Number.isNaN(dt.getTime())) return null;
  return dt.toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" });
}

function ProgrammeCard({
  p,
  saved,
  onToggleSave,
}: {
  p: ApplyProgramme;
  saved: boolean;
  onToggleSave: (p: ApplyProgramme, saved: boolean) => void;
}) {
  const deadline = fmtDate(p.closing_date);

  return (
    <div className="card flex flex-col p-5">
      <div className="flex items-start gap-2.5">
        <UniversityBadge institution={p.institution} />
        <div className="min-w-0">
          <h3 className="font-sora text-base font-bold leading-tight tracking-tight">
            {p.institution}
          </h3>
          <p className="mt-1 text-sm text-charcoal-soft">
            {p.qualification === "masters"
              ? `Psychology Master's · ${applyStreamLabel(p.stream)}`
              : "Psychology Honours"}
          </p>
        </div>
      </div>

      <p className="mt-4 text-sm">
        {deadline ? (
          <span className="font-semibold text-charcoal">Deadline: {deadline}</span>
        ) : (
          <span className="text-charcoal-soft">Deadline not yet available</span>
        )}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line-soft pt-4">
        <button
          onClick={() => onToggleSave(p, saved)}
          className={`inline-flex items-center gap-1.5 rounded-chip px-3 py-2 text-sm font-semibold transition ${
            saved
              ? "bg-bronze text-white"
              : "border border-line bg-white text-charcoal hover:border-blue"
          }`}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill={saved ? "currentColor" : "none"}>
            <path d="M6 4h12v16l-6-4-6 4V4Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
          </svg>
          {saved ? "Saved" : "Save"}
        </button>

        <Link
          href={`/app/apply/programme/${p.id}`}
          className="ml-auto text-sm font-semibold text-blue-action hover:underline"
        >
          View Programme →
        </Link>
      </div>
    </div>
  );
}

export function ApplyDirectory({
  programmes,
  savedIds,
  demo,
}: {
  programmes: ApplyProgramme[];
  savedIds: string[];
  demo: boolean;
}) {
  const [saved, setSaved] = useState<Set<string>>(new Set(savedIds));
  const [, start] = useTransition();

  const [qual, setQual] = useState<"all" | "honours" | "masters">("all");
  const [province, setProvince] = useState("all");
  const [stream, setStream] = useState("all");
  const [savedOnly, setSavedOnly] = useState(false);
  const [q, setQ] = useState("");

  function onToggleSave(p: ApplyProgramme, isSaved: boolean) {
    if (demo) return;
    setSaved((prev) => {
      const next = new Set(prev);
      if (isSaved) next.delete(p.id);
      else next.add(p.id);
      return next;
    });
    start(() => {
      toggleSaveProgramme(p.id, isSaved);
    });
  }

  const base = useMemo(() => {
    return programmes.filter((p) => {
      if (province !== "all" && p.province !== province) return false;
      if (savedOnly && !saved.has(p.id)) return false;
      if (q.trim()) {
        const s = q.toLowerCase();
        if (
          !p.institution.toLowerCase().includes(s) &&
          !applyStreamLabel(p.stream).toLowerCase().includes(s)
        )
          return false;
      }
      return true;
    });
  }, [programmes, province, savedOnly, saved, q]);

  const honours = base.filter((p) => p.qualification === "honours");
  const masters = base.filter(
    (p) => p.qualification === "masters" && (stream === "all" || p.stream === stream)
  );

  const mastersByStream = useMemo(() => {
    const map = new Map<string, ApplyProgramme[]>();
    for (const p of masters) {
      const key = p.stream ?? "other";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(p);
    }
    return map;
  }, [masters]);

  const showHonours = qual === "all" || qual === "honours";
  const showMasters = qual === "all" || qual === "masters";

  return (
    <div className="mt-6">
      <div className="rounded-card border border-line bg-soft px-4 py-3 text-xs leading-relaxed text-charcoal-soft">
        Discover psychology programmes, save the ones you&apos;re interested in,
        and jump straight to each university&apos;s official psychology pages.
        Universities remain the source of truth for dates, fees and requirements.
      </div>

      {/* filters */}
      <div className="mt-5 space-y-3">
        <div className="flex flex-wrap gap-2">
          {([
            ["all", "All"],
            ["honours", "Honours"],
            ["masters", "Master's"],
          ] as const).map(([v, label]) => (
            <button
              key={v}
              onClick={() => setQual(v)}
              className={`rounded-full border px-3.5 py-1.5 text-sm font-semibold transition ${
                qual === v
                  ? "border-charcoal bg-charcoal text-white"
                  : "border-line bg-white text-charcoal-soft hover:border-blue"
              }`}
            >
              {label}
            </button>
          ))}
          <button
            onClick={() => setSavedOnly((v) => !v)}
            className={`rounded-full border px-3.5 py-1.5 text-sm font-semibold transition ${
              savedOnly
                ? "border-bronze bg-bronze text-white"
                : "border-line bg-white text-charcoal-soft hover:border-blue"
            }`}
          >
            Saved only
          </button>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <select value={province} onChange={(e) => setProvince(e.target.value)} className="input">
            <option value="all">All provinces</option>
            {PROVINCES.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          <select
            value={stream}
            onChange={(e) => setStream(e.target.value)}
            className="input"
            disabled={qual === "honours"}
            title={qual === "honours" ? "Streams apply to Master's programmes" : undefined}
          >
            <option value="all">All streams (Master&apos;s)</option>
            {APPLY_STREAMS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>

        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search institutions…"
          className="input"
        />
      </div>

      {/* HONOURS */}
      {showHonours && (
        <section className="mt-9">
          <div className="mb-3 flex items-baseline gap-3">
            <h2 className="font-sora text-xl font-bold tracking-tight">
              Psychology Honours programmes
            </h2>
            <span className="text-sm font-semibold text-charcoal-soft">{honours.length}</span>
          </div>
          {honours.length === 0 ? (
            <EmptyRow />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {honours.map((p) => (
                <ProgrammeCard key={p.id} p={p} saved={saved.has(p.id)} onToggleSave={onToggleSave} />
              ))}
            </div>
          )}
        </section>
      )}

      {/* MASTER'S */}
      {showMasters && (
        <section className="mt-12">
          <div className="mb-3 flex items-baseline gap-3">
            <h2 className="font-sora text-xl font-bold tracking-tight">
              Psychology Master&apos;s programmes
            </h2>
            <span className="text-sm font-semibold text-charcoal-soft">{masters.length}</span>
          </div>
          {masters.length === 0 ? (
            <EmptyRow />
          ) : (
            <div className="space-y-8">
              {APPLY_STREAMS.filter((s) => mastersByStream.has(s.value)).map((s) => (
                <div key={s.value}>
                  <h3 className="mb-2.5 text-[0.72rem] font-extrabold uppercase tracking-wider text-blue-action">
                    {s.label} Psychology
                  </h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    {mastersByStream.get(s.value)!.map((p) => (
                      <ProgrammeCard key={p.id} p={p} saved={saved.has(p.id)} onToggleSave={onToggleSave} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

function EmptyRow() {
  return (
    <p className="rounded-card border border-dashed border-divider px-5 py-8 text-center text-sm text-charcoal-soft">
      No programmes match your filters yet.
    </p>
  );
}

/** Standalone save button for the programme detail page. */
export function SaveProgrammeButton({
  programmeId,
  initialSaved,
}: {
  programmeId: string;
  initialSaved: boolean;
}) {
  const [saved, setSaved] = useState(initialSaved);
  const [, start] = useTransition();

  function toggle() {
    const wasSaved = saved;
    setSaved(!wasSaved);
    start(() => {
      toggleSaveProgramme(programmeId, wasSaved);
    });
  }

  return (
    <button
      onClick={toggle}
      className={`inline-flex items-center gap-1.5 rounded-chip px-4 py-2 text-sm font-semibold transition ${
        saved ? "bg-bronze text-white" : "border border-line bg-white text-charcoal hover:border-blue"
      }`}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill={saved ? "currentColor" : "none"}>
        <path d="M6 4h12v16l-6-4-6 4V4Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      </svg>
      {saved ? "Saved" : "Save programme"}
    </button>
  );
}
