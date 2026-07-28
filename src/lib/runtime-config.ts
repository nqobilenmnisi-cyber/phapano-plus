export type RuntimeConfigurationInput = {
  nodeEnv: string | undefined;
  demoFlag: string | undefined;
  supabaseUrl: string | undefined;
  supabaseKey: string | undefined;
};

export function hasSupabaseConfiguration({
  supabaseUrl,
  supabaseKey,
}: Pick<
  RuntimeConfigurationInput,
  "supabaseUrl" | "supabaseKey"
>): boolean {
  const url = supabaseUrl?.trim() ?? "";
  const key = supabaseKey?.trim() ?? "";
  if (!url || !key) return false;
  if (!url.startsWith("https://")) return false;
  if (url.includes("placeholder") || url.includes("your-project-ref")) {
    return false;
  }
  if (key.includes("placeholder") || key.includes("your-publishable-key")) {
    return false;
  }
  return true;
}

export function isExplicitDevelopmentDemo({
  nodeEnv,
  demoFlag,
}: Pick<RuntimeConfigurationInput, "nodeEnv" | "demoFlag">): boolean {
  return nodeEnv === "development" && demoFlag === "true";
}

export function shouldFailClosed(
  input: RuntimeConfigurationInput
): boolean {
  return (
    !hasSupabaseConfiguration(input) &&
    !isExplicitDevelopmentDemo(input)
  );
}
