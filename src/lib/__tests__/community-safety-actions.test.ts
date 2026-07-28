import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  isReportCategory,
  REPORT_CATEGORIES,
} from "@/lib/community-validation";

const root = process.cwd();
const profileActions = readFileSync(
  join(root, "src/components/CommunityMemberActions.tsx"),
  "utf8"
);

describe("profile safety actions", () => {
  it("keeps Follow as the primary visible action", () => {
    expect(profileActions).toContain("FollowButton");
  });

  it("places Report and Block in a labelled keyboard menu", () => {
    expect(profileActions).toContain('aria-haspopup="menu"');
    expect(profileActions).toContain("More actions for");
    expect(profileActions).toContain("Report profile");
    expect(profileActions).toContain("Block user");
    expect(profileActions).toContain("ArrowDown");
    expect(profileActions).toContain("Escape");
  });

  it("requires a separate confirmation in an accessible dialog", () => {
    expect(profileActions).toContain('role="dialog"');
    expect(profileActions).toContain('aria-modal="true"');
    expect(profileActions).toContain("Block this user?");
    expect(profileActions).toContain("no longer see each other");
    expect(profileActions).toContain("manage blocked users later in Settings");
  });
});

describe("existing follow, report and moderation contracts", () => {
  it("retains follow and unfollow server mutations", () => {
    const actions = readFileSync(
      join(root, "src/app/(app)/app/community/actions.ts"),
      "utf8"
    );
    expect(actions).toContain("export async function toggleFollow");
    expect(actions).toContain("follower_id: auth.uid");
    expect(actions).toContain('.from("community_follows")');
    expect(actions).toContain(".delete()");
  });

  it("retains inline reporting on posts and comments", () => {
    const postCard = readFileSync(
      join(root, "src/components/CommunityPostCard.tsx"),
      "utf8"
    );
    const comments = readFileSync(
      join(root, "src/components/CommunityComments.tsx"),
      "utf8"
    );
    expect(postCard).toContain("ReportDialog");
    expect(comments).toContain("ReportDialog");
  });

  it("retains the approved report-category allowlist", () => {
    for (const category of REPORT_CATEGORIES) {
      expect(isReportCategory(category)).toBe(true);
    }
    expect(isReportCategory("not-a-category")).toBe(false);
  });
});
