"use client";

import { useState, useTransition } from "react";
import { updateApplicationPlan } from "@/app/(app)/app/apply/actions";
import { APPLICATION_STATUS_OPTIONS } from "@/lib/application-plan-status";
import type { ApplicationPlan, CustomStep } from "@/types/database";

const CHECKS: { key: keyof ApplicationPlan; label: string }[] = [
  { key: "documents_uploaded", label: "Documents completed" },
  { key: "referees_requested", label: "Referees contacted" },
  { key: "personal_statement_done", label: "Personal statement completed" },
  { key: "cv_done", label: "CV completed" },
  { key: "transcript_uploaded", label: "Transcript uploaded" },
  { key: "fee_paid", label: "Application fee paid" },
  { key: "submitted", label: "Application submitted" },
  { key: "interview_received", label: "Interview invitation received" },
  { key: "selection_completed", label: "Selection week completed" },
  { key: "outcome_received", label: "Outcome received" },
];

const EMPTY: ApplicationPlan = {
  is_saved: true,
  status: "interested",
  next_action: null,
  my_deadline: null,
  my_fee: null,
  documents_uploaded: false,
  referees_requested: false,
  personal_statement_done: false,
  cv_done: false,
  transcript_uploaded: false,
  fee_paid: false,
  submitted: false,
  interview_received: false,
  selection_completed: false,
  outcome_received: false,
  custom_steps: [],
  notes: null,
};

