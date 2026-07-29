import "server-only";
import { lookup } from "node:dns/promises";
import {
  isUnsafePreviewHostname,
  normaliseHttpUrl,
  type LinkPreview,
} from "@/lib/community-posts";

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

async function assertPublicDestination(url: URL): Promise<void> {
  if (isUnsafePreviewHostname(url.hostname))
    throw new Error("Private link destinations are not allowed.");
  const addresses = await lookup(url.hostname, { all: true, verbatim: true });
  if (!addresses.length || addresses.some((entry) => isPrivateIp(entry.address)))
    throw new Error("Private link destinations are not allowed.");
}

function decodeHtml(value: string): string {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">");
}

function meta(html: string, names: string[]): string | null {
  for (const name of names) {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const patterns = [
      new RegExp(
        `<meta[^>]+(?:property|name)=["']${escaped}["'][^>]+content=["']([^"']*)["'][^>]*>`,
        "i"
      ),
      new RegExp(
        `<meta[^>]+content=["']([^"']*)["'][^>]+(?:property|name)=["']${escaped}["'][^>]*>`,
        "i"
      ),
    ];
    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match?.[1]) return decodeHtml(match[1]).slice(0, 500);
    }
  }
  return null;
}

async function readLimitedHtml(response: Response): Promise<string> {
  if (!response.body) return "";
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (total < 512_000) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    chunks.push(value);
  }
  await reader.cancel();
  const combined = new Uint8Array(
    chunks.reduce((sum, chunk) => sum + chunk.byteLength, 0)
  );
  let offset = 0;
  for (const chunk of chunks) {
    combined.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(combined).slice(0, 512_000);
}

export async function fetchSafeLinkPreview(
  input: string
): Promise<LinkPreview | null> {
  const normalised = normaliseHttpUrl(input);
  if (!normalised) return null;
  let url = new URL(normalised);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5_000);
  try {
    for (let redirects = 0; redirects <= 3; redirects += 1) {
      await assertPublicDestination(url);
      const response = await fetch(url, {
        redirect: "manual",
        signal: controller.signal,
        headers: {
          "User-Agent": "Phapano-Link-Preview/1.0",
          Accept: "text/html,application/xhtml+xml",
        },
      });
      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get("location");
        if (!location || redirects === 3) return null;
        url = new URL(location, url);
        if (!["http:", "https:"].includes(url.protocol)) return null;
        continue;
      }
      const contentType = response.headers.get("content-type") ?? "";
      if (!response.ok || !contentType.includes("text/html")) return null;
      const html = await readLimitedHtml(response);
      const fallbackTitle = decodeHtml(
        html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1] ?? ""
      ).trim();
      const title =
        meta(html, ["og:title", "twitter:title"]) || fallbackTitle || null;
      const description = meta(html, [
        "og:description",
        "twitter:description",
        "description",
      ]);
      const image = meta(html, ["og:image", "twitter:image"]);
      let imageUrl = image
        ? normaliseHttpUrl(new URL(image, url).toString())
        : null;
      if (imageUrl) {
        try {
          await assertPublicDestination(new URL(imageUrl));
        } catch {
          imageUrl = null;
        }
      }
      return {
        url: url.toString(),
        title: title?.slice(0, 200) ?? null,
        siteName:
          meta(html, ["og:site_name"])?.slice(0, 100) ?? url.hostname,
        description: description?.slice(0, 500) ?? null,
        imageUrl,
      };
    }
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
  return null;
}
