"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import {
  acceptGuidelines,
  createPost,
} from "@/app/(app)/app/community/actions";
import { POST_MAX_LENGTH } from "@/lib/community-constants";

export function CommunityComposer({
  acceptedGuidelines,
}: {
  acceptedGuidelines: boolean;
}) {
  const [body, setBody] = useState("");
  const [agree, setAgree] = useState(false);
  const [accepted, setAccepted] = useState(acceptedGuidelines);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function publish() {
    setError(null);
    startTransition(async () => {
      if (!accepted) {
        if (!agree) {
          setError(
            "Please read and accept the Community Guidelines before your first post."
          );
          return;
        }
        const acceptance = await acceptGuidelines();
        if ("error" in acceptance) {
          setError(acceptance.error);
          return;
        }
        setAccepted(true);
      }
      const formData = new FormData();
      formData.set("body", body);
      const result = await createPost(formData);
      if ("error" in result) setError(result.error);
      else setBody("");
    });
  }

  return (
    <section
      aria-label="Create a post"
      className="card overflow-hidden border-blue/20"
    >
      <div className="border-b border-line bg-gradient-to-r from-blue-tint/70 to-white px-5 py-4">
        <h2 className="font-sora text-base font-bold tracking-tight">
          Share with the community
        </h2>
        <p className="mt-0.5 text-xs text-charcoal-soft">
          Ask a question, celebrate a milestone or share a useful resource.
        </p>
      </div>
      <div className="p-5">
      <label className="sr-only" htmlFor="composer">
        Share something with the community
      </label>
        <textarea
          id="composer"
          className="input min-h-24 resize-y border-0 bg-soft/70 focus:bg-white"
          placeholder="What would you like to share?"
          maxLength={POST_MAX_LENGTH}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          disabled={pending}
        />
      <div className="mt-2 flex items-center justify-between text-xs text-charcoal-soft">
        <span>
          {body.length}/{POST_MAX_LENGTH}
        </span>
      </div>

      {!accepted && (
        <label className="mt-3 flex items-start gap-2.5 rounded-card border border-line bg-soft px-4 py-3 text-sm text-charcoal-soft">
          <input
            type="checkbox"
            className="mt-0.5"
            checked={agree}
            onChange={(e) => setAgree(e.target.checked)}
            disabled={pending}
          />
          <span>
            I&apos;ve read and accept the{" "}
            <Link
              href="/community-guidelines"
              target="_blank"
              className="font-semibold text-blue-action hover:underline"
            >
              Community Guidelines
            </Link>{" "}
            and Terms of Use.
          </span>
        </label>
      )}

      {error && (
        <p
          aria-live="polite"
          className="mt-3 rounded-chip border border-bronze-soft bg-bronze-soft/40 px-4 py-2.5 text-sm text-bronze-deep"
        >
          {error}
        </p>
      )}

        <button
          className="btn-primary mt-3 w-full sm:w-auto"
          onClick={publish}
          disabled={pending || !body.trim()}
          aria-busy={pending}
        >
          {pending ? "Publishing…" : "Post"}
        </button>
      </div>
    </section>
  );
}
