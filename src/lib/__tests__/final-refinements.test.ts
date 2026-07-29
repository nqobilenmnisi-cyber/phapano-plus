import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");

describe("access choices", () => {
  const header = read("src/components/SiteChrome.tsx");
  const landing = read("src/app/(site)/page.tsx");
  const authActions = read("src/app/(auth)/actions.ts");

  it("keeps Log in and Create account explicit on small screens", () => {
    expect(header).toContain('href="/login"');
    expect(header).toContain("Log in");
    expect(header).toContain('href="/signup"');
    expect(header).toContain("Create account");
    expect(header).not.toContain(
      'className="hidden text-sm font-semibold text-charcoal-soft'
    );
  });

  it("uses Log in as the returning-user default without hiding account creation", () => {
    expect(landing).toContain(
      'const ctaHref = authed ? "/dashboard" : "/login"'
    );
    expect(landing).toContain('href={authed ? "/features" : "/signup"}');
  });

  it("does not report an obfuscated duplicate sign-up as a new account", () => {
    expect(authActions).toContain("data.user.identities?.length === 0");
    expect(authActions).toContain("already exists. Log in instead.");
  });
});

describe("automatic notification acknowledgement", () => {
  const notifications = read("src/components/NotificationsList.tsx");

  it("marks unread notifications on opening while retaining their highlight", () => {
    expect(notifications).toContain("useEffect");
    expect(notifications).toContain("await markAllRead()");
    expect(notifications).toContain("highlightedIds.has(n.id)");
    expect(notifications).toContain("phapano:notifications-read");
    expect(notifications).toContain(
      "New notifications are highlighted and have been marked as read."
    );
  });
});

describe("one canonical You profile", () => {
  const profile = read("src/app/(app)/app/profile/page.tsx");
  const community = read("src/app/(app)/app/community/page.tsx");

  it("contains both Passport and Community profile controls in You", () => {
    expect(profile).toContain("Phapano Passport");
    expect(profile).toContain("Community profile &amp; privacy");
    expect(profile).toContain("CommunityProfileForm");
    expect(profile).toContain("CommunityProfileView");
  });

  it("keeps Community focused on posts and discovery", () => {
    expect(community).not.toContain("My profile");
    expect(community).not.toContain("CommunityProfileForm");
    expect(community).toContain('redirect("/app/profile?section=community")');
  });
});

describe("account and profile reliability migration", () => {
  const migration = read(
    "supabase/migrations/0024_account_profile_refinements.sql"
  );

  it("refreshes account deletion and the API schema cache", () => {
    expect(migration).toContain(
      "create or replace function public.delete_own_account()"
    );
    expect(migration).toContain("notify pgrst, 'reload schema'");
  });

  it("keeps canonical bios unrestricted and normalises personal websites", () => {
    expect(migration).toContain(
      "drop constraint if exists community_profiles_bio_check"
    );
    expect(migration).toContain("'https://' || trim(website_url)");
    expect(migration).toContain("set website_url = null");
  });
});
