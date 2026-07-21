import { describe, it, expect } from "vitest";
import { timeAgo } from "@/lib/time";

describe("timeAgo", () => {
  it("says just now for very recent times", () => {
    expect(timeAgo(new Date().toISOString())).toBe("just now");
  });
  it("shows minutes", () => {
    const d = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    expect(timeAgo(d)).toBe("5m ago");
  });
  it("shows hours", () => {
    const d = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
    expect(timeAgo(d)).toBe("3h ago");
  });
});
