import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(path, "utf8");

describe("national Psychology university catalogue", () => {
  const migration = read("supabase/migrations/0031_psychology_university_catalogue.sql");

  it("contains exactly the 26 DHET public universities", () => {
    const slugs = Array.from(migration.matchAll(/^\('([^']+)'/gm), (match) => match[1]);
    expect(slugs).toHaveLength(26);
    expect(new Set(slugs).size).toBe(26);
    expect(slugs).toEqual(expect.arrayContaining([
      "cput", "cut", "dut", "mut", "nmu", "nwu", "rhodes", "smu", "spu",
      "stellenbosch", "tut", "uct", "ufh", "ufs", "uj", "ukzn", "ul", "ump",
      "up", "unisa", "univen", "uwc", "wits", "unizulu", "vut", "wsu",
    ]));
  });

  it("requires every level and fails closed when the national set is incomplete", () => {
    expect(migration).toContain("array['undergraduate', 'honours', 'masters', 'doctoral']");
    expect(migration).toContain("<> 26");
    expect(migration).toContain("'not_verified'");
    expect(migration).toContain("is_published = true");
  });

  it("publishes links from official university domains only", () => {
    const urls = Array.from(migration.matchAll(/https:\/\/[^'\"\\\s,}]+/g), (match) => match[0])
      .filter((value) => value !== "https://%");
    const allowedDomains = [
      "cput.ac.za", "cut.ac.za", "dut.ac.za", "mut.ac.za", "mandela.ac.za",
      "nwu.ac.za", "ru.ac.za", "smu.ac.za", "spu.ac.za", "sun.ac.za", "tut.ac.za",
      "uct.ac.za", "ufh.ac.za", "ufs.ac.za", "uj.ac.za", "ukzn.ac.za", "ul.ac.za",
      "ump.ac.za", "up.ac.za", "unisa.ac.za", "univen.ac.za", "uwc.ac.za",
      "wits.ac.za", "unizulu.ac.za", "vut.ac.za", "wsu.ac.za",
    ];

    expect(urls.length).toBeGreaterThan(70);
    for (const value of urls) {
      const hostname = new URL(value).hostname;
      expect(
        allowedDomains.some((domain) => hostname === domain || hostname.endsWith(`.${domain}`)),
        `${value} must use an official university domain`
      ).toBe(true);
    }
  });

  it("keeps the national audit separate from personal application plans", () => {
    const page = read("src/app/(app)/app/apply/page.tsx");
    const component = read("src/components/PsychologyUniversityCatalogue.tsx");
    expect(page).toContain("<PsychologyUniversityCatalogue");
    expect(page).toContain("<ApplyDirectory");
    expect(component).toContain('row.levels[item.key].status === "offered"');
    expect(component).toContain("Only institutions with a verified Psychology qualification are shown");
    expect(component).not.toContain("No current Psychology qualification verified");
    expect(component).not.toContain("Not offered in the current official catalogue");
    expect(component).toContain("Check the official catalogue");
  });
});
