import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(path, "utf8");

describe("funding route hardening", () => {
  it("binds funding actions inside a client component", () => {
    const page = read("src/app/(app)/app/funding/[id]/page.tsx");
    const button = read("src/components/FundingSaveButton.tsx");
    expect(page).toContain("<FundingSaveButton");
    expect(page).not.toContain("onToggle={async");
    expect(button).toContain("toggleSaveFunding(fundingId, wasSaved)");
  });

  it("matches new funding alerts against directory categories", () => {
    const migration = read(
      "supabase/migrations/0033_stage_relevant_funding_notifications.sql"
    );
    expect(migration).toContain("coalesce(f.categories");
    expect(migration).toContain("array['undergraduate']::text[]");
    expect(migration).toContain("array['honours']::text[]");
    expect(migration).toContain("array['masters']::text[]");
    expect(migration).not.toContain("array_length(f.relevant_stages");
  });
});

describe("navigation and onboarding hardening", () => {
  it("keeps notification generation out of the shared app layout", () => {
    const layout = read("src/app/(app)/app/layout.tsx");
    const queries = read("src/lib/queries.ts");
    expect(layout).toContain("getUnreadNotificationCount");
    expect(layout).not.toContain("getNotifications");
    expect(queries).toContain('{ count: "exact", head: true }');
  });

  it("sends new Community members to the visible setup section", () => {
    const community = read("src/app/(app)/app/community/page.tsx");
    const profile = read("src/app/(app)/app/profile/page.tsx");
    expect(community).toContain('redirect("/app/profile#community-settings")');
    expect(profile).toContain("Set up public profile");
  });

  it("shows route feedback and resets scroll position", () => {
    expect(read("src/app/(app)/app/loading.tsx")).toContain("Loading page");
    expect(read("src/app/(app)/dashboard/loading.tsx")).toContain("Loading Today");
    expect(read("src/components/RouteScrollManager.tsx")).toContain("window.scrollTo");
  });
});

describe("interaction reliability", () => {
  it("renders Apply incrementally", () => {
    const directory = read("src/components/ApplyDirectory.tsx");
    expect(directory).toContain("const PAGE_SIZE = 12");
    expect(directory).toContain("base.slice(0, visibleCount)");
    expect(directory).toContain("Show {Math.min");
  });

  it("leaves a deleted post detail route and reverts failed reactions", () => {
    const card = read("src/components/CommunityPostCard.tsx");
    expect(card).toContain('router.replace("/app/community")');
    expect(card).toContain("setReaction(previous)");
    expect(card).toContain('setMessage("Post shared.")');
  });

  it("explains mention searches and limits saving feedback to one section", () => {
    const mentions = read("src/components/MentionTextarea.tsx");
    const profile = read("src/components/ProfileForm.tsx");
    expect(mentions).toContain("Finding members…");
    expect(mentions).toContain("No other member matches");
    expect(profile).toContain('pending && active ? "Saving…"');
  });
});
