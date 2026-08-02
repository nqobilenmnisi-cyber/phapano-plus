"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import type { ApplyProgramme, ProgrammeQualification } from "@/types/database";
import {
  toggleSaveProgramme,
  updateProgrammeNote,
} from "@/app/(app)/app/apply/actions";
import { UniversityBadge } from "@/components/UniversityBadge";
import { BookmarkIcon } from "@/components/PhapanoIcons";

const LEVELS: { value: "all" | ProgrammeQualification; label: string }[] = [
  { value: "all", label: "All levels" },
  { value: "undergraduate", label: "Undergraduate" },
  { value: "honours", label: "Honours" },
  { value: "masters", label: "Master’s" },
  { value: "doctoral", label: "PhD / doctorate" },
];

const PAGE_SIZE = 12;

function levelLabel(level: ProgrammeQualification) {
  return LEVELS.find((item) => item.value === level)?.label ?? level;
}

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
  initialNote,
  onNoteSaved,
  demo,
}: {
  p: ApplyProgramme;
  saved: boolean;
  saving: boolean;
  onToggleSave: (p: ApplyProgramme, saved: boolean) => Promise<void>;
  initialNote: string | null;
  onNoteSaved: (programmeId: string) => void;
  demo: boolean;
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
            {p.programme_title ?? `${levelLabel(p.qualification)} Psychology`}
          </p>
          <span className="mt-2 inline-flex rounded-full border border-blue/30 bg-blue-tint/35 px-2.5 py-1 text-[0.68rem] font-bold text-blue-deep">
            {levelLabel(p.qualification)}
          </span>
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
          <BookmarkIcon className="h-4 w-4" filled={saved} />
          {saving ? "Saving…" : saved ? "Saved" : "Save"}
        </button>

        {p.programme_url && (
          <a
            href={p.programme_url}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto text-sm font-semibold text-blue-action hover:underline"
          >
            Official source ↗
          </a>
        )}
        <Link
          href={`/app/apply/programme/${p.id}`}
          className="w-full text-sm font-semibold text-blue-action hover:underline"
        >
          Open full application planner →
        </Link>
      </div>

      <ProgrammeNote
        programmeId={p.id}
        initialNote={initialNote}
        onSaved={() => onNoteSaved(p.id)}
        demo={demo}
      />
    </div>
  );
}

