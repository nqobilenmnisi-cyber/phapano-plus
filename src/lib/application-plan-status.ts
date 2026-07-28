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

export function isApplicationStarted(plan: {
  status: string | null;
  submitted: boolean;
}): boolean {
  if (plan.submitted) return true;
  const status = plan.status?.trim().toLowerCase();
  return Boolean(status && status !== "interested");
}
