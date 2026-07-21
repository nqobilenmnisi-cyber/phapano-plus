"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

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
    href: "/app/funding",
    label: "Funding",
    icon: (
      <>
        <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.7" />
        <path
          d="M12 8v8M9.5 9.8c0-1 1-1.6 2.5-1.6s2.5.6 2.5 1.6-1 1.5-2.5 1.7-2.5.7-2.5 1.7 1 1.6 2.5 1.6 2.5-.6 2.5-1.6"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </>
    ),
  },
  {
    href: "/app/journal",
    label: "Notes",
    icon: (
      <>
        <rect x="5.5" y="4" width="13" height="16" rx="2" stroke="currentColor" strokeWidth="1.7" />
        <path d="M5.5 8h13" stroke="currentColor" strokeWidth="1.4" />
        <path d="M9 12h6M9 15.5h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </>
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
  {
    href: "/app/profile",
    label: "You",
    icon: (
      <>
        <circle cx="12" cy="9" r="3.4" stroke="currentColor" strokeWidth="1.7" />
        <path d="M5 20a7 7 0 0 1 14 0" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      </>
    ),
  },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-paper/95 backdrop-blur-md"
    >
      <div className="mx-auto flex max-w-3xl justify-around px-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-2">
        {items.map((it) => {
          const active =
            it.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(it.href);
          return (
            <Link
              key={it.href}
              href={it.href}
              aria-current={active ? "page" : undefined}
              className={`flex flex-col items-center gap-0.5 rounded-chip px-2 py-1.5 text-[0.66rem] font-bold transition ${
                active ? "text-blue-action" : "text-charcoal-soft hover:text-charcoal"
              }`}
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-[22px] w-[22px]">
                {it.icon}
              </svg>
              {it.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
