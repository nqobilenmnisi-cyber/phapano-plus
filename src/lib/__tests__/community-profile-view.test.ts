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

  it("keeps Community profile editing inside the canonical You tab", () => {
    expect(myProfilePage).toContain(
      'redirect("/app/profile?section=community")'
    );
    expect(profileView).toContain(
      'href="/app/profile?section=community#community-settings"'
    );
    expect(profileView).toContain("Edit profile");
    expect(editProfilePage).toContain(
      'redirect("/app/profile?section=community#community-settings")'
    );
  });

  it("redirects self-profile member links to the canonical You page", () => {
    expect(memberPage).toContain(
      'redirect("/app/profile?section=community")'
    );
  });
});
