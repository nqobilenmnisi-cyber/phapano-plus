"use client";

import { useState, useTransition, useMemo } from "react";
import type { JournalEntry } from "@/types/database";
import {
  createEntry,
  updateEntry,
  deleteEntry,
} from "@/app/(app)/app/journal/actions";

// Expanded, practical tags. "Other" reveals a custom text field.
const TAGS = [
  "Application reminder",
  "Institution to research",
  "Funding lead",
  "Funding deadline",
  "Referee note",
  "Referee follow-up",
  "Deadline to check",
  "University requirement",
  "Documents needed",
  "Document checklist",
  "Application fee",
  "Transcript",
  "CV",
  "Personal statement",
  "Motivation letter",
  "Question to ask",
  "Interview prep",
  "Selection week prep",
  "Selection/interview note",
  "Board exam/admin",
  "Internship/community service",
  "Workshop/resource",
  "Follow-up task",
  "Personal next step",
  "Other",
];

const PRIORITIES: { value: string; label: string; colour: string; tint: string }[] = [
  { value: "urgent", label: "Urgent", colour: "#C0492F", tint: "#FBEDE9" },
  { value: "medium", label: "Medium", colour: "#B5791F", tint: "#FAF1DF" },
  { value: "low", label: "Low", colour: "#3F8F6F", tint: "#E8F4EE" },
];
const priorityMeta = (v: string | null) =>
  PRIORITIES.find((p) => p.value === v) ?? null;

const PLACEHOLDER =
  "e.g. Email Dr Khumalo to ask about being a referee before the Wits deadline…";

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}
function daysUntil(due: string | null): number | null {
  if (!due) return null;
  const d = new Date(due + "T00:00:00");
  if (Number.isNaN(d.getTime())) return null;
  return Math.round((d.getTime() - startOfToday().getTime()) / 86_400_000);
}
type Bucket = "overdue" | "soon" | "upcoming" | "none";
function bucketOf(due: string | null): Bucket {
  const d = daysUntil(due);
  if (d === null) return "none";
  if (d < 0) return "overdue";
  if (d <= 7) return "soon";
  return "upcoming";
}
const BUCKET_LABEL: Record<Bucket, string> = {
  overdue: "Overdue",
  soon: "Due soon",
  upcoming: "Upcoming",
  none: "No due date",
};
const BUCKET_ORDER: Bucket[] = ["overdue", "soon", "upcoming", "none"];

function formatDue(due: string | null): string {
  const d = daysUntil(due);
  if (d === null || !due) return "";
  const date = new Date(due + "T00:00:00").toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
  });
  if (d < 0) return `${date} · ${Math.abs(d)} day${Math.abs(d) === 1 ? "" : "s"} overdue`;
  if (d === 0) return `${date} · due today`;
  if (d === 1) return `${date} · due tomorrow`;
  return `${date} · in ${d} days`;
}

