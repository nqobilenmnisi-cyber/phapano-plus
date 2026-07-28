/**
 * Accept only same-site relative paths for post-authentication redirects.
 */
export function safeInternalPath(
  requested: string | null | undefined,
  fallback = "/dashboard"
): string {
  const candidate = requested?.trim() ?? "";
  if (
    !candidate.startsWith("/") ||
    candidate.startsWith("//") ||
    candidate.includes("\\") ||
    candidate.includes("\0")
  ) {
    return fallback;
  }

  try {
    const base = new URL("https://plus.phapano.com");
    const parsed = new URL(candidate, base);
    if (parsed.origin !== base.origin) return fallback;
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}
