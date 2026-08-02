import { describe, expect, it } from "vitest";
import {
  isApplicationActive,
  isApplicationStarted,
} from "@/lib/application-plan-status";

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

  it("counts concrete plan work even when status remains interested", () => {
    expect(
      isApplicationStarted({
        status: "interested",
        submitted: false,
        next_action: "Request transcript",
      })
    ).toBe(true);
    expect(
      isApplicationStarted({
        status: "interested",
        submitted: false,
        notes: "Ask about selection dates",
      })
    ).toBe(true);
  });

  it("does not call terminal or outcome-received plans active", () => {
    expect(isApplicationActive({ status: "accepted", submitted: true })).toBe(false);
    expect(
      isApplicationActive({ status: "submitted", submitted: true, outcome_received: true })
    ).toBe(false);
  });

  it("keeps real preparation work active", () => {
    expect(
      isApplicationActive({ status: "interested", submitted: false, my_deadline: "2026-09-01" })
    ).toBe(true);
  });
});
