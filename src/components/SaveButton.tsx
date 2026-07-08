"use client";

import { useState, useTransition } from "react";

export function SaveButton({
  saved: initialSaved,
  onToggle,
  size = "md",
}: {
  saved: boolean;
  onToggle: (saved: boolean) => Promise<{ ok?: boolean; demo?: boolean }>;
  size?: "sm" | "md";
}) {
  const [saved, setSaved] = useState(initialSaved);
  const [pending, startTransition] = useTransition();

  function handle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const optimistic = !saved;
    setSaved(optimistic);
    startTransition(async () => {
      const res = await onToggle(saved); // pass previous state
      if (res?.demo) setSaved(initialSaved); // revert in demo mode
      else if (res && !res.ok) setSaved(!optimistic);
    });
  }

  const dim = size === "sm" ? "h-9 w-9" : "h-10 w-10";

  return (
    <button
      type="button"
      onClick={handle}
      disabled={pending}
      aria-pressed={saved}
      aria-label={saved ? "Remove from saved" : "Save"}
      className={`grid ${dim} flex-none place-items-center rounded-chip border transition ${
        saved
          ? "animate-pop border-bronze bg-bronze text-white"
          : "border-line bg-white text-charcoal-soft hover:border-bronze hover:text-bronze"
      }`}
    >
      <svg width="17" height="17" viewBox="0 0 24 24" fill={saved ? "currentColor" : "none"}>
        <path
          d="M6 4h12v16l-6-4-6 4V4Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
