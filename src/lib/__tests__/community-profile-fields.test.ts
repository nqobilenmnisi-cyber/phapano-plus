import { describe, expect, it } from "vitest";
import {
  communityChoiceLabel,
  normalizeCommunitySharingSelection,
  normalizeCommunityProfileText,
  orcidProfileUrl,
  otherFieldRequired,
  profileHeadline,
  resolveOtherValue,
  safeExternalProfileUrl,
  shouldShowBio,
  validateCommunityProfileText,
} from "@/lib/community-profile-fields";

const baseInput = {
  headline: "",
  stage: "",
  stageOther: "",
  stream: "",
  streamOther: "",
  institution: "",
  bio: "",
};

describe("custom Other profile values", () => {
  it("keeps a custom value only while Other is selected", () => {
    expect(resolveOtherValue("other", "Peer supporter")).toBe(
      "Peer supporter"
    );
    expect(resolveOtherValue("clinical", "Peer supporter")).toBeNull();
  });

  it("requires custom text only while Other is selected", () => {
    expect(otherFieldRequired("other")).toBe(true);
    expect(otherFieldRequired("clinical")).toBe(false);
  });

  it("normalises saved values and clears stale Other text", () => {
    expect(
      normalizeCommunityProfileText({
        ...baseInput,
        headline: "  Research assistant  ",
        stage: "honours",
        stageOther: "Old custom stage",
        stream: "other",
        streamOther: "  Community psychology  ",
      })
    ).toEqual({
      headline: "Research assistant",
      stageOther: null,
      streamOther: "Community psychology",
      institution: null,
      bio: null,
    });
  });

  it("requires a description when Other is selected", () => {
    expect(
      validateCommunityProfileText({
        ...baseInput,
        stage: "other",
      })
    ).toContain("describe your pathway stage");
    expect(
      validateCommunityProfileText({
        ...baseInput,
        stream: "other",
      })
    ).toContain("describe your stream");
  });

  it("displays the saved custom value rather than the word Other", () => {
    expect(
      communityChoiceLabel("other", "Community psychology", {
        other: "Other",
      })
    ).toBe("Community psychology");
  });
});

describe("headline and bio presentation", () => {
  it("uses only a user-authored headline for the profile byline", () => {
    expect(profileHeadline("  Aspiring clinical psychologist  ")).toBe(
      "Aspiring clinical psychologist"
    );
    expect(profileHeadline(null)).toBe("");
  });

  it("hides an empty bio and shows a completed bio", () => {
    expect(shouldShowBio(null)).toBe(false);
    expect(shouldShowBio("   ")).toBe(false);
    expect(shouldShowBio("Final-year student.")).toBe(true);
  });

  it("rejects profile text beyond its limits", () => {
    expect(
      validateCommunityProfileText({
        ...baseInput,
        headline: "a".repeat(81),
      })
    ).toContain("headline");
    expect(
      validateCommunityProfileText({
        ...baseInput,
        bio: "a".repeat(281),
      })
    ).toContain("bio");
  });
});

describe("Passport sharing controls", () => {
  it("accepts only the explicit professional-field whitelist", () => {
    const preferences = normalizeCommunitySharingSelection([
      "share_bio",
      "share_linkedin",
      "email",
      "application_year",
    ]);
    expect(preferences.share_bio).toBe(true);
    expect(preferences.share_linkedin).toBe(true);
    expect(Object.keys(preferences)).not.toContain("email");
    expect(Object.keys(preferences)).not.toContain("application_year");
    expect(preferences.share_orcid).toBe(false);
  });

  it("permits only web links and normalises ORCID identifiers", () => {
    expect(safeExternalProfileUrl("linkedin.com/in/member")).toBe(
      "https://linkedin.com/in/member"
    );
    expect(safeExternalProfileUrl("javascript:alert(1)")).toBeNull();
    expect(safeExternalProfileUrl("data:text/html,unsafe")).toBeNull();
    expect(safeExternalProfileUrl("not a website")).toBeNull();
    expect(safeExternalProfileUrl("  example.org/profile  ")).toBe(
      "https://example.org/profile"
    );
    expect(orcidProfileUrl("0000-0002-1825-0097")).toBe(
      "https://orcid.org/0000-0002-1825-0097"
    );
  });
});
