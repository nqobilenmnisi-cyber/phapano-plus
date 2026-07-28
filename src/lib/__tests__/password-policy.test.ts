import { describe, expect, it } from "vitest";
import {
  failedPasswordRules,
  isPasswordValid,
  PASSWORD_MIN_LENGTH,
  passwordError,
  passwordsMatch,
} from "@/lib/password-policy";

describe("password policy", () => {
  it("accepts a password that meets every rule", () => {
    expect(isPasswordValid("Abcdef1!")).toBe(true);
    expect(passwordError("Abcdef1!")).toBeNull();
  });

  it(`requires at least ${PASSWORD_MIN_LENGTH} characters`, () => {
    expect(failedPasswordRules("Ab1!")).toContain("length");
  });

  it("requires an uppercase letter", () => {
    expect(failedPasswordRules("abcdef1!")).toContain("upper");
  });

  it("requires a lowercase letter", () => {
    expect(failedPasswordRules("ABCDEF1!")).toContain("lower");
  });

  it("requires a number", () => {
    expect(failedPasswordRules("Abcdefg!")).toContain("number");
  });

  it("requires a special character", () => {
    expect(failedPasswordRules("Abcdefg1")).toContain("special");
    expect(failedPasswordRules("Abcdef1 ")).toContain("special");
  });

  it("accepts identical non-empty passwords", () => {
    expect(passwordsMatch("Abcdef1!", "Abcdef1!")).toBe(true);
  });

  it("rejects mismatched or empty confirmations", () => {
    expect(passwordsMatch("Abcdef1!", "Abcdef2!")).toBe(false);
    expect(passwordsMatch("", "")).toBe(false);
  });
});
