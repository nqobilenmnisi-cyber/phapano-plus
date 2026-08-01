"use client";

import { useMemo, useState } from "react";
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
  saving,
  onToggleSave,
}: {
  p: ApplyProgramme;
  saved: boolean;
  saving: boolean;
  onToggleSave: (p: ApplyProgramme, saved: boolean) => Promise<void>;
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
          disabled={saving}
          className={`inline-flex items-center gap-1.5 rounded-chip px-3 py-2 text-sm font-semibold transition ${
            saved
              ? "bg-bronze text-white"
              : "border border-line bg-white text-charcoal hover:border-blue"
          } disabled:opacity-60`}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill={saved ? "currentColor" : "none"}>
            <path d="M6 4h12v16l-6-4-6 4V4Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
          </svg>
          {saving ? "Saving…" : saved ? "Saved" : "Save"}
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
  applicationIds,
  initialSavedOnly = false,
  initialApplicationsOnly = false,
  demo,
}: {
  programmes: ApplyProgramme[];
  savedIds: string[];
  applicationIds: string[];
  initialSavedOnly?: boolean;
  initialApplicationsOnly?: boolean;
  demo: boolean;
}) {
  const [saved, setSaved] = useState<Set<string>>(new Set(savedIds));
  const [savingId, setSavingId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [qual, setQual] = useState<"all" | "honours" | "masters">("all");
  const [province, setProvince] = useState("all");
  const [stream, setStream] = useState("all");
  const [savedOnly, setSavedOnly] = useState(initialSavedOnly);
  const [applicationsOnly, setApplicationsOnly] = useState(initialApplicationsOnly);
  const applicationSet = useMemo(() => new Set(applicationIds), [applicationIds]);
  const [q, setQ] = useState("");

  async function onToggleSave(p: ApplyProgramme, isSaved: boolean) {
    if (demo) return;
    setSaveError(null);
    setSavingId(p.id);
    setSaved((prev) => {
      const next = new Set(prev);
      if (isSaved) next.delete(p.id);
      else next.add(p.id);
      return next;
    });
    try {
      const result = await toggleSaveProgramme(p.id, isSaved);
      if (!result.ok) {
        setSaved((prev) => {
          const next = new Set(prev);
          if (isSaved) next.add(p.id);
          else next.delete(p.id);
          return next;
        });
        setSaveError(
          "error" in result && result.error
            ? result.error
            : "We couldn't update this saved programme. Please try again."
        );
      }
    } finally {
      setSavingId(null);
    }
  }

  const base = useMemo(() => {
    return programmes.filter((p) => {
      if (province !== "all" && p.province !== province) return false;
      if (savedOnly && !saved.has(p.id)) return false;
      if (applicationsOnly && !applicationSet.has(p.id)) return false;
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
  }, [programmes, province, savedOnly, saved, applicationsOnly, applicationSet, q]);

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

      {saveError && (
        <p
          role="alert"
          className="mt-3 rounded-card border border-bronze-soft bg-[#FCF6F2] px-4 py-3 text-sm text-charcoal"
        >
          {saveError}
        </p>
      )}

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
              className={`choice-pill ${
                qual === v
                  ? "border-charcoal bg-charcoal text-white"
                  : "border-line bg-white text-charcoal-soft hover:border-blue"
              }`}
            >
              {label}
            </button>
          ))}
          <button
            onClick={() => {
              setSavedOnly((value) => !value);
              setApplicationsOnly(false);
            }}
            className={`choice-pill ${
              savedOnly
                ? "border-bronze bg-bronze text-white"
                : "border-line bg-white text-charcoal-soft hover:border-blue"
            }`}
          >
            Saved only
          </button>
          <button
            onClick={() => {
              setApplicationsOnly((value) => !value);
              setSavedOnly(false);
            }}
            className={`choice-pill ${
              applicationsOnly
                ? "border-blue-action bg-blue-action text-white"
                : "border-line bg-white text-charcoal-soft hover:border-blue"
            }`}
          >
            Active applications
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
                <ProgrammeCard
                  key={p.id}
                  p={p}
                  saved={saved.has(p.id)}
                  saving={savingId === p.id}
                  onToggleSave={onToggleSave}
                />
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
                      <ProgrammeCard
                        key={p.id}
                        p={p}
                        saved={saved.has(p.id)}
                        saving={savingId === p.id}
                        onToggleSave={onToggleSave}
                      />
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
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggle() {
    const wasSaved = saved;
    setError(null);
    setPending(true);
    setSaved(!wasSaved);
    try {
      const result = await toggleSaveProgramme(programmeId, wasSaved);
      if (!result.ok) {
        setSaved(wasSaved);
        setError(
          "error" in result && result.error
            ? result.error
            : "We couldn't update this saved programme. Please try again."
        );
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <button
        onClick={toggle}
        disabled={pending}
        className={`inline-flex items-center gap-1.5 rounded-chip px-4 py-2 text-sm font-semibold transition disabled:opacity-60 ${
          saved ? "bg-bronze text-white" : "border border-line bg-white text-charcoal hover:border-blue"
        }`}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill={saved ? "currentColor" : "none"}>
          <path d="M6 4h12v16l-6-4-6 4V4Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        </svg>
        {pending ? "Saving…" : saved ? "Saved" : "Save programme"}
      </button>
      {error && (
        <p role="alert" className="mt-2 max-w-xs text-sm text-bronze-deep">
          {error}
        </p>
      )}
    </div>
  );
}
