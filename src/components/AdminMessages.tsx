"use client";

import Link from "next/link";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { markMessageHandled } from "@/app/admin/messages/actions";
import { timeAgo } from "@/components/CommunityShared";
import type { ContactMessage } from "@/types/database";

export function MessagesList({
  messages,
  status,
}: {
  messages: ContactMessage[];
  status: "new" | "handled";
}) {
  return (
    <>
      <nav aria-label="Message status" className="mt-5 flex gap-2">
        {(["new", "handled"] as const).map((s) => (
          <Link
            key={s}
            href={`/admin/messages${s === "new" ? "" : "?status=handled"}`}
            aria-current={status === s ? "page" : undefined}
            className={`rounded-chip px-4 py-2 text-sm font-bold capitalize transition ${
              status === s
                ? "bg-charcoal text-paper"
                : "border border-line bg-paper text-charcoal-soft hover:text-charcoal"
            }`}
          >
            {s}
          </Link>
        ))}
      </nav>

      {messages.length === 0 ? (
        <p className="mt-6 text-sm text-charcoal-soft">
          No {status} messages.
        </p>
      ) : (
        <ul className="mt-6 space-y-3">
          {messages.map((m) => (
            <MessageCard key={m.id} message={m} />
          ))}
        </ul>
      )}
    </>
  );
}

function MessageCard({ message }: { message: ContactMessage }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const handled = message.status === "handled";

  return (
    <li className="card p-5">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-charcoal-soft">
        <span className="rounded-chip bg-soft px-2.5 py-1 font-bold text-charcoal">
          {message.category}
        </span>
        <time dateTime={message.created_at}>{timeAgo(message.created_at)}</time>
      </div>
      <p className="mt-2 text-sm font-semibold text-charcoal">
        {message.name}{" "}
        <a
          href={`mailto:${message.email}`}
          className="font-normal text-blue-action hover:underline"
        >
          {message.email}
        </a>
      </p>
      <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed text-charcoal">
        {message.message}
      </p>
      <button
        className="btn-secondary mt-4 !px-3.5 !py-2 text-sm"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            await markMessageHandled(message.id, !handled);
            router.refresh();
          })
        }
      >
        {pending
          ? "One moment…"
          : handled
            ? "Mark as new"
            : "Mark as handled"}
      </button>
    </li>
  );
}
