/**
 * Pure Community-profile rules shared by the form, server action and tests.
 */

export const COMMUNITY_HEADLINE_MAX_LENGTH = 80;
export const COMMUNITY_OTHER_MAX_LENGTH = 80;
export const COMMUNITY_BIO_MAX_LENGTH = 280;
export const COMMUNITY_INSTITUTION_MAX_LENGTH = 120;

export type CommunityProfileTextInput = {
  headline: string;
  stage: string;
  stageOther: string;
  stream: string;
  streamOther: string;
  institution: string;
  bio: string;
};

export type NormalizedCommunityProfileText = {
  headline: string | null;
  stageOther: string | null;
  streamOther: string | null;
  institution: string | null;
  bio: string | null;
};

function optionalText(value: string): string | null {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

export function resolveOtherValue(
  selected: string,
  otherText: string
): string | null {
  return selected === "other" ? optionalText(otherText) : null;
}

export function otherFieldRequired(selected: string): boolean {
  return selected === "other";
}

export function normalizeCommunityProfileText(
  input: CommunityProfileTextInput
): NormalizedCommunityProfileText {
  return {
    headline: optionalText(input.headline),
    stageOther: resolveOtherValue(input.stage, input.stageOther),
    streamOther: resolveOtherValue(input.stream, input.streamOther),
    institution: optionalText(input.institution),
    bio: optionalText(input.bio),
  };
}

export function validateCommunityProfileText(
  input: CommunityProfileTextInput
): string | null {
  const normalized = normalizeCommunityProfileText(input);

  if (
    normalized.headline &&
    normalized.headline.length > COMMUNITY_HEADLINE_MAX_LENGTH
  ) {
    return `Your headline can be up to ${COMMUNITY_HEADLINE_MAX_LENGTH} characters.`;
  }
  if (
    normalized.institution &&
    normalized.institution.length > COMMUNITY_INSTITUTION_MAX_LENGTH
  ) {
    return `Your institution can be up to ${COMMUNITY_INSTITUTION_MAX_LENGTH} characters.`;
  }
  if (normalized.bio && normalized.bio.length > COMMUNITY_BIO_MAX_LENGTH) {
    return `Your bio can be up to ${COMMUNITY_BIO_MAX_LENGTH} characters.`;
  }
  if (input.stage === "other" && !normalized.stageOther) {
    return "Please describe your pathway stage, or choose another option.";
  }
  if (
    normalized.stageOther &&
    normalized.stageOther.length > COMMUNITY_OTHER_MAX_LENGTH
  ) {
    return `Your pathway stage can be up to ${COMMUNITY_OTHER_MAX_LENGTH} characters.`;
  }
  if (input.stream === "other" && !normalized.streamOther) {
    return "Please describe your stream or interest area, or choose another option.";
  }
  if (
    normalized.streamOther &&
    normalized.streamOther.length > COMMUNITY_OTHER_MAX_LENGTH
  ) {
    return `Your stream or interest area can be up to ${COMMUNITY_OTHER_MAX_LENGTH} characters.`;
  }
  return null;
}

export function profileHeadline(headline: string | null): string {
  return headline?.trim() ?? "";
}

export function shouldShowBio(bio: string | null): boolean {
  return Boolean(bio?.trim());
}

export function communityChoiceLabel(
  selected: string | null,
  otherText: string | null,
  labels: Record<string, string>
): string | null {
  if (!selected) return null;
  if (selected === "other") return otherText?.trim() || "Other";
  return labels[selected] ?? selected;
}
