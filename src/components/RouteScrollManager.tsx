"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/** Prevent a previous route's scroll position from making a new page look cut off. */
export function RouteScrollManager() {
  const pathname = usePathname();

  useEffect(() => {
    if (window.location.hash) {
      const id = decodeURIComponent(window.location.hash.slice(1));
      window.requestAnimationFrame(() => {
        document.getElementById(id)?.scrollIntoView({ block: "start" });
      });
      return;
    }
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname]);

  return null;
}