export function JournalEntries({
  initial,
  demo,
}: {
  initial: JournalEntry[];
  demo: boolean;
}) {
  const [entries, setEntries] = useState(initial);
  const [content, setContent] = useState("");
  const [tag, setTag] = useState<string | null>(null);
  const [customTag, setCustomTag] = useState("");
  const [priority, setPriority] = useState<string | null>(null);
  const [due, setDue] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "urgent" | "dated">("all");
  const [editing, setEditing] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, start] = useTransition();

  const resolvedTag = tag === "Other" ? customTag.trim() || "Other" : tag;

  const visible = useMemo(() => {
    let list = entries.filter((e) => e.content.trim().length > 0);
    if (filter === "urgent") list = list.filter((e) => e.priority === "urgent");
    if (filter === "dated") list = list.filter((e) => e.due_date);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (e) =>
          e.content.toLowerCase().includes(q) ||
          (e.approach ?? "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [entries, query, filter]);

  // Group by due-date bucket; within a bucket, sort dated items by due date.
  const groups = useMemo(() => {
    const map: Record<Bucket, JournalEntry[]> = {
      overdue: [],
      soon: [],
      upcoming: [],
      none: [],
    };
    for (const e of visible) map[bucketOf(e.due_date)].push(e);
    (["overdue", "soon", "upcoming"] as Bucket[]).forEach((b) =>
      map[b].sort((a, c) => (a.due_date! < c.due_date! ? -1 : 1))
    );
    return map;
  }, [visible]);

  function resetComposer() {
    setContent("");
    setTag(null);
    setCustomTag("");
    setPriority(null);
    setDue("");
  }

  function add() {
    if (!content.trim()) return;
    setNotice(null);

    if (demo) {
      setNotice("In demo mode, notes aren't saved. Connect Supabase to keep them.");
      return;
    }

    const fd = new FormData();
    fd.set("content", content);
    if (resolvedTag) fd.set("approach", resolvedTag);
    if (priority) fd.set("priority", priority);
    if (due) fd.set("due_date", due);

    const optimistic: JournalEntry = {
      id: `tmp-${Date.now()}`,
      user_id: "me",
      content,
      prompt: null,
      approach: resolvedTag,
      priority,
      due_date: due || null,
      mood: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setEntries((e) => [optimistic, ...e]);
    resetComposer();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);

    start(async () => {
      const res = await createEntry(fd);
      if (res && "error" in res && res.error) setNotice(`Couldn't save: ${res.error}`);
    });
  }

  function saveEdit(id: string) {
    if (demo) {
      setEditing(null);
      return;
    }
    const fd = new FormData();
    fd.set("id", id);
    fd.set("content", editText);
    setEntries((es) => es.map((e) => (e.id === id ? { ...e, content: editText } : e)));
    setEditing(null);
    start(() => {
      updateEntry(fd);
    });
  }

  function remove(id: string) {
    if (!confirm("Delete this note? This cannot be undone.")) return;
    setEntries((es) => es.filter((e) => e.id !== id));
    if (!demo) start(() => { deleteEntry(id); });
  }

  const hasNotes = entries.filter((e) => e.content.trim()).length > 0;

  return (
    <div>
      {/* composer */}
      <div className="card mt-6 p-6">
        <label className="label" htmlFor="note_text">Add a note</label>
        <textarea
          id="note_text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={4}
          placeholder={PLACEHOLDER}
          className="input resize-y leading-relaxed"
        />

        {/* tag */}
        <p className="mt-4 text-sm font-semibold text-charcoal-soft">Tag it (optional)</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {TAGS.map((t) => {
            const on = tag === t;
            return (
              <button
                key={t}
                type="button"
                onClick={() => setTag(on ? null : t)}
                aria-pressed={on}
                className={`rounded-full border px-3 py-1.5 text-sm font-semibold transition ${
                  on
                    ? "border-blue-action bg-blue-action text-white"
                    : "border-line bg-white text-charcoal-soft hover:border-blue"
                }`}
              >
                {t}
              </button>
            );
          })}
        </div>
        {tag === "Other" && (
          <input
            value={customTag}
            onChange={(e) => setCustomTag(e.target.value)}
            className="input mt-2"
            placeholder="Type your own tag…"
          />
        )}

        {/* urgency + due date */}
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-sm font-semibold text-charcoal-soft">Priority (optional)</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {PRIORITIES.map((p) => {
                const on = priority === p.value;
                return (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setPriority(on ? null : p.value)}
                    aria-pressed={on}
                    className="flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-semibold transition"
                    style={
                      on
                        ? { borderColor: p.colour, background: p.tint, color: p.colour }
                        : undefined
                    }
                  >
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: p.colour }} />
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <label className="text-sm font-semibold text-charcoal-soft" htmlFor="due_input">
              Due date (optional)
            </label>
            <input
              id="due_input"
              type="date"
              value={due}
              onChange={(e) => setDue(e.target.value)}
              className="input mt-2"
            />
          </div>
        </div>

        {notice && <p className="mt-3 text-sm text-bronze-deep">{notice}</p>}

        <div className="mt-4 flex items-center gap-3">
          <button onClick={add} disabled={!content.trim() || pending} className="btn-primary disabled:opacity-50">
            {pending ? "Saving…" : "Save note"}
          </button>
          {saved && (
            <span className="flex items-center gap-1.5 text-sm font-semibold text-ok">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                <path d="M5 13l4 4L19 7" stroke="#3F8F6F" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Note saved.
            </span>
          )}
        </div>
      </div>

      {/* filter + search */}
      {hasNotes && (
        <div className="mt-8 space-y-3">
          <div className="flex flex-wrap gap-2">
            {([
              ["all", "All"],
              ["urgent", "Urgent"],
              ["dated", "With a due date"],
            ] as const).map(([v, label]) => (
              <button
                key={v}
                onClick={() => setFilter(v)}
                className={`rounded-full border px-3 py-1.5 text-sm font-semibold transition ${
                  filter === v
                    ? "border-charcoal bg-charcoal text-white"
                    : "border-line bg-white text-charcoal-soft hover:border-blue"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search your notes…"
            className="input"
          />
        </div>
      )}

      {/* grouped notes */}
      <div className="mt-5 space-y-7">
        {!hasNotes && (
          <p className="rounded-card border border-dashed border-divider px-5 py-8 text-center text-sm text-charcoal-soft">
            No notes yet. Add your first reminder, lead or next step above.
          </p>
        )}

        {hasNotes && visible.length === 0 && (
          <p className="rounded-card border border-dashed border-divider px-5 py-8 text-center text-sm text-charcoal-soft">
            No notes match that filter.
          </p>
        )}

        {BUCKET_ORDER.map((b) => {
          const items = groups[b];
          if (items.length === 0) return null;
          return (
            <div key={b}>
              <div className="mb-2.5 flex items-center gap-3 px-1">
                <span
                  className={`text-[0.72rem] font-extrabold uppercase tracking-wider ${
                    b === "overdue" ? "text-[#C0492F]" : "text-charcoal-soft"
                  }`}
                >
                  {BUCKET_LABEL[b]}
                </span>
                <span className="text-xs font-semibold text-charcoal-soft">{items.length}</span>
                <span className="h-px flex-1 bg-divider opacity-50" />
              </div>
              <div className="space-y-3">
                {items.map((e) => {
                  const pm = priorityMeta(e.priority);
                  return (
                    <div
                      key={e.id}
                      className="card p-5"
                      style={b === "overdue" ? { borderColor: "#E8C3B8" } : undefined}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2 text-[0.72rem] font-bold">
                          {b === "overdue" && (
                            <span className="rounded-full bg-[#FBEDE9] px-2 py-0.5 uppercase tracking-wide text-[#C0492F]">
                              Overdue
                            </span>
                          )}
                          {pm && (
                            <span
                              className="rounded-full px-2 py-0.5 uppercase tracking-wide"
                              style={{ background: pm.tint, color: pm.colour }}
                            >
                              {pm.label} priority
                            </span>
                          )}
                          {e.approach && (
                            <span className="rounded-full bg-blue-tint px-2 py-0.5 text-blue-deep">
                              {e.approach}
                            </span>
                          )}
                          {e.due_date && (
                            <span
                              className="font-semibold text-charcoal-soft"
                              style={b === "overdue" ? { color: "#C0492F" } : undefined}
                            >
                              {formatDue(e.due_date)}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-none gap-3 text-xs font-semibold text-charcoal-soft">
                          <button
                            onClick={() => { setEditing(e.id); setEditText(e.content); }}
                            className="hover:text-blue-action"
                          >
                            Edit
                          </button>
                          <button onClick={() => remove(e.id)} className="hover:text-bronze-deep">
                            Delete
                          </button>
                        </div>
                      </div>

                      {editing === e.id ? (
                        <div className="mt-3">
                          <textarea
                            value={editText}
                            onChange={(ev) => setEditText(ev.target.value)}
                            rows={4}
                            className="input resize-y leading-relaxed"
                          />
                          <div className="mt-2 flex gap-2">
                            <button onClick={() => saveEdit(e.id)} className="btn-primary !py-2 text-sm">Save</button>
                            <button onClick={() => setEditing(null)} className="btn-secondary !py-2 text-sm">Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <p className="mt-2 whitespace-pre-wrap leading-relaxed text-charcoal">
                          {e.content}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
