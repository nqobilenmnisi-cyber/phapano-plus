import { describe, expect, it, vi } from "vitest";
import {
  normalizeEducation,
  normalizeExperience,
  parseEducationFormValue,
  parseExperienceFormValue,
  PROFILE_HISTORY_MAX_ENTRIES,
} from "@/lib/profile-history";

describe("Passport profile history", () => {
  it("normalizes education and removes empty entries", () => {
    expect(
      normalizeEducation([
        {
          id: "education-1",
          institution: "  University of Johannesburg ",
          qualification: " BA Honours ",
          field_of_study: " Psychology ",
          start_year: " 2022 ",
          end_year: " 2023 ",
          current: false,
          description: "  Research psychology ",
        },
        { institution: " ", qualification: " " },
      ])
    ).toEqual([
      {
        id: "education-1",
        institution: "University of Johannesburg",
        qualification: "BA Honours",
        field_of_study: "Psychology",
        start_year: "2022",
        end_year: "2023",
        current: false,
        description: "Research psychology",
      },
    ]);
  });

  it("clears an end date when an entry is current", () => {
    expect(
      normalizeExperience([
        {
          id: "experience-1",
          title: " Intern ",
          organisation: " Phapano ",
          start_date: "2026-01",
          end_date: "2026-12",
          current: true,
        },
      ])[0]
    ).toMatchObject({
      title: "Intern",
      organisation: "Phapano",
      end_date: "",
      current: true,
    });
  });

  it("safely rejects malformed form JSON", () => {
    expect(parseEducationFormValue("{not-json")).toEqual([]);
    expect(parseExperienceFormValue(null)).toEqual([]);
  });

  it("caps oversized histories", () => {
    vi.stubGlobal("crypto", { randomUUID: () => "generated-id" });
    const rows = Array.from(
      { length: PROFILE_HISTORY_MAX_ENTRIES + 3 },
      (_, index) => ({ institution: `Institution ${index}` })
    );
    expect(normalizeEducation(rows)).toHaveLength(PROFILE_HISTORY_MAX_ENTRIES);
    vi.unstubAllGlobals();
  });

  it("parses submitted experience JSON", () => {
    expect(
      parseExperienceFormValue(
        JSON.stringify([
          {
            id: "experience-2",
            title: "Research assistant",
            organisation: "University lab",
            location: "Johannesburg",
            start_date: "2024-02",
            end_date: "2025-01",
            current: false,
            description: "Supported qualitative coding.",
          },
        ])
      )
    ).toEqual([
      {
        id: "experience-2",
        title: "Research assistant",
        organisation: "University lab",
        location: "Johannesburg",
        start_date: "2024-02",
        end_date: "2025-01",
        current: false,
        description: "Supported qualitative coding.",
      },
    ]);
  });
});
