import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");

describe("application plan integrity", () => {
  it("keeps a plan row when a programme is unsaved", () => {
    const source = read("src/app/(app)/app/apply/actions.ts");
    expect(source).toContain("is_saved: false");
    expect(source).toContain("is_saved: true");
    expect(source).not.toContain('.from("saved_programmes")\n      .delete()');
  });

  it("filters bookmark queries without hiding active plans from the dashboard", () => {
    const queries = read("src/lib/queries.ts");
    const dashboard = read("src/app/(app)/dashboard/page.tsx");
    expect(queries).toContain('.eq("is_saved", true)');
    expect(dashboard).toContain("isApplicationStarted");
    expect(dashboard).not.toContain('status !== "Interested"');
  });

  it("reverts optimistic bookmark changes when saving fails", () => {
    const directory = read("src/components/ApplyDirectory.tsx");
    expect(directory).toContain("const result = await toggleSaveProgramme");
    expect(directory).toContain("if (!result.ok)");
    expect(directory).toContain("setSaved(wasSaved)");
    expect(directory).toContain('role="alert"');
  });
});

describe("reliable Notes mutations", () => {
  it("returns database-confirmed entries and never exposes raw database messages", () => {
    const actions = read("src/app/(app)/app/journal/actions.ts");
    expect(actions).toContain('.select("*")');
    expect(actions).toContain("entry: data as JournalEntry");
    expect(actions).not.toContain("error: error.message");
  });

  it("updates the UI only after server success", () => {
    const component = read("src/components/JournalEntries.tsx");
    expect(component).toContain("await createEntry(fd)");
    expect(component).toContain("await updateEntry(fd)");
    expect(component).toContain("await deleteEntry(id)");
    expect(component).not.toContain("tmp-");
    expect(component).toContain("Your text is still here");
  });
});

describe("honest unfinished settings", () => {
  it("does not present inactive notification controls as working", () => {
    const settings = read("src/app/(app)/app/settings/page.tsx");
    expect(settings).toContain("Coming soon");
    expect(settings).not.toContain("<NotificationSettings");
  });
});

describe("fail-closed authentication configuration", () => {
  it("returns an unavailable response instead of bypassing auth", () => {
    const middleware = read("src/lib/supabase/middleware.ts");
    expect(middleware).toContain("isDemoMode");
    expect(middleware).toContain("status: 503");
    expect(middleware).toContain('"Cache-Control": "no-store"');
  });
});

describe("patched framework compatibility", () => {
  it("awaits dynamic route parameters on Community pages", () => {
    const member = read(
      "src/app/(app)/app/community/member/[id]/page.tsx"
    );
    const post = read("src/app/(app)/app/community/post/[id]/page.tsx");
    expect(member).toContain("params: Promise<{ id: string }>");
    expect(member).toContain("const { id } = await params");
    expect(post).toContain("params: Promise<{ id: string }>");
    expect(post).toContain("const { id } = await params");
  });

  it("awaits page search parameters before reading them", () => {
    const routes = [
      "src/app/(app)/app/community/page.tsx",
      "src/app/(auth)/auth/verified/page.tsx",
      "src/app/admin/community/page.tsx",
      "src/app/admin/messages/page.tsx",
    ];
    for (const route of routes) {
      const source = read(route);
      expect(source).toMatch(/searchParams: Promise<\{/);
      expect(source).toContain("await searchParams");
    }
  });
});
