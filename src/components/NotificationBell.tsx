"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BellIcon } from "@/components/PhapanoIcons";

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
      className="relative grid h-11 w-11 place-items-center rounded-chip border border-line bg-white text-charcoal-soft transition hover:border-blue hover:text-charcoal"
    >
      {hasUnread && (
        <span className="absolute right-2.5 top-2.5 h-[7px] w-[7px] rounded-full border-[1.5px] border-white bg-bronze" />
      )}
      <BellIcon className="h-[19px] w-[19px]" />
    </Link>
  );
}
