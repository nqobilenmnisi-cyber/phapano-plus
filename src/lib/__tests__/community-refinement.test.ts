import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  professionalCategoryLabels,
  PROFESSIONAL_CATEGORIES,
} from "@/lib/utils";
import {
  PSYCHOLOGY_INTERESTS,
  PSYCHOLOGY_SKILLS,
} from "@/lib/profile-options";
import { COMMUNITY_REACTIONS } from "@/lib/community-posts";

const read = (path: string) =>
  readFileSync(join(process.cwd(), path), "utf8");

describe("community and profile refinement", () => {
  it("offers the required South African professional categories in order", () => {
    expect(PROFESSIONAL_CATEGORIES.map(
      (category) => professionalCategoryLabels[category]
    )).toEqual([
      "Clinical Psychologist",
      "Counselling Psychologist",
      "Educational Psychologist",
      "Industrial Psychologist",
      "Neuropsychologist",
      "Research Psychologist",
      "Psychometrist",
      "Registered Counsellor",
      "Other",
    ]);
  });

  it("uses the three Phapano reaction meanings", () => {
    expect(COMMUNITY_REACTIONS).toEqual([
      { value: "support", label: "Support" },
      { value: "insightful", label: "Insightful" },
      { value: "celebrate", label: "Celebrate" },
    ]);
  });

  it("keeps curated skill and interest options unique", () => {
    expect(new Set(PSYCHOLOGY_SKILLS).size).toBe(PSYCHOLOGY_SKILLS.length);
    expect(new Set(PSYCHOLOGY_INTERESTS).size).toBe(
      PSYCHOLOGY_INTERESTS.length
    );
  });

  it("keeps the approved five-item navigation order", () => {
    const navigation = read("src/components/BottomNav.tsx");
    const labels = ["Today", "Apply", "Post", "Funding", "Community"];
    const positions = labels.map((label) =>
      navigation.indexOf(`label: "${label}"`)
    );
    expect(positions.every((position) => position >= 0)).toBe(true);
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
  });

  it("adds privacy-aware mentions and interaction notifications", () => {
    const migration = read(
      "supabase/migrations/0025_community_refinement.sql"
    );
    expect(migration).toContain("alter table public.community_mentions enable row level security");
    expect(migration).toContain("community_blocked_between");
    expect(migration).toContain("community_mentions_notify");
    expect(migration).toContain("community_reactions_notify");
    expect(migration).toContain("community_comments_notify");
    expect(migration).toContain("community_passes_notify");
    expect(migration).not.toMatch(/delete from auth\.users/i);
  });
});
