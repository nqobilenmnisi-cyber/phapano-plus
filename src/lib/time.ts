/* Pure date formatting — safe to import anywhere. */

export const SOUTH_AFRICA_TIME_ZONE = "Africa/Johannesburg";

export function timeAgo(iso: string): string {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
    year: d > 300 ? "numeric" : undefined,
    timeZone: SOUTH_AFRICA_TIME_ZONE,
  });
}

export function johannesburgDateParts(now = new Date()): {
  year: number;
  month: number;
  day: number;
  hour: number;
} {
  const parts = new Intl.DateTimeFormat("en-ZA", {
    timeZone: SOUTH_AFRICA_TIME_ZONE,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    hourCycle: "h23",
  }).formatToParts(now);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value ?? 0);
  return {
    year: value("year"),
    month: value("month"),
    day: value("day"),
    hour: value("hour"),
  };
}

export function johannesburgDateLabel(now = new Date()): string {
  return new Intl.DateTimeFormat("en-ZA", {
    timeZone: SOUTH_AFRICA_TIME_ZONE,
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(now);
}

export function johannesburgTimeLabel(now = new Date()): string {
  return new Intl.DateTimeFormat("en-ZA", {
    timeZone: SOUTH_AFRICA_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(now);
}
