const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const BASE36 = "0123456789abcdefghijklmnopqrstuvwxyz";

export function compactPostId(id: string): string {
  if (!UUID_PATTERN.test(id)) return id;
  return BigInt(`0x${id.replaceAll("-", "")}`).toString(36);
}

export function expandPostId(code: string): string | null {
  if (UUID_PATTERN.test(code)) return code.toLowerCase();
  const normalized = code.trim().toLowerCase();
  if (!normalized || !/^[0-9a-z]+$/.test(normalized)) return null;

  let value = 0n;
  for (const character of normalized) {
    const digit = BASE36.indexOf(character);
    if (digit < 0) return null;
    value = value * 36n + BigInt(digit);
  }
  const hex = value.toString(16).padStart(32, "0");
  if (hex.length !== 32) return null;
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20),
  ].join("-");
}

export function postAuthorSlug(name: string): string {
  const slug = name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return slug || "member";
}

export function postPublicPath(id: string, authorName: string): string {
  return `/p/${postAuthorSlug(authorName)}/${compactPostId(id)}`;
}
