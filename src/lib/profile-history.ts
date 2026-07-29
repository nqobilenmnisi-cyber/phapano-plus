import type { EducationEntry, ExperienceEntry } from "@/types/database";

export const PROFILE_HISTORY_MAX_ENTRIES = 20;
export const PROFILE_HISTORY_TEXT_MAX_LENGTH = 500;

function text(value: unknown, max = 120): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function id(value: unknown): string {
  const clean = text(value, 80);
  return clean || crypto.randomUUID();
}

export function normalizeEducation(value: unknown): EducationEntry[] {
  if (!Array.isArray(value)) return [];
  return value.slice(0, PROFILE_HISTORY_MAX_ENTRIES).flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const row = item as Record<string, unknown>;
    const institution = text(row.institution);
    const qualification = text(row.qualification);
    if (!institution && !qualification) return [];
    return [{
      id: id(row.id),
      institution,
      qualification,
      field_of_study: text(row.field_of_study),
      start_year: text(row.start_year, 4),
      end_year: Boolean(row.current) ? "" : text(row.end_year, 4),
      current: Boolean(row.current),
      description: text(row.description, PROFILE_HISTORY_TEXT_MAX_LENGTH),
    }];
  });
}

export function normalizeExperience(value: unknown): ExperienceEntry[] {
  if (!Array.isArray(value)) return [];
  return value.slice(0, PROFILE_HISTORY_MAX_ENTRIES).flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const row = item as Record<string, unknown>;
    const title = text(row.title);
    const organisation = text(row.organisation);
    if (!title && !organisation) return [];
    return [{
      id: id(row.id),
      title,
      organisation,
      location: text(row.location),
      start_date: text(row.start_date, 7),
      end_date: Boolean(row.current) ? "" : text(row.end_date, 7),
      current: Boolean(row.current),
      description: text(row.description, PROFILE_HISTORY_TEXT_MAX_LENGTH),
    }];
  });
}

function parseJson(value: FormDataEntryValue | null): unknown {
  if (typeof value !== "string" || !value.trim()) return [];
  try {
    return JSON.parse(value);
  } catch {
    return [];
  }
}

export function parseEducationFormValue(
  value: FormDataEntryValue | null
): EducationEntry[] {
  return normalizeEducation(parseJson(value));
}

export function parseExperienceFormValue(
  value: FormDataEntryValue | null
): ExperienceEntry[] {
  return normalizeExperience(parseJson(value));
}
