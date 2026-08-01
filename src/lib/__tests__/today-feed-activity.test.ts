import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  daysUntil,
  greeting,
} from "@/lib/utils";
import {
  johannesburgDateLabel,
  johannesburgDateParts,
  SOUTH_AFRICA_TIME_ZONE,
} from "@/lib/time";

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");

describe("Johannesburg time contracts", () => {
  it("uses Africa/Johannesburg independently of the server timezone", () => {
    expect(SOUTH_AFRICA_TIME_ZONE).toBe("Africa/Johannesburg");
    expect(johannesburgDateParts(new Date("2026-08-01T22:30:00Z"))).toEqual({
      year: 2026,
      month: 8,
      day: 2,
      hour: 0,
    });
    expect(johannesburgDateLabel(new Date("2026-08-01T22:30:00Z"))).toContain(
      "2 August"
    );
  });

  it("calculates greetings and due dates against the Johannesburg day", () => {
    const now = new Date("2026-08-01T22:30:00Z");
    expect(greeting(now)).toBe("Good morning");
    expect(daysUntil("2026-08-02", now)).toBe(0);
    expect(daysUntil("2026-08-03", now)).toBe(1);
  });
});

describe("Community feed refinement contracts", () => {
  const composer = read("src/components/CommunityComposer.tsx");
  const actions = read("src/app/(app)/app/community/actions.ts");
  const postCard = read("src/components/CommunityPostCard.tsx");
  const community = read("src/lib/community.ts");

  it("only creates link previews for posts without media", () => {
    expect(composer).toContain("includePreview && media.length === 0");
    expect(actions).toContain("attachments.length === 0");
    expect(actions).toContain("!imagePath");
    expect(postCard).toContain("post.link_url && !hasAttachments");
  });

  it("enforces either images or one PDF, never both", () => {
    expect(composer).toContain("A PDF must be the only attachment on a post.");
    expect(actions).toContain("pdfs.length === 1 && valid.length > 1");
  });

  it("routes plain-carry interactions to the original post", () => {
    expect(community).toContain("const isPlainCarry");
    expect(community).toContain("engagementCounts");
    expect(postCard).toContain("const interactionPostId = plainCarry");
    expect(postCard).toContain("toggleReaction(interactionPostId");
  });

  it("adds truncation, image viewing, saving, and an in-place delete dialog", () => {
    expect(postCard).toContain("function ExpandablePostText");
    expect(postCard).toContain("… more");
    expect(postCard).toContain("function ImageLightbox");
    expect(postCard).toContain("Save image");
    expect(postCard).toContain("function DeletePostDialog");
    expect(postCard).toContain("fixed inset-0 z-[100]");
  });

  it("uses a combined reaction summary instead of per-type count copy", () => {
    expect(postCard).toContain("function ReactionSummary");
    expect(postCard).not.toContain("`${option.label} ${reactionCounts");
  });
});

describe("Profile and discovery refinements", () => {
  it("makes research profiles available without a career-stage gate", () => {
    const profile = read("src/components/ProfileForm.tsx");
    expect(profile).toContain('htmlFor="scholar_url"');
    expect(profile).toContain('htmlFor="researchgate_url"');
    expect(profile).toContain('htmlFor="orcid"');
    expect(profile).not.toContain("SENIOR_STAGES");
  });

  it("adds direct connection actions and personal activity tabs", () => {
    const people = read("src/components/CommunityPeople.tsx");
    const activity = read("src/components/CommunityActivity.tsx");
    expect(people).toContain("<ConnectionButton");
    for (const label of ["Posts", "Carried", "Comments", "Reactions", "Media"])
      expect(activity).toContain(`label: "${label}"`);
  });
});
