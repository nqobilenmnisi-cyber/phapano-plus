import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(path, "utf8");

describe("production locality", () => {
  it("runs compute alongside the Ireland database", () => {
    const vercel = JSON.parse(read("vercel.json")) as {
      fluid?: boolean;
      regions?: string[];
    };
    expect(vercel.fluid).toBe(true);
    expect(vercel.regions).toEqual(["dub1"]);
  });

  it("verifies asymmetric sessions without a per-navigation user lookup", () => {
    const middleware = read("src/lib/supabase/middleware.ts");
    const queries = read("src/lib/queries.ts");
    expect(middleware).toContain("auth.getClaims()");
    expect(middleware).not.toContain("auth.getUser()");
    expect(queries).toContain("auth.getClaims()");
  });
});

describe("data and media performance", () => {
  it("caches published directories independently from member state", () => {
    const queries = read("src/lib/queries.ts");
    const publicClient = read("src/lib/supabase/public.ts");
    expect(queries).toContain("unstable_cache");
    expect(queries).toContain('tags: ["funding-directory"]');
    expect(queries).toContain('tags: ["programme-directory"]');
    expect(publicClient).toContain("persistSession: false");
  });

  it("uses the image optimiser for member and feed media", () => {
    const shared = read("src/components/CommunityShared.tsx");
    const cards = read("src/components/CommunityPostCard.tsx");
    expect(shared).toContain('from "next/image"');
    expect(cards).toContain('from "next/image"');
    expect(cards).toContain('sizes="(max-width: 672px) 100vw, 672px"');
  });

  it("collects real-user speed measurements", () => {
    const layout = read("src/app/layout.tsx");
    expect(layout).toContain("@vercel/speed-insights/next");
    expect(layout).toContain("<SpeedInsights />");
  });
});
