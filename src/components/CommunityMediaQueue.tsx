"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setPostMediaStatus } from "@/app/admin/community/actions";
import { timeAgo } from "@/components/CommunityShared";

export type CommunityMediaQueueRow = {
  id: string;
  target: "post" | "attachment";
  kind: "image" | "pdf";
  body: string;
  imageUrl: string;
  imageAltText: string | null;
  authorName: string;
  createdAt: string;
};

export function CommunityMediaQueue({
  rows,
}: {
  rows: CommunityMediaQueueRow[];
}) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function decide(
    id: string,
    target: "post" | "attachment",
    status: "approved" | "removed"
  ) {
    setMessage(null);
    startTransition(async () => {
      const result = await setPostMediaStatus(id, status, target);
      if ("error" in result) setMessage(result.error);
      else router.refresh();
    });
  }

  return (
    <section className="mt-10 border-t border-line pt-8">
      <h2 className="font-sora text-xl font-bold tracking-tight">
        Image review
      </h2>
      <p className="mt-1 text-sm text-charcoal-soft">
        Images stay private until approved. Removing an image leaves its post
        caption intact.
      </p>
      {rows.length === 0 ? (
        <p className="mt-4 text-sm text-charcoal-soft">
          No images are waiting for review.
        </p>
      ) : (
        <ul className="mt-5 grid gap-4 sm:grid-cols-2">
          {rows.map((row) => (
            <li key={row.id} className="card overflow-hidden">
              {row.kind === "image" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={row.imageUrl}
                  alt={row.imageAltText ?? ""}
                  className="h-64 w-full bg-soft object-contain"
                />
              ) : (
                <a
                  href={row.imageUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="grid h-40 place-items-center bg-soft font-sora text-lg font-bold text-blue-deep"
                >
                  Open PDF ↗
                </a>
              )}
              <div className="p-4">
                <p className="text-xs font-bold text-charcoal-soft">
                  {row.authorName} · {timeAgo(row.createdAt)}
                </p>
                <p className="mt-2 line-clamp-3 text-sm text-charcoal">
                  {row.body}
                </p>
                <div className="mt-4 flex gap-2">
                  <button
                    className="btn-primary flex-1 !py-2 text-sm"
                    disabled={pending}
                    onClick={() => decide(row.id, row.target, "approved")}
                  >
                    Approve {row.kind}
                  </button>
                  <button
                    className="btn-secondary flex-1 !py-2 text-sm"
                    disabled={pending}
                    onClick={() => decide(row.id, row.target, "removed")}
                  >
                    Remove {row.kind}
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
      {message && (
        <p className="mt-3 text-sm font-semibold text-bronze-deep">{message}</p>
      )}
    </section>
  );
}
