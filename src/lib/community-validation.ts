/* Pure validation helpers shared by server actions and unit tests.
   No server imports here so they can be tested in isolation. */

import { POST_MAX_LENGTH, COMMENT_MAX_LENGTH } from "@/lib/community-constants";

export const REPORT_CATEGORIES = [
  "harassment",
  "misinformation",
  "scam",
  "hate",
  "sexual_content",
  "privacy",
  "impersonation",
  "spam",
  "professional_misconduct",
  "other",
] as const;

export const VISIBILITIES = ["visible", "limited", "hidden"] as const;

export function validatePostBody(body: string): string | null {
  const t = body.trim();
  if (!t) return "empty";
  if (t.length > POST_MAX_LENGTH) return "too_long";
  return null;
}

export function validateCommentBody(body: string): string | null {
  const t = body.trim();
  if (!t) return "empty";
  if (t.length > COMMENT_MAX_LENGTH) return "too_long";
  return null;
}

export function validateDisplayName(name: string): string | null {
  const t = name.trim();
  if (t.length < 2 || t.length > 60) return "invalid_length";
  return null;
}

export function isReportCategory(v: string): boolean {
  return (REPORT_CATEGORIES as readonly string[]).includes(v);
}

export function isVisibility(v: string): boolean {
  return (VISIBILITIES as readonly string[]).includes(v);
}
