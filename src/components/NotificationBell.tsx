"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export function NotificationBell({ unread }: { unread: number }) {
  const [hasUnread, setHasUnread] = useState(unread > 0);

  useEffect(() => {
    setHasUnread(unread > 0);
  }, [unread]);

  useEffect(() => {
    const clear = () => setHasUnread(false);
    window.addEventListener("phapano:notifications-read", clear);
    return () => window.removeEventListener("phapano:notifications-read", clear);
  }, []);

  return (
    <Link
      href="/app/notifications"
      aria-label="Notifications"
      className="relative grid h-10 w-10 place-items-center rounded-chip border border-line bg-white text-charcoal-soft transition hover:border-blue hover:text-charcoal"
    >
      {hasUnread && (
        <span className="absolute right-2.5 top-2.5 h-[7px] w-[7px] rounded-full border-[1.5px] border-white bg-bronze" />
      )}
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
        <path
          d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
        <path
          d="M10 20a2 2 0 0 0 4 0"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
      </svg>
    </Link>
  );
}
