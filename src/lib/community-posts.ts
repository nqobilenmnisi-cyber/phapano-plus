import type {
  CommunityImageMimeType,
  CommunityReactionType,
} from "@/types/database";

export const COMMUNITY_IMAGE_BUCKET = "community-post-media";
export const COMMUNITY_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
export const COMMUNITY_IMAGE_MIME_TYPES: CommunityImageMimeType[] = [
  "image/jpeg",
  "image/png",
  "image/webp",
];
export const COMMUNITY_REACTIONS: {
  value: CommunityReactionType;
  label: string;
}[] = [
  { value: "support", label: "Support" },
  { value: "insightful", label: "Insightful" },
  { value: "celebrate", label: "Celebrate" },
];

export type LinkPreview = {
  url: string;
  title: string | null;
  siteName: string;
  description: string | null;
  imageUrl: string | null;
};

const URL_PATTERN = /(?:https?:\/\/|www\.)[^\s<>"')\]]+/gi;

export function normaliseHttpUrl(value: string): string | null {
  try {
    const trimmed = value.trim();
    const url = new URL(
      /^www\./i.test(trimmed) ? `https://${trimmed}` : trimmed
    );
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    url.username = "";
    url.password = "";
    return url.toString();
  } catch {
    return null;
  }
}

export function extractFirstHttpUrl(text: string): string | null {
  const match = text.match(URL_PATTERN)?.[0];
  if (!match) return null;
  return normaliseHttpUrl(match.replace(/[.,!?;:]+$/, ""));
}

export function splitPostText(
  text: string
): { text: string; url: string | null }[] {
  const parts: { text: string; url: string | null }[] = [];
  let cursor = 0;
  for (const match of text.matchAll(URL_PATTERN)) {
    const index = match.index ?? 0;
    if (index > cursor) parts.push({ text: text.slice(cursor, index), url: null });
    const raw = match[0];
    const trailing = raw.match(/[.,!?;:]+$/)?.[0] ?? "";
    const clean = raw.slice(0, raw.length - trailing.length);
    parts.push({ text: clean, url: normaliseHttpUrl(clean) });
    if (trailing) parts.push({ text: trailing, url: null });
    cursor = index + raw.length;
  }
  if (cursor < text.length) parts.push({ text: text.slice(cursor), url: null });
  return parts.length ? parts : [{ text, url: null }];
}

export function validCommunityImageMetadata(input: {
  path: string;
  actorId: string;
  mimeType: string;
  size: number;
}): boolean {
  const extension = input.path.split(".").at(-1)?.toLowerCase();
  const extensionMatches =
    (input.mimeType === "image/jpeg" &&
      (extension === "jpg" || extension === "jpeg")) ||
    (input.mimeType === "image/png" && extension === "png") ||
    (input.mimeType === "image/webp" && extension === "webp");
  return (
    input.path.startsWith(`${input.actorId}/pending/`) &&
    !input.path.includes("..") &&
    COMMUNITY_IMAGE_MIME_TYPES.includes(
      input.mimeType as CommunityImageMimeType
    ) &&
    extensionMatches &&
    Number.isInteger(input.size) &&
    input.size > 0 &&
    input.size <= COMMUNITY_IMAGE_MAX_BYTES
  );
}

function isPrivateIp(address: string): boolean {
  const value = address.toLowerCase();
  if (value === "::1" || value === "::" || value.startsWith("fe80:")) return true;
  if (value.startsWith("fc") || value.startsWith("fd")) return true;
  const octets = value.split(".").map(Number);
  if (octets.length !== 4 || octets.some(Number.isNaN)) return false;
  return (
    octets[0] === 0 ||
    octets[0] === 10 ||
    octets[0] === 127 ||
    (octets[0] === 169 && octets[1] === 254) ||
    (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) ||
    (octets[0] === 192 && octets[1] === 168) ||
    octets[0] >= 224
  );
}

export function isUnsafePreviewHostname(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/\.$/, "");
  return (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    host.endsWith(".internal") ||
    ((host.includes(":") || /^\d{1,3}(?:\.\d{1,3}){3}$/.test(host)) &&
      isPrivateIp(host))
  );
}
