import { describe, expect, it } from "vitest";
import { isApplicationStarted } from "@/lib/application-plan-status";

describe("application plan status", () => {
  it("does not count interested plans as started regardless of case", () => {
    expect(
      isApplicationStarted({ status: "interested", submitted: false })
    ).toBe(false);
    expect(
      isApplicationStarted({ status: "Interested", submitted: false })
    ).toBe(false);
  });

  it("does not count an empty plan as started", () => {
    expect(isApplicationStarted({ status: null, submitted: false })).toBe(
      false
    );
  });

  it("counts a plan once preparation has begun", () => {
    expect(
      isApplicationStarted({ status: "preparing", submitted: false })
    ).toBe(true);
  });

  it("counts an explicitly submitted plan even without a status", () => {
    expect(isApplicationStarted({ status: null, submitted: true })).toBe(true);
  });
});
