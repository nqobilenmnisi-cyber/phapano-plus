import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const profileView = readFileSync(
  join(root, "src/components/CommunityProfileView.tsx"),
  "utf8"
);
const myProfilePage = readFileSync(
  join(root, "src/app/(app)/app/community/profile/page.tsx"),
  "utf8"
);
const editProfilePage = readFileSync(
  join(root, "src/app/(app)/app/community/profile/edit/page.tsx"),
  "utf8"
);
const memberPage = readFileSync(
  join(root, "src/app/(app)/app/community/member/[id]/page.tsx"),
  "utf8"
);

describe("social-style Community profile", () => {
  it("shows the core public identity and social actions", () => {
    expect(profileView).toContain("MemberAvatar");
    expect(profileView).toContain("profile.display_name");
    expect(profileView).toContain("pathwayStage");
    expect(profileView).toContain("profileHeadline");
    expect(profileView).toContain("shouldShowBio");
    expect(profileView).toContain("CommunityMemberActions");
    expect(profileView).toContain("followers");
    expect(profileView).toContain("following");
    expect(profileView).toContain("connections");
    expect(profileView).toContain("connectionState");
  });

  it("gives the owner a My profile view and a separate Edit profile action", () => {
    expect(myProfilePage).toContain("My profile");
    expect(myProfilePage).toContain("isOwnProfile");
    expect(profileView).toContain('href="/app/community/profile/edit"');
    expect(profileView).toContain("Edit profile");
    expect(editProfilePage).toContain("Edit Community profile");
    expect(editProfilePage).toContain("CommunityProfileForm");
  });

  it("redirects self-profile member links to the canonical My profile page", () => {
    expect(memberPage).toContain('redirect("/app/community/profile")');
  });
});
