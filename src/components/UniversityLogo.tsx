"use client";

import { useState } from "react";

function domainOf(url: string | null): string | null {
  if (!url) return null;
  const m = url.replace(/^https?:\/\/(www\.)?/, "").split("/")[0];
  return m || null;
}

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter((w) => /[A-Za-z]/.test(w[0]))
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

/**
 * Displays a university's official logo. Tries the stored logo URL first, then
 * the official site favicon, and only falls back to initials if neither loads.
 * Logos are shown on a consistent white tile so varied marks look uniform.
 */
export function UniversityLogo({
  name,
  logoUrl,
  siteUrl,
  size = "sm",
}: {
  name: string;
  logoUrl: string | null;
  siteUrl: string | null;
  size?: "sm" | "lg";
}) {
  const dim =
    size === "lg" ? "h-14 w-14 rounded-xl text-lg" : "h-10 w-10 rounded-lg text-[0.8rem]";

  const domain = domainOf(siteUrl) ?? domainOf(logoUrl);
  const sources = [
    logoUrl || null,
    domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=128` : null,
  ].filter(Boolean) as string[];

  const [idx, setIdx] = useState(0);
  const src = sources[idx];

  if (!src) {
    return (
      <span
        className={`${dim} grid flex-none place-items-center bg-blue-tint font-extrabold text-blue-deep`}
      >
        {initialsOf(name)}
      </span>
    );
  }

  return (
    <span
      className={`${dim} flex-none overflow-hidden border border-line-soft bg-white`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={`${name} logo`}
        className="h-full w-full object-contain p-1"
        onError={() => setIdx((i) => i + 1)}
        loading="lazy"
      />
    </span>
  );
}
