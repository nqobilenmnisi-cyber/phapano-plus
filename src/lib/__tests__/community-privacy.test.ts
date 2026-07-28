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
    expect(migration).toMatch(
      /create policy cf_select on public\.community_follows for select using \(\s*follower_id = auth\.uid\(\) or followee_id = auth\.uid\(\)/
    );
  });
});
