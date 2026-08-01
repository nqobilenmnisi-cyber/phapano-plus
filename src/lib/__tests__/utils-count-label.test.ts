import { describe, expect, it } from "vitest";
import { countLabel } from "@/lib/utils";

describe("countLabel", () => {
  it("uses singular wording only for exactly one", () => {
    expect(countLabel(0, "application")).toBe("0 applications");
    expect(countLabel(1, "application")).toBe("1 application");
    expect(countLabel(2, "application")).toBe("2 applications");
  });

  it("supports irregular plural nouns", () => {
    expect(countLabel(1, "entry", "entries")).toBe("1 entry");
    expect(countLabel(3, "entry", "entries")).toBe("3 entries");
  });
});
