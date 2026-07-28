import { describe, expect, it } from "vitest";
import { safeInternalPath } from "@/lib/safe-redirect";

describe("safeInternalPath", () => {
  it("keeps a normal internal path, query and hash", () => {
    expect(safeInternalPath("/app/community?q=clinical#latest")).toBe(
      "/app/community?q=clinical#latest"
    );
  });

  it("rejects absolute external URLs", () => {
    expect(safeInternalPath("https://example.com/phishing")).toBe("/dashboard");
  });

  it("rejects protocol-relative URLs", () => {
    expect(safeInternalPath("//example.com/phishing")).toBe("/dashboard");
  });

  it("rejects backslash-based browser URL ambiguity", () => {
    expect(safeInternalPath("/\\example.com")).toBe("/dashboard");
  });

  it("uses the supplied fallback for malformed or missing values", () => {
    expect(safeInternalPath(undefined, "/login")).toBe("/login");
    expect(safeInternalPath("not-a-path", "/login")).toBe("/login");
  });
});
