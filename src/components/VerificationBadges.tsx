import type {
  OrganisationPageType,
  ProfileVerificationBadge,
} from "@/types/database";

export function VerificationBadges({
  badges = [],
  organisationType,
  officialOrganisation = false,
}: {
  badges?: ProfileVerificationBadge[];
  organisationType?: OrganisationPageType;
  officialOrganisation?: boolean;
}) {
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      {badges.includes("verified_person") && (
        <Badge label="Verified person" tone="blue" icon="✓" />
      )}
      {badges.includes("founder") && (
        <Badge label="Founder" tone="bronze" icon="★" />
      )}
      {officialOrganisation && (
        <Badge
          label={
            organisationType === "initiative"
              ? "Official initiative"
              : "Official organisation"
          }
          tone="blue"
          icon="✓"
        />
      )}
    </span>
  );
}

function Badge({
  label,
  tone,
  icon,
}: {
  label: string;
  tone: "blue" | "bronze";
  icon: string;
}) {
  return (
    <span
      className={
        tone === "blue"
          ? "inline-flex items-center gap-1 rounded-chip border border-blue/25 bg-blue-tint px-2 py-1 text-[0.68rem] font-extrabold text-blue-deep"
          : "inline-flex items-center gap-1 rounded-chip border border-bronze-soft bg-[#FBF7F3] px-2 py-1 text-[0.68rem] font-extrabold text-bronze-deep"
      }
    >
      <span aria-hidden="true">{icon}</span>
      {label}
    </span>
  );
}
