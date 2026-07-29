import type {
  OrganisationPageType,
  ProfileVerificationBadge,
} from "@/types/database";
import { VerifiedIcon } from "@/components/PhapanoIcons";

export function VerificationBadges({
  badges = [],
  organisationType,
  officialOrganisation = false,
}: {
  badges?: ProfileVerificationBadge[];
  organisationType?: OrganisationPageType;
  officialOrganisation?: boolean;
}) {
  const verified = badges.length > 0 || officialOrganisation;
  if (!verified) return null;
  const accessibleLabel = officialOrganisation
    ? organisationType === "initiative"
      ? "Verified Phapano initiative"
      : "Verified organisation"
    : badges.includes("founder")
      ? "Verified founder"
      : "Verified account";
  return (
    <span
      className="inline-flex shrink-0 align-middle text-blue-action"
      role="img"
      aria-label={accessibleLabel}
      title={accessibleLabel}
    >
      <VerifiedIcon className="h-[17px] w-[17px]" />
    </span>
  );
}
