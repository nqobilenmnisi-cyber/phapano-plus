import { universityAbbr } from "@/lib/utils";

/**
 * Small, consistent, text-based institution badge using the fixed abbreviation
 * map. Renders nothing when the institution isn't in the map (the full name is
 * shown alongside it instead). No icons or generated initials.
 */
export function UniversityBadge({
  institution,
  size = "sm",
}: {
  institution: string | null | undefined;
  size?: "sm" | "lg";
}) {
  const abbr = universityAbbr(institution);
  if (!abbr) return null;

  const dims =
    size === "lg"
      ? "min-w-12 px-2.5 py-1.5 text-sm"
      : "min-w-10 px-2 py-1 text-xs";

  return (
    <span
      className={`inline-flex flex-none items-center justify-center rounded-lg bg-charcoal font-extrabold tracking-wide text-paper ${dims}`}
      aria-hidden="true"
    >
      {abbr}
    </span>
  );
}
