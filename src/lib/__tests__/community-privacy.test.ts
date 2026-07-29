import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();

describe("follower and following privacy", () => {
  it("only exposes the caller's own lists through getFollowLists", () => {
    const source = readFileSync(join(root, "src/lib/community.ts"), "utf8");
    expect(source).toContain(
      "export async function getFollowLists(): Promise<{"
    );
    expect(source).not.toContain(
      "export async function getFollowLists(userId"
    );
  });

  it("does not load another member's lists on their profile route", () => {
    const source = readFileSync(
      join(root, "src/app/(app)/app/community/member/[id]/page.tsx"),
      "utf8"
    );
    expect(source).not.toContain("getFollowLists");
  });

  it("enforces list privacy in the database policy", () => {
    const migration = readFileSync(
      join(root, "supabase/migrations/0013_community_lite.sql"),
      "utf8"
    );
    expect(migration).toContain(
      "create policy cf_select on public.community_follows for select using ("
    );
    expect(migration).toContain(
      "follower_id = auth.uid() or followee_id = auth.uid()"
    );
  });
});

describe("connection-list privacy", () => {
  it("only exposes the caller's own connection hub", () => {
    const source = readFileSync(join(root, "src/lib/community.ts"), "utf8");
    expect(source).toContain(
      "export async function getConnectionHub(): Promise<{"
    );
    expect(source).not.toContain(
      "export async function getConnectionHub(userId"
    );
  });

  it("does not load another member's connection list on their profile", () => {
    const source = readFileSync(
      join(root, "src/app/(app)/app/community/member/[id]/page.tsx"),
      "utf8"
    );
    expect(source).not.toContain("getConnectionHub");
  });

  it("enforces participant-only rows in the database", () => {
    const migration = readFileSync(
      join(root, "supabase/migrations/0018_community_connections.sql"),
      "utf8"
    );
    expect(migration).toContain("create policy cconn_select");
    expect(migration).toContain("requester_id = auth.uid()");
    expect(migration).toContain("recipient_id = auth.uid()");
  });
});

describe("Passport-to-Community field privacy", () => {
  const migration = readFileSync(
    join(
      root,
      "supabase/migrations/0019_unify_passport_community_profile.sql"
    ),
    "utf8"
  );
  const form = readFileSync(
    join(root, "src/components/CommunityProfileForm.tsx"),
    "utf8"
  );
  const actions = readFileSync(
    join(root, "src/app/(app)/app/community/actions.ts"),
    "utf8"
  );

  it("defaults every sharing preference to private", () => {
    const definitions = migration.match(
      /add column if not exists share_[a-z_]+ boolean not null default false/g
    );
    expect(definitions).toHaveLength(13);
  });

  it("enforces a canonical projection on both Community and Passport writes", () => {
    expect(migration).toContain("community_profiles_project_passport");
    expect(migration).toContain("profiles_sync_community_projection");
    expect(migration).toContain("new.avatar_url := passport.avatar_url");
    expect(migration).toContain(
      "when passport.share_bio then passport.bio else null"
    );
  });

  it("whitelists submitted share controls and never offers private records", () => {
    expect(actions).toContain("normalizeCommunitySharingSelection");
    expect(actions).not.toContain('formData.get("email")');
    expect(form).toContain("Always private");
    expect(form).toContain("Applications, funding records, notes, documents");
    expect(form).not.toContain('value="email"');
    expect(form).not.toContain('value="application_year"');
  });
});
