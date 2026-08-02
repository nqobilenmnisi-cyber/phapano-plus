export const APPLICATION_STATUS_OPTIONS = [
  { value: "interested", label: "Interested" },
  { value: "preparing", label: "Preparing application" },
  { value: "submitted", label: "Submitted" },
  { value: "interview", label: "Interview invited" },
  { value: "waitlisted", label: "Waitlisted" },
  { value: "accepted", label: "Accepted" },
  { value: "unsuccessful", label: "Unsuccessful" },
  { value: "withdrawn", label: "Withdrawn" },
] as const;

export type ApplicationStatus =
  (typeof APPLICATION_STATUS_OPTIONS)[number]["value"];

type ApplicationActivity = {
  status: string | null;
  submitted: boolean;
  next_action?: string | null;
  my_deadline?: string | null;
  my_fee?: string | null;
  documents_uploaded?: boolean;
  referees_requested?: boolean;
  personal_statement_done?: boolean;
  cv_done?: boolean;
  transcript_uploaded?: boolean;
  fee_paid?: boolean;
  interview_received?: boolean;
  selection_completed?: boolean;
  outcome_received?: boolean;
  custom_steps?: { done: boolean }[];
  notes?: string | null;
};

const TERMINAL_STATUSES = new Set(["accepted", "unsuccessful", "withdrawn"]);

/** Whether the member has done anything beyond simply bookmarking a route. */
export function isApplicationStarted(plan: ApplicationActivity): boolean {
  const status = plan.status?.trim().toLowerCase();
  if (plan.submitted || (status && status !== "interested")) return true;
  if (plan.next_action?.trim() || plan.my_deadline || plan.my_fee?.trim() || plan.notes?.trim()) {
    return true;
  }
  if (
    plan.documents_uploaded ||
    plan.referees_requested ||
    plan.personal_statement_done ||
    plan.cv_done ||
    plan.transcript_uploaded ||
    plan.fee_paid ||
    plan.interview_received ||
    plan.selection_completed ||
    plan.outcome_received
  ) {
    return true;
  }
  return Boolean(plan.custom_steps?.length);
}

/** Active work only: completed or withdrawn applications do not inflate it. */
export function isApplicationActive(plan: ApplicationActivity): boolean {
  const status = plan.status?.trim().toLowerCase();
  if (plan.outcome_received || (status && TERMINAL_STATUSES.has(status))) return false;
  return isApplicationStarted(plan);
}
