"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import type { Notification } from "@/types/database";
import { markAllRead, markRead } from "@/app/(app)/app/settings/actions";

const typeMeta: Record<string, { dot: string; label: string }> = {
  deadline: { dot: "#C2693F", label: "Deadline" },
  funding: { dot: "#2E6FB0", label: "Funding" },
  system: { dot: "#5C5C5E", label: "Phapano" },
  community: { dot: "#AD795B", label: "Community" },
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return new Date(iso).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
  });
}

export function NotificationsList({
  initial,
  demo,
}: {
  initial: Notification[];
  demo: boolean;
}) {
  const [items, setItems] = useState(initial);
  const [, start] = useTransition();
  const unread = items.filter((n) => !n.read).length;

  function readOne(id: string) {
    setItems((xs) => xs.map((n) => (n.id === id ? { ...n, read: true } : n)));
    if (!demo) start(() => {
      markRead(id);
    });
  }

  function readAll() {
    setItems((xs) => xs.map((n) => ({ ...n, read: true })));
    if (!demo) start(() => {
      markAllRead();
    });
  }

  if (items.length === 0) {
    return (
      <p className="mt-8 rounded-card border border-dashed border-divider px-5 py-10 text-center text-sm text-charcoal-soft">
        You&apos;re all caught up. We&apos;ll let you know when something needs
        your attention.
      </p>
    );
  }

  return (
    <div className="mt-6">
      {unread > 0 && (
        <button
          onClick={readAll}
          className="mb-3 text-sm font-semibold text-blue-action hover:underline"
        >
          Mark all as read
        </button>
      )}
      <div className="space-y-2">
        {items.map((n) => {
          const meta = typeMeta[n.type] ?? typeMeta.system;
          const inner = (
            <div
              className={`flex items-start gap-3 rounded-card border p-4 transition ${
                n.read
                  ? "border-line bg-white"
                  : "border-[#D2E4F7] bg-blue-tint/40"
              }`}
            >
              <span
                className="mt-1.5 h-2.5 w-2.5 flex-none rounded-full"
                style={{ background: meta.dot }}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[0.68rem] font-extrabold uppercase tracking-wider text-charcoal-soft">
                    {meta.label}
                  </span>
                  <span className="text-xs text-charcoal-soft">
                    {timeAgo(n.created_at)}
                  </span>
                </div>
                <h3 className="font-sora text-sm font-semibold tracking-tight">
                  {n.title}
                </h3>
                {n.body && (
                  <p className="text-sm text-charcoal-soft">{n.body}</p>
                )}
              </div>
            </div>
          );

          return n.link ? (
            <Link key={n.id} href={n.link} onClick={() => readOne(n.id)}>
              {inner}
            </Link>
          ) : (
            <button
              key={n.id}
              onClick={() => readOne(n.id)}
              className="block w-full text-left"
            >
              {inner}
            </button>
          );
        })}
      </div>
    </div>
  );
}
