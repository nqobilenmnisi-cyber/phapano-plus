export const PSYCHOLOGY_SKILLS = [
  "Academic writing",
  "Assessment administration",
  "Case management",
  "Community outreach",
  "Counselling skills",
  "Crisis support",
  "Data analysis",
  "Interviewing",
  "Literature reviews",
  "Mental health advocacy",
  "Programme evaluation",
  "Psychoeducation",
  "Psychological assessment",
  "Qualitative research",
  "Quantitative research",
  "Report writing",
  "Research design",
  "SPSS",
  "Statistical analysis",
  "Workshop facilitation",
] as const;

export const PSYCHOLOGY_INTERESTS = [
  "Child and adolescent mental health",
  "Community psychology",
  "Developmental psychology",
  "Educational psychology",
  "Forensic psychology",
  "Health psychology",
  "Industrial psychology",
  "Neuropsychology",
  "Psychometrics",
  "Public mental health",
  "Research methods",
  "Social psychology",
  "Trauma and resilience",
] as const;

export function parseStandardOptions(value: string | null | undefined): string[] {
  return (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}