function newId() {
  try {
    return crypto.randomUUID();
  } catch {
    return `s_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }
}

export function ApplicationPlanTracker({
  programmeId,
  initial,
  demo,
}: {
  programmeId: string;
  initial: ApplicationPlan | null;
  demo: boolean;
}) {
  const start = { ...EMPTY, ...(initial ?? {}) };
  const [plan, setPlan] = useState<ApplicationPlan>({
    ...start,
    status: start.status ?? "interested",
    custom_steps: Array.isArray(start.custom_steps) ? start.custom_steps : [],
  });
  const [newStep, setNewStep] = useState("");
  const [showNotes, setShowNotes] = useState(Boolean(initial?.notes));
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startT] = useTransition();

  function set<K extends keyof ApplicationPlan>(key: K, value: ApplicationPlan[K]) {
    setSaved(false);
    setPlan((p) => ({ ...p, [key]: value }));
  }

  function addStep() {
    const title = newStep.trim();
    if (!title) return;
    const step: CustomStep = { id: newId(), title, done: false };
    set("custom_steps", [...plan.custom_steps, step]);
    setNewStep("");
  }
  function toggleStep(id: string) {
    set(
      "custom_steps",
      plan.custom_steps.map((s) => (s.id === id ? { ...s, done: !s.done } : s))
    );
  }
  function deleteStep(id: string) {
    set("custom_steps", plan.custom_steps.filter((s) => s.id !== id));
  }

  function save() {
    if (demo) return;
    setError(null);
    setSaved(false);
    startT(async () => {
      const res = await updateApplicationPlan(programmeId, {
        status: plan.status,
        next_action: plan.next_action,
        my_deadline: plan.my_deadline,
        my_fee: plan.my_fee,
        documents_uploaded: plan.documents_uploaded,
        referees_requested: plan.referees_requested,
        personal_statement_done: plan.personal_statement_done,
        cv_done: plan.cv_done,
        transcript_uploaded: plan.transcript_uploaded,
        fee_paid: plan.fee_paid,
        submitted: plan.submitted,
        interview_received: plan.interview_received,
        selection_completed: plan.selection_completed,
        outcome_received: plan.outcome_received,
        custom_steps: plan.custom_steps,
        notes: plan.notes,
      });
      if (res?.error) setError(res.error);
      else if (res?.ok) setSaved(true);
    });
  }

  return (
    <section className="card mt-4 p-6">
      <h2 className="font-sora text-lg font-bold tracking-tight">
        My application plan
      </h2>
      <p className="mt-1 text-sm text-charcoal-soft">
        Private to you. Your deadline and next action show on your dashboard.
      </p>

      {/* status + next action */}
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="status">Status</label>
          <select
            id="status"
            value={plan.status ?? "interested"}
            onChange={(e) => set("status", e.target.value)}
            className="input"
          >
            {APPLICATION_STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="next_action">Next action</label>
          <input
            id="next_action"
            value={plan.next_action ?? ""}
            onChange={(e) => set("next_action", e.target.value || null)}
            className="input"
            placeholder="e.g. Request transcript"
          />
        </div>
      </div>

      {/* deadline + fee */}
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="my_deadline">My application deadline</label>
          <input
            id="my_deadline"
            type="date"
            value={plan.my_deadline ?? ""}
            onChange={(e) => set("my_deadline", e.target.value || null)}
            className="input"
          />
        </div>
        <div>
          <label className="label" htmlFor="my_fee">My application fee</label>
          <input
            id="my_fee"
            value={plan.my_fee ?? ""}
            onChange={(e) => set("my_fee", e.target.value || null)}
            className="input"
            placeholder="e.g. R150"
          />
        </div>
      </div>

      {/* checklist */}
      <ul className="mt-5 space-y-1.5">
        {CHECKS.map((c) => (
          <li key={c.key}>
            <label className="flex cursor-pointer items-center gap-3 rounded-chip px-3 py-2 hover:bg-soft">
              <input
                type="checkbox"
                checked={Boolean(plan[c.key])}
                onChange={(e) => set(c.key, e.target.checked as ApplicationPlan[typeof c.key])}
                className="h-4 w-4 accent-[#2E6FB0]"
              />
              <span className={`text-sm ${plan[c.key] ? "text-charcoal-soft line-through" : "text-charcoal"}`}>
                {c.label}
              </span>
            </label>
          </li>
        ))}

        {/* custom steps */}
        {plan.custom_steps.map((s) => (
          <li key={s.id}>
            <div className="flex items-center gap-3 rounded-chip px-3 py-2 hover:bg-soft">
              <input
                type="checkbox"
                checked={s.done}
                onChange={() => toggleStep(s.id)}
                className="h-4 w-4 accent-[#2E6FB0]"
              />
              <span className={`flex-1 text-sm ${s.done ? "text-charcoal-soft line-through" : "text-charcoal"}`}>
                {s.title}
              </span>
              <button
                onClick={() => deleteStep(s.id)}
                aria-label="Delete step"
                className="text-xs font-semibold text-charcoal-soft hover:text-bronze-deep"
              >
                Remove
              </button>
            </div>
          </li>
        ))}
      </ul>

      {/* add custom step */}
      <div className="mt-3 flex gap-2">
        <input
          value={newStep}
          onChange={(e) => setNewStep(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addStep();
            }
          }}
          className="input flex-1"
          placeholder="Add custom step, e.g. Book psychometric assessment"
        />
        <button onClick={addStep} className="btn-secondary !py-2 text-sm">
          Add step
        </button>
      </div>

      {/* notes */}
      <div className="mt-5">
        {showNotes || plan.notes ? (
          <>
            <label className="label" htmlFor="notes">Notes</label>
            <textarea
              id="notes"
              value={plan.notes ?? ""}
              onChange={(e) => set("notes", e.target.value || null)}
              rows={4}
              className="input resize-none"
              placeholder="Questions for the department, interview prep, reminders…"
            />
          </>
        ) : (
          <button
            onClick={() => setShowNotes(true)}
            className="text-sm font-semibold text-blue-action hover:underline"
          >
            + Add private notes
          </button>
        )}
      </div>

      <div className="mt-5 flex items-center gap-3">
        <button onClick={save} disabled={pending || demo} className="btn-primary !py-2 text-sm">
          {pending ? "Saving…" : "Save my plan"}
        </button>
        {saved && <span className="text-sm font-semibold text-ok">Saved</span>}
        {error && <span className="text-sm text-bronze-deep">{error}</span>}
        {demo && <span className="text-xs text-charcoal-soft">Connect Supabase to save.</span>}
      </div>
    </section>
  );
}
