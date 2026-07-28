/**
 * Shared password policy for client feedback and authoritative server checks.
 */

export const PASSWORD_MIN_LENGTH = 8;

export type PasswordRuleId =
  | "length"
  | "upper"
  | "lower"
  | "number"
  | "special";

export type PasswordRule = {
  id: PasswordRuleId;
  label: string;
  test: (password: string) => boolean;
};

export const PASSWORD_RULES: readonly PasswordRule[] = [
  {
    id: "length",
    label: `At least ${PASSWORD_MIN_LENGTH} characters`,
    test: (password) => password.length >= PASSWORD_MIN_LENGTH,
  },
  {
    id: "upper",
    label: "One uppercase letter",
    test: (password) => /[A-Z]/.test(password),
  },
  {
    id: "lower",
    label: "One lowercase letter",
    test: (password) => /[a-z]/.test(password),
  },
  {
    id: "number",
    label: "One number",
    test: (password) => /[0-9]/.test(password),
  },
  {
    id: "special",
    label: "One special character",
    test: (password) => /[^A-Za-z0-9\s]/.test(password),
  },
];

export function failedPasswordRules(password: string): PasswordRuleId[] {
  return PASSWORD_RULES.filter((rule) => !rule.test(password)).map(
    (rule) => rule.id
  );
}

export function isPasswordValid(password: string): boolean {
  return failedPasswordRules(password).length === 0;
}

export function passwordError(password: string): string | null {
  if (isPasswordValid(password)) return null;
  return "Your password must be at least 8 characters and include an uppercase letter, a lowercase letter, a number and a special character.";
}

export function passwordsMatch(
  password: string,
  confirmation: string
): boolean {
  return password.length > 0 && password === confirmation;
}