function ProgrammeNote({
  programmeId,
  initialNote,
  onSaved,
  demo,
}: {
  programmeId: string;
  initialNote: string | null;
  onSaved: () => void;
  demo: boolean;
}) {
  const [note, setNote] = useState(initialNote ?? "");
  const [draft, setDraft] = useState(initialNote ?? "");
  const [editing, setEditing] = useState(false);
  const [savedMessage, setSavedMessage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function saveNote() {
    if (demo || draft === note) return;
    setError(null);
    setSavedMessage(false);
    startTransition(async () => {
      const result = await updateProgrammeNote(programmeId, draft || null);
      if (!result.ok) {
        setError(
          "error" in result && result.error
            ? result.error
            : "We couldn't save this note. Please try again."
        );
        return;
      }
      setNote(draft);
      setEditing(false);
      setSavedMessage(true);
      onSaved();
    });
  }

  return (
    <div className="mt-4 border-t border-line-soft pt-4">
      {!editing ? (
        <div>
          {note && (
            <p className="line-clamp-2 rounded-card bg-soft px-3 py-2.5 text-sm leading-relaxed text-charcoal">
              {note}
            </p>
          )}
          <div className="mt-2 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => { setDraft(note); setEditing(true); setSavedMessage(false); }}
              className="text-sm font-semibold text-blue-action hover:underline"
            >
              {note ? "Edit private note" : "Add private note"}
            </button>
            {savedMessage && <span className="text-xs font-semibold text-charcoal-soft">Note saved</span>}
          </div>
        </div>
      ) : (
        <div>
          <label className="label" htmlFor={`note-${programmeId}`}>Private note</label>
          <textarea
            id={`note-${programmeId}`}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            rows={3}
            className="input resize-none"
            placeholder="Questions, reminders or application notes…"
          />
          <p className="mt-1 text-xs text-charcoal-soft">Adding a note also saves this programme.</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={saveNote}
              disabled={pending || draft === note}
              className="btn-primary !px-3 !py-2 text-sm disabled:opacity-50"
            >
              {pending ? "Saving…" : "Save note"}
            </button>
            <button
              type="button"
              onClick={() => { setDraft(note); setEditing(false); setError(null); }}
              disabled={pending}
              className="btn-secondary !px-3 !py-2 text-sm"
            >
              Cancel
            </button>
          </div>
          {error && <p role="alert" className="mt-2 text-sm text-bronze-deep">{error}</p>}
        </div>
      )}
    </div>
  );
}

export function ApplyDirectory({
  programmes,
  savedIds,
  applicationIds,
  notesByProgramme,
  initialSavedOnly = false,
  initialApplicationsOnly = false,
  demo,
}: {
  programmes: ApplyProgramme[];
  savedIds: string[];
  applicationIds: string[];
  notesByProgramme: Record<string, string | null>;
  initialSavedOnly?: boolean;
  initialApplicationsOnly?: boolean;
  demo: boolean;
}) {
  const [saved, setSaved] = useState<Set<string>>(new Set(savedIds));
  const [savingId, setSavingId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [level, setLevel] = useState<"all" | ProgrammeQualification>("all");
  const [province, setProvince] = useState("all");
  const [savedOnly, setSavedOnly] = useState(initialSavedOnly);
  const [applicationsOnly, setApplicationsOnly] = useState(initialApplicationsOnly);
  const applicationSet = useMemo(() => new Set(applicationIds), [applicationIds]);
  const [q, setQ] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const provinces = useMemo(
    () => Array.from(new Set(programmes.map((programme) => programme.province).filter(Boolean))).sort() as string[],
    [programmes]
  );

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

  function onNoteSaved(programmeId: string) {
    setSaved((previous) => new Set(previous).add(programmeId));
  }

  const base = useMemo(() => {
    return programmes.filter((p) => {
      if (province !== "all" && p.province !== province) return false;
      if (level !== "all" && p.qualification !== level) return false;
      if (savedOnly && !saved.has(p.id)) return false;
      if (applicationsOnly && !applicationSet.has(p.id)) return false;
      if (q.trim()) {
        const s = q.toLowerCase();
        if (
          !p.institution.toLowerCase().includes(s) &&
          !(p.programme_title ?? "").toLowerCase().includes(s)
        )
          return false;
      }
      return true;
    });
  }, [programmes, province, level, savedOnly, saved, applicationsOnly, applicationSet, q]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [province, level, savedOnly, applicationsOnly, q]);

  const visible = base.slice(0, visibleCount);

  return (
    <div className="mt-6">
      <div className="rounded-card border border-line bg-soft px-4 py-3 text-xs leading-relaxed text-charcoal-soft">
        One verified list for discovery and planning. Filter by province or level,
        save a route, add a private note, or open its complete application tracker.
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
          {LEVELS.map((item) => (
            <button
              key={item.value}
              onClick={() => setLevel(item.value)}
              className={`choice-pill ${
                level === item.value
                  ? "border-charcoal bg-charcoal text-white"
                  : "border-line bg-white text-charcoal-soft hover:border-blue"
              }`}
            >
              {item.label}
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

        <div>
          <select value={province} onChange={(e) => setProvince(e.target.value)} className="input">
            <option value="all">All provinces</option>
            {provinces.map((p) => (
              <option key={p} value={p}>{p}</option>
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

      <section className="mt-8">
        <div className="mb-3 flex items-baseline gap-3">
          <h2 className="font-sora text-xl font-bold tracking-tight">Verified Psychology programmes</h2>
          <span className="text-sm font-semibold text-charcoal-soft">{base.length}</span>
        </div>
        {base.length === 0 ? (
          <EmptyRow />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {visible.map((p) => (
              <ProgrammeCard
                key={p.id}
                p={p}
                saved={saved.has(p.id)}
                saving={savingId === p.id}
                onToggleSave={onToggleSave}
                initialNote={notesByProgramme[p.id] ?? null}
                onNoteSaved={onNoteSaved}
                demo={demo}
              />
            ))}
          </div>
        )}
        {visible.length < base.length && (
          <div className="mt-6 text-center">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
            >
              Show {Math.min(PAGE_SIZE, base.length - visible.length)} more
            </button>
            <p className="mt-2 text-xs text-charcoal-soft" aria-live="polite">
              Showing {visible.length} of {base.length}{" "}
              {base.length === 1 ? "programme" : "programmes"}
            </p>
          </div>
        )}
      </section>
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
        <BookmarkIcon className="h-4 w-4" filled={saved} />
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
