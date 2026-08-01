"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { PostIcon } from "@/components/PhapanoIcons";

const items = [
  {
    href: "/dashboard",
    label: "Today",
    icon: (
      <path
        d="M4 11l8-6 8 6v8a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1v-8Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    ),
  },
  {
    href: "/app/apply",
    label: "Apply",
    icon: (
      <>
        <path
          d="M7 3h7l4 4v14H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
        <path d="M13 3v5h5M9 13h6M9 16h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </>
    ),
  },
  {
    href: "/app/community/new",
    label: "Post",
    icon: (
      <PostIcon className="h-6 w-6" />
    ),
  },
  {
    href: "/app/funding",
    label: "Funding",
    icon: (
      <text
        x="12"
        y="16"
        textAnchor="middle"
        fill="currentColor"
        fontSize="14"
        fontWeight="800"
        fontFamily="Arial, sans-serif"
      >
        R
      </text>
    ),
  },
  {
    href: "/app/community",
    label: "Community",
    icon: (
      <>
        <circle cx="9" cy="8.5" r="2.8" stroke="currentColor" strokeWidth="1.7" />
        <path d="M3.5 19a5.5 5.5 0 0 1 11 0" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        <circle cx="16.6" cy="9.6" r="2.2" stroke="currentColor" strokeWidth="1.6" />
        <path d="M15.2 14.7a4.6 4.6 0 0 1 5.8 4.3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </>
    ),
  },
];

export function BottomNav() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return createPortal(
    <nav
      aria-label="Primary"
      className="fixed bottom-0 left-0 right-0 z-[60] border-t border-line bg-paper/95 shadow-[0_-8px_28px_rgba(29,45,64,0.08)] backdrop-blur-md [transform:translateZ(0)]"
    >
      <div className="mx-auto grid max-w-3xl grid-cols-5 px-1 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-2">
        {items.map((it) => {
          const active =
            it.href === "/dashboard"
              ? pathname === "/dashboard"
              : it.href === "/app/community"
                ? pathname.startsWith("/app/community") &&
                  !pathname.startsWith("/app/community/new")
              : pathname.startsWith(it.href);
          return (
            <Link
              key={it.href}
              href={it.href}
              aria-current={active ? "page" : undefined}
              className={`min-w-0 flex flex-col items-center gap-0.5 rounded-chip px-1 py-1.5 text-[0.62rem] font-bold transition sm:text-[0.66rem] ${
                active ? "text-blue-action" : "text-charcoal-soft hover:text-charcoal"
              }`}
            >
              {it.href === "/app/community/new" ? (
                <span className="grid h-8 w-11 place-items-center rounded-full bg-blue-action text-white shadow-sm">
                  {it.icon}
                </span>
              ) : (
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                  className="h-[22px] w-[22px]"
                >
                  {it.icon}
                </svg>
              )}
              {it.label}
            </Link>
          );
        })}
      </div>
    </nav>,
    document.body
  );
}
