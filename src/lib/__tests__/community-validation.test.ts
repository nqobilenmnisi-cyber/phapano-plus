import { describe, it, expect } from "vitest";
import {
  validatePostBody,
  validateCommentBody,
  validateDisplayName,
  isReportCategory,
  isVisibility,
} from "@/lib/community-validation";
import { POST_MAX_LENGTH, COMMENT_MAX_LENGTH } from "@/lib/community-constants";

describe("post validation", () => {
  it("rejects empty and whitespace", () => {
    expect(validatePostBody("")).toBe("empty");
    expect(validatePostBody("   ")).toBe("empty");
  });
  it("accepts normal text", () => {
    expect(validatePostBody("Hello community")).toBeNull();
  });
  it("rejects over the limit", () => {
    expect(validatePostBody("a".repeat(POST_MAX_LENGTH + 1))).toBe("too_long");
  });
});

describe("comment validation", () => {
  it("enforces its own limit", () => {
    expect(validateCommentBody("a".repeat(COMMENT_MAX_LENGTH + 1))).toBe("too_long");
    expect(validateCommentBody("ok")).toBeNull();
  });
});

describe("display name", () => {
  it("requires 2-60 chars", () => {
    expect(validateDisplayName("a")).toBe("invalid_length");
    expect(validateDisplayName("a".repeat(61))).toBe("invalid_length");
    expect(validateDisplayName("Nqobile")).toBeNull();
  });
});

describe("allowlists", () => {
  it("only accepts known report categories", () => {
    expect(isReportCategory("harassment")).toBe(true);
    expect(isReportCategory("nonsense")).toBe(false);
  });
  it("only accepts known visibilities", () => {
    expect(isVisibility("hidden")).toBe(true);
    expect(isVisibility("public")).toBe(false);
  });
});
