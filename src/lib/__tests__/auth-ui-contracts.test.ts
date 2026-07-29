import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();

describe("signup password controls", () => {
  const form = readFileSync(
    join(root, "src/components/AuthForm.tsx"),
    "utf8"
  );

  it("includes Password and Confirm password fields", () => {
    expect(form).toContain('name="password"');
    expect(form).toContain('name="confirm_password"');
    expect(form).toContain("Confirm password");
  });

  it("provides accessible visibility controls for both fields", () => {
    expect(form).toContain('"Show password"');
    expect(form).toContain('"Hide password"');
    expect(form).toContain('"Show confirmation password"');
    expect(form).toContain('"Hide confirmation password"');
    expect(form.match(/aria-pressed=/g)?.length).toBeGreaterThanOrEqual(2);
  });

  it("uses the shared policy rather than a parallel checklist", () => {
    expect(form).toContain("PASSWORD_RULES.map");
    expect(form).toContain("isPasswordValid(password)");
    expect(form).toContain("passwordsMatch(password, confirmation)");
  });
});

describe("email confirmation states", () => {
  const verified = readFileSync(
    join(root, "src/app/(auth)/auth/verified/page.tsx"),
    "utf8"
  );
  const unavailable = readFileSync(
    join(root, "src/app/(auth)/auth/error/page.tsx"),
    "utf8"
  );

  it("shows the required success message and login action", () => {
    expect(verified).toContain("Your email has been confirmed.");
    expect(verified).toContain("Continue to Log In");
  });

  it("explains already-used, invalid and expired links without technical errors", () => {
    expect(verified).toContain("already been confirmed");
    expect(verified).toContain("already been used");
    expect(unavailable).toContain("invalid");
    expect(unavailable).toContain("expired");
    expect(unavailable).toContain("already been");
    expect(unavailable).not.toContain("Supabase");
  });
});

describe("login and account creation stay separate", () => {
  const actions = readFileSync(
    join(root, "src/app/(auth)/actions.ts"),
    "utf8"
  );
  const loginPage = readFileSync(
    join(root, "src/app/(auth)/login/page.tsx"),
    "utf8"
  );
  const signupPage = readFileSync(
    join(root, "src/app/(auth)/signup/page.tsx"),
    "utf8"
  );

  it("uses password sign-in only from the login action", () => {
    const signInSource = actions.slice(
      actions.indexOf("export async function signIn("),
      actions.indexOf("export async function resendVerification(")
    );
    expect(signInSource).toContain("signInWithPassword");
    expect(signInSource).not.toContain(".signUp(");
  });

  it("binds each route to its explicit action and mode", () => {
    expect(loginPage).toContain('mode="login" action={signIn}');
    expect(signupPage).toContain('mode="signup" action={signUp}');
  });
});
