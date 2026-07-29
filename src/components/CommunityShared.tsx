"use client";

/* Shared presentational pieces for Community Lite. */

import { timeAgo } from "@/lib/time";
export { timeAgo };


export function MemberAvatar({
  name,
  avatarUrl,
  size = 40,
}: {
  name: string;
  avatarUrl: string | null;
  size?: number;
}) {
  const initials = name
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const palettes = [
    ["#DCEEFF", "#2E6FB0"],
    ["#F5E6DD", "#8A5135"],
    ["#E3F3EC", "#2F7259"],
    ["#EEE7F7", "#65478A"],
    ["#FFF0CC", "#7A5A12"],
  ] as const;
  const palette =
    palettes[
      Array.from(name).reduce((total, character) => total + character.charCodeAt(0), 0) %
        palettes.length
    ];
  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt=""
        width={size}
        height={size}
        className="shrink-0 rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      className="relative flex shrink-0 items-center justify-center overflow-hidden rounded-full font-sora font-extrabold shadow-sm ring-2 ring-white"
      style={{
        width: size,
        height: size,
        background: `linear-gradient(145deg, ${palette[0]}, white)`,
        color: palette[1],
        fontSize: Math.max(12, Math.round(size * 0.32)),
      }}
    >
      <span
        className="absolute -right-[18%] -top-[20%] h-[58%] w-[58%] rounded-full bg-white/55"
        aria-hidden="true"
      />
      {initials || "•"}
    </span>
  );
}
