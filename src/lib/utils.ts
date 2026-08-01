import type {
  CareerStage,
  ProfessionalCategory,
  PsychologyStream,
  VerificationStatus,
} from "@/types/database";
import {
  SOUTH_AFRICA_TIME_ZONE,
  johannesburgDateParts,
} from "@/lib/time";

export function daysUntil(dateStr: string | null, now = new Date()): number | null {
  if (!dateStr) return null;
  const [year, month, day] = dateStr.split("-").map(Number);
  if (!year || !month || !day) return null;
  const today = johannesburgDateParts(now);
  const targetDay = Date.UTC(year, month - 1, day);
  const todayDay = Date.UTC(today.year, today.month - 1, today.day);
  const diff = Math.round((targetDay - todayDay) / 86_400_000);
  return diff;
}

export function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: SOUTH_AFRICA_TIME_ZONE,
  });
}

export function formatDateShort(dateStr: string | null): string {
  if (!dateStr) return "";
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
    timeZone: SOUTH_AFRICA_TIME_ZONE,
  });
}

/** Urgency band used by the Radar and deadline chips. */
export type Urgency = "now" | "soon" | "ahead" | "past";
export function urgencyOf(days: number | null): Urgency {
  if (days === null) return "ahead";
  if (days < 0) return "past";
  if (days <= 7) return "now";
  if (days <= 21) return "soon";
  return "ahead";
}

export const streamLabels: Record<PsychologyStream, string> = {
  clinical: "Clinical",
  counselling: "Counselling",
  research: "Research",
  educational: "Educational",
  industrial_organisational: "Industrial/Organisational",
  neuropsychology: "Neuropsychology",
  other: "Other",
};

export const careerStageLabels: Record<CareerStage, string> = {
  high_school: "High school learner",
  undergraduate: "Undergraduate student",
  honours_applicant: "Honours applicant",
  honours: "Honours student",
  masters_applicant: "Master's applicant",
  masters_student: "Master's student",
  intern: "Psychology intern",
  community_service: "Community service psychologist",
  professional: "Registered psychologist",
  other: "Other",
};

export const professionalCategoryLabels: Record<ProfessionalCategory, string> = {
  clinical_psychologist: "Clinical Psychologist",
  counselling_psychologist: "Counselling Psychologist",
  educational_psychologist: "Educational Psychologist",
  industrial_psychologist: "Industrial Psychologist",
  neuropsychologist: "Neuropsychologist",
  research_psychologist: "Research Psychologist",
  psychometrist: "Psychometrist",
  registered_counsellor: "Registered Counsellor",
  other: "Other",
};

export const PROFESSIONAL_CATEGORIES: ProfessionalCategory[] = [
  "clinical_psychologist",
  "counselling_psychologist",
  "educational_psychologist",
  "industrial_psychologist",
  "neuropsychologist",
  "research_psychologist",
  "psychometrist",
  "registered_counsellor",
  "other",
];

/**
 * The stages offered during onboarding, in the order we present them.
 * (High school is excluded from onboarding but remains a valid stage.)
 */
export const ONBOARDING_STAGES: CareerStage[] = [
  "undergraduate",
  "honours_applicant",
  "honours",
  "masters_applicant",
  "masters_student",
  "intern",
  "community_service",
  "professional",
  "other",
];

/**
 * The six recognised psychology Master's streams for the South African
 * context. "Other" is intentionally excluded from the selectable streams.
 */
export const STREAM_OPTIONS: PsychologyStream[] = [
  "clinical",
  "counselling",
  "educational",
  "industrial_organisational",
  "neuropsychology",
  "research",
];

/** Stages that are still on the pathway towards a postgraduate stream. */
export const PRE_POSTGRAD_STAGES: CareerStage[] = [
  "undergraduate",
  "honours_applicant",
  "honours",
];

export const verificationLabels: Record<VerificationStatus, string> = {
  pending: "Pending",
  verified: "Verified",
  flagged_under_review: "Under review",
  updated: "Updated",
  expired: "Expired",
  archived: "Archived",
};

export const SA_PROVINCES = [
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

export function greeting(now = new Date()): string {
  const h = johannesburgDateParts(now).hour;
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export function firstName(fullName: string | null | undefined): string {
  if (!fullName) return "";
  return fullName.trim().split(/\s+/)[0];
}

/** Whole days since an ISO timestamp (e.g. profile creation). Min 0. */
export function daysSince(iso: string | null | undefined): number {
  if (!iso) return 0;
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return 0;
  const diff = Date.now() - then;
  return Math.max(0, Math.floor(diff / 86_400_000));
}

// ---- Apply directory labels ---------------------------------------------
// Master's streams shown on the Apply page (the six recognised streams).
export const APPLY_STREAMS: { value: string; label: string }[] = [
  { value: "clinical", label: "Clinical" },
  { value: "counselling", label: "Counselling" },
  { value: "educational", label: "Educational" },
  { value: "industrial_organisational", label: "Industrial/Organisational" },
  { value: "research", label: "Research" },
  { value: "neuropsychology", label: "Neuropsychology" },
];

export function applyStreamLabel(value: string | null): string {
  if (!value) return "";
  return APPLY_STREAMS.find((s) => s.value === value)?.label ?? value;
}

// Fixed South African university abbreviation map (do NOT auto-generate
// initials). If an institution is not listed here, no badge is shown and the
// full institution name is displayed instead.
export const UNIVERSITY_ABBREVIATIONS: Record<string, string> = {
  "University of Cape Town": "UCT",
  "University of the Witwatersrand": "WITS",
  "University of Pretoria": "UP",
  "University of Johannesburg": "UJ",
  "University of KwaZulu-Natal": "UKZN",
  "Stellenbosch University": "SU",
  "Rhodes University": "RU",
  "North-West University": "NWU",
  "Nelson Mandela University": "NMU",
  "University of South Africa": "UNISA",
  "University of the Western Cape": "UWC",
  "University of the Free State": "UFS",
  "University of Fort Hare": "UFH",
  "University of Limpopo": "UL",
  "University of Venda": "UNIVEN",
  "University of Zululand": "UNIZULU",
  "Sefako Makgatho Health Sciences University": "SMU",
  "Walter Sisulu University": "WSU",
  "Tshwane University of Technology": "TUT",
  "Cape Peninsula University of Technology": "CPUT",
  "Durban University of Technology": "DUT",
  "Vaal University of Technology": "VUT",
  "Central University of Technology": "CUT",
  "Mangosuthu University of Technology": "MUT",
  "Sol Plaatje University": "SPU",
  "University of Mpumalanga": "UMP",
};

/** Returns the fixed abbreviation for an institution, or null if not mapped. */
export function universityAbbr(name: string | null | undefined): string | null {
  if (!name) return null;
  return UNIVERSITY_ABBREVIATIONS[name.trim()] ?? null;
}
