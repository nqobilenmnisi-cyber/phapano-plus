import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");

describe("funding directory refinement", () => {
  it("preserves every existing funding filter", () => {
    const directory = read("src/components/FundingDirectory.tsx");
    for (const filter of [
      "undergraduate",
      "honours",
      "masters",
      "doctoral",
      "postdoctoral",
      "research_grant",
      "conference_travel",
    ]) {
      expect(directory).toContain(`value: "${filter}"`);
    }
  });

  it("uses the shared icon for funding and programme save actions", () => {
    const fundingCard = read("src/components/FundingCard.tsx");
    const apply = read("src/components/ApplyDirectory.tsx");
    expect(fundingCard).toContain("<BookmarkIcon");
    expect(apply).toContain("<BookmarkIcon");
    expect(fundingCard).not.toMatch(/>\s*Bookmarked?\s*</i);
  });

  it("does not display monitoring language or numerical funding summaries", () => {
    const page = read("src/app/(app)/app/funding/page.tsx");
    const directory = read("src/components/FundingDirectory.tsx");
    expect(page).not.toContain("Live funding board");
    expect(page).not.toContain("monitors official sources");
    expect(directory).not.toContain("Verified sources");
    expect(directory).not.toContain("Available now");
    expect(directory).not.toContain("Closing soon");
    expect(directory).not.toContain("countLabel");
  });

  it("opens the verified official information page before fallback links", () => {
    const fundingCard = read("src/components/FundingCard.tsx");
    expect(fundingCard).toContain("funding.source_url ?? funding.link");
  });
});

describe("guarded official-source refresh", () => {
  it("runs weekly and can also be started manually", () => {
    const workflow = read(".github/workflows/refresh-funding.yml");
    expect(workflow).toContain("workflow_dispatch:");
    expect(workflow).toContain('cron: "0 3 * * 1"');
    expect(workflow).toContain("SUPABASE_SERVICE_ROLE_KEY");
  });

  it("queues changed facts instead of publishing extracted values", () => {
    const script = read("scripts/refresh-funding.mjs");
    expect(script).toContain('.from("funding_updates").insert');
    expect(script).not.toMatch(/\.update\(\{[^}]*closing_date/s);
    expect(script).not.toMatch(/\.update\(\{[^}]*eligibility/s);
    expect(script).not.toMatch(/\.update\(\{[^}]*amount_description/s);
    expect(script).not.toMatch(/\.update\(\{[^}]*is_open/s);
  });
});

describe("strict public funding eligibility", () => {
  it("fails closed and republishes only the audited Psychology-safe set", () => {
    const migration = read("supabase/migrations/0029_funding_integrity_audit.sql");
    expect(migration).toContain("where is_published = true");
    expect(migration).toContain("Psychology explicitly eligible");
    expect(migration).toContain("All fields, including Psychology");
    for (const rejected of [
      "canon-collins",
      "rhodes-ruth-first-2027",
      "ufs-postgraduate-support-2026",
      "wits-postgraduate-merit-award-2026",
      "ernst-ethel-eriksen-2027",
    ]) {
      expect(migration).not.toContain(`'${rejected}'`);
    }
  });
});
