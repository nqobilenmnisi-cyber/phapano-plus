import { describe, expect, it } from "vitest";
import {
  hasSupabaseConfiguration,
  isExplicitDevelopmentDemo,
  shouldFailClosed,
} from "@/lib/runtime-config";

const configured = {
  nodeEnv: "production",
  demoFlag: undefined,
  supabaseUrl: "https://abc123.supabase.co",
  supabaseKey: "public-anon-key",
};

describe("runtime configuration", () => {
  it("recognises a complete Supabase configuration", () => {
    expect(hasSupabaseConfiguration(configured)).toBe(true);
    expect(shouldFailClosed(configured)).toBe(false);
  });

  it("rejects missing and placeholder credentials", () => {
    expect(
      hasSupabaseConfiguration({
        supabaseUrl: undefined,
        supabaseKey: undefined,
      })
    ).toBe(false);
    expect(
      hasSupabaseConfiguration({
        supabaseUrl: "https://your-project-ref.supabase.co",
        supabaseKey: "your-publishable-key",
      })
    ).toBe(false);
  });

  it("allows demo mode only when development explicitly enables it", () => {
    expect(
      isExplicitDevelopmentDemo({
        nodeEnv: "development",
        demoFlag: "true",
      })
    ).toBe(true);
    expect(
      isExplicitDevelopmentDemo({
        nodeEnv: "production",
        demoFlag: "true",
      })
    ).toBe(false);
  });

  it("fails closed in production when configuration is absent", () => {
    expect(
      shouldFailClosed({
        nodeEnv: "production",
        demoFlag: "true",
        supabaseUrl: undefined,
        supabaseKey: undefined,
      })
    ).toBe(true);
  });
});
