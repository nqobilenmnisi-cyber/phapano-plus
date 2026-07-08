"use client";

import { useState, useTransition } from "react";

export type FieldType = "text" | "textarea" | "date" | "select" | "number";

export interface FieldDef {
  name: string;
  label: string;
  type: FieldType;
  options?: { value: string; label: string }[];
  placeholder?: string;
  full?: boolean;
}

export interface AdminRow {
  id: string;
  title: string;
  subtitle?: string;
  published: boolean;
  lastVerified?: string | null;
  values: Record<string, string>;
}

export function AdminManager({
  heading,
  description,
  fields,
  rows,
  onSave,
  onDelete,
  demo,
}: {
  heading: string;
  description: string;
  fields: FieldDef[];
  rows: AdminRow[];
  onSave: (fd: FormData) => Promise<{ ok?: boolean; demo?: boolean; error?: string }>;
  onDelete: (id: string) => Promise<{ ok?: boolean }>;
  demo: boolean;
}) {
  const [editing, setEditing] = useState<AdminRow | "new" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function submit(fd: FormData) {
    setError(null);
    start(async () => {
      const res = await onSave(fd);
      if (res?.demo) {
        setError("Connect Supabase to save changes. This is a preview.");
        return;
      }
      if (res?.error) {
        setError(res.error);
        return;
      }
      setEditing(null);
    });
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-sora text-2xl font-bold tracking-tight">
            {heading}
          </h1>
          <p className="mt-1 text-sm text-charcoal-soft">{description}</p>
        </div>
        <button onClick={() => setEditing("new")} className="btn-primary !py-2 text-sm">
          + Add new
        </button>
      </div>

      {/* list */}
      <div className="mt-6 space-y-2">
        {rows.length === 0 && (
          <p className="rounded-card border border-dashed border-divider px-5 py-10 text-center text-sm text-charcoal-soft">
            {demo
              ? "Connect Supabase to manage live content."
              : "Nothing here yet. Add your first item."}
          </p>
        )}
        {rows.map((row) => (
          <div
            key={row.id}
            className="card flex items-center justify-between gap-4 p-4"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="truncate font-sora font-semibold">{row.title}</h3>
                <span
                  className={`rounded-full px-2 py-0.5 text-[0.65rem] font-bold uppercase ${
                    row.published
                      ? "bg-[#E4F1EA] text-ok"
                      : "bg-line text-charcoal-soft"
                  }`}
                >
                  {row.published ? "Published" : "Draft"}
                </span>
              </div>
              {row.subtitle && (
                <p className="truncate text-sm text-charcoal-soft">
                  {row.subtitle}
                </p>
              )}
              {row.lastVerified && (
                <p className="text-xs text-charcoal-soft">
                  Verified {row.lastVerified}
                </p>
              )}
            </div>
            <div className="flex flex-none gap-2">
              <button
                onClick={() => setEditing(row)}
                className="btn-secondary !px-3 !py-1.5 text-sm"
              >
                Edit
              </button>
              <button
                onClick={() => {
                  if (confirm(`Delete "${row.title}"?`))
                    start(() => {
                      onDelete(row.id);
                    });
                }}
                className="grid h-9 w-9 place-items-center rounded-chip border border-line text-charcoal-soft transition hover:border-bronze hover:text-bronze-deep"
                aria-label="Delete"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M5 7h14M9 7V5h6v2m-8 0 1 13h8l1-13" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* editor drawer */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-charcoal/40 p-4 backdrop-blur-sm">
          <div className="card my-8 w-full max-w-2xl p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-sora text-lg font-bold tracking-tight">
                {editing === "new" ? `New ${heading.toLowerCase()}` : "Edit"}
              </h2>
              <button
                onClick={() => setEditing(null)}
                className="text-charcoal-soft hover:text-charcoal"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <form action={submit} className="mt-5 grid gap-4 sm:grid-cols-2">
              {editing !== "new" && (
                <input type="hidden" name="id" value={editing.id} />
              )}
              {fields.map((f) => {
                const val =
                  editing !== "new" ? editing.values[f.name] ?? "" : "";
                return (
                  <div key={f.name} className={f.full ? "sm:col-span-2" : ""}>
                    <label className="label" htmlFor={f.name}>
                      {f.label}
                    </label>
                    {f.type === "textarea" ? (
                      <textarea
                        id={f.name}
                        name={f.name}
                        defaultValue={val}
                        rows={3}
                        placeholder={f.placeholder}
                        className="input resize-none"
                      />
                    ) : f.type === "select" ? (
                      <select
                        id={f.name}
                        name={f.name}
                        defaultValue={val}
                        className="input"
                      >
                        {f.options?.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        id={f.name}
                        name={f.name}
                        type={f.type}
                        defaultValue={val}
                        placeholder={f.placeholder}
                        className="input"
                      />
                    )}
                  </div>
                );
              })}

              <label className="flex items-center gap-2 sm:col-span-2">
                <input
                  type="checkbox"
                  name="is_published"
                  defaultChecked={editing !== "new" ? editing.published : false}
                  className="h-4 w-4 rounded border-line"
                />
                <span className="text-sm font-semibold">
                  Published (visible to students)
                </span>
              </label>

              {error && (
                <p className="text-sm text-bronze-deep sm:col-span-2">{error}</p>
              )}

              <div className="flex gap-2 sm:col-span-2">
                <button type="submit" disabled={pending} className="btn-primary">
                  {pending ? "Saving…" : "Save"}
                </button>
                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
