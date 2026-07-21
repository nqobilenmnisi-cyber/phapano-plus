"use client";

/* Shared presentational pieces for Community Lite. */

import { careerStageLabels } from "@/lib/utils";
import { timeAgo } from "@/lib/time";
export { timeAgo };
import type { CareerStage } from "@/types/database";


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
      className="flex shrink-0 items-center justify-center rounded-full bg-soft font-sora text-sm font-bold text-charcoal-soft ring-1 ring-line"
      style={{ width: size, height: size }}
    >
      {initials || "•"}
    </span>
  );
}

export function StageLine({ stage }: { stage: CareerStage | null }) {
  if (!stage) return null;
  return (
    <span className="text-xs text-charcoal-soft">
      {careerStageLabels[stage]}
    </span>
  );
}
