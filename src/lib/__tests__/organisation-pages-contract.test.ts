import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");
const migration = read(
  "supabase/migrations/0021_organisation_pages_and_verification.sql"
);

describe("official organisation identity conversion", () => {
  it("targets only the four explicitly approved emails", () => {
    const approved = [
      "nqobiimnisi@gmail.com",
      "info@phapano.com",
      "phapanothedifference@gmail.com",
      "workshops@phapano.com",
    ];
    for (const email of approved) expect(migration).toContain(email);
    expect(migration).toContain("where id in (info_page, duplicate_info, workshops_page)");
    expect(migration).not.toMatch(/delete from auth\.users/i);
    expect(migration).not.toMatch(/where email (?:like|ilike)/i);
  });

  it("preserves duplicate content with conflict-safe relationship merges", () => {
    expect(migration).toContain("set author_id = info_page");
    expect(migration).toContain("on conflict (post_id, user_id) do nothing");
    expect(migration).toContain(
      "on conflict (follower_id, followee_id) do nothing"
    );
    expect(migration).toContain(
      "private.organisation_identity_relation_backup"
    );
  });

  it("keeps organisation pages follow-only at both UI and database layers", () => {
    const actions = read(
      "src/app/(app)/app/community/actions.ts"
    );
    const profile = read("src/components/OrganisationProfileView.tsx");
    expect(actions).toContain("Organisation pages are follow-only");
    expect(profile).toContain("allowConnection={false}");
    expect(profile).toContain("identityLabel=\"page\"");
    expect(profile).toContain("Parent organisation");
    expect(migration).toContain("community_reject_organisation_connection");
  });

  it("uses one standard inline mark for verified people and pages", () => {
    const badges = read("src/components/VerificationBadges.tsx");
    expect(badges).toContain("VerifiedIcon");
    expect(badges).toContain("inline-flex");
    expect(badges).toContain("Verified founder");
    expect(badges).toContain("Verified organisation");
    expect(badges).not.toContain("rounded-chip");
    expect(migration).toContain("(founder, 'verified_person')");
    expect(migration).toContain("(founder, 'founder')");
  });

  it("does not expose private Passport or application data on pages", () => {
    const page = read("src/components/OrganisationProfileView.tsx");
    for (const privateField of [
      "application",
      "funding",
      "journal",
      "document",
      "security",
    ]) {
      expect(page.toLocaleLowerCase()).not.toContain(privateField);
    }
  });
});
