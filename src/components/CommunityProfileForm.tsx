"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveCommunityProfile } from "@/app/(app)/app/community/actions";
import { careerStageLabels, streamLabels } from "@/lib/utils";
import type { CommunityProfile } from "@/types/database";

const VISIBILITY_OPTIONS = [
  {
    value: "visible",
    label: "Visible to Phapano+ members",
    hint: "Appear in member discovery and the Discover feed.",
  },
  {
    value: "limited",
    label: "Limited profile",
    hint: "People can view your profile from your posts, but you won't appear in discovery.",
  },
  {
    value: "hidden",
    label: "Hidden from community discovery",
    hint: "Your profile can't be found or viewed by other members.",
  },
] as const;

export function CommunityProfileForm({
  existing,
  defaults,
}: {
  existing: CommunityProfile | null;
  defaults: { name: string; stage: string; institution: string };
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  function submit(formData: FormData) {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await saveCommunityProfile(formData);
      if (result && "error" in result) setError(result.error);
      else {
        setSaved(true);
        router.refresh();
      }
    });
  }

  return (
    <form action={submit} className="space-y-4">
      <div>
        <label className="label" htmlFor="display_name">
          Display name
        </label>
        <input
          id="display_name"
          name="display_name"
          required
          minLength={2}
          maxLength={60}
          className="input"
          defaultValue={existing?.display_name ?? defaults.name}
          disabled={pending}
        />
        <p className="mt-1 text-xs text-charcoal-soft">
          This is the only name shown in the community — your Passport stays
          private.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="stage">
            Pathway stage
          </label>
          <select
            id="stage"
            name="stage"
            className="input"
            defaultValue={existing?.stage ?? defaults.stage}
            disabled={pending}
          >
            <option value="">Prefer not to say</option>
            {Object.entries(careerStageLabels).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="stream">
            Stream or interest area
          </label>
          <select
            id="stream"
            name="stream"
            className="input"
            defaultValue={existing?.stream ?? ""}
            disabled={pending}
          >
            <option value="">Prefer not to say</option>
            {Object.entries(streamLabels).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="label" htmlFor="institution">
          Institution (optional)
        </label>
        <input
          id="institution"
          name="institution"
          maxLength={120}
          className="input"
          defaultValue={existing?.institution ?? defaults.institution}
          disabled={pending}
        />
      </div>

      <div>
        <label className="label" htmlFor="bio">
          Short bio (optional)
        </label>
        <textarea
          id="bio"
          name="bio"
          maxLength={280}
          className="input min-h-20"
          defaultValue={existing?.bio ?? ""}
          disabled={pending}
        />
      </div>

      <div>
        <label className="label" htmlFor="interests">
          Interests (optional, comma-separated)
        </label>
        <input
          id="interests"
          name="interests"
          className="input"
          placeholder="e.g. neuropsychology, research methods, NSFAS advice"
          defaultValue={(existing?.interests ?? []).join(", ")}
          disabled={pending}
        />
      </div>

      <fieldset>
        <legend className="label">Who can find you</legend>
        <div className="space-y-2">
          {VISIBILITY_OPTIONS.map((o) => (
            <label
              key={o.value}
              className="flex cursor-pointer items-start gap-2.5 rounded-card border border-line bg-paper px-4 py-3"
            >
              <input
                type="radio"
                name="visibility"
                value={o.value}
                defaultChecked={
                  (existing?.visibility ?? "visible") === o.value
                }
                className="mt-1"
                disabled={pending}
              />
              <span>
                <span className="block text-sm font-semibold text-charcoal">
                  {o.label}
                </span>
                <span className="block text-xs text-charcoal-soft">
                  {o.hint}
                </span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {error && (
        <p
          aria-live="polite"
          className="rounded-chip border border-bronze-soft bg-bronze-soft/40 px-4 py-2.5 text-sm text-bronze-deep"
        >
          {error}
        </p>
      )}
      {saved && (
        <p
          aria-live="polite"
          className="rounded-chip border border-line bg-soft px-4 py-2.5 text-sm text-charcoal"
        >
          Community profile saved.
        </p>
      )}

      <button
        type="submit"
        className="btn-primary w-full sm:w-auto"
        disabled={pending}
        aria-busy={pending}
      >
        {pending ? "Saving…" : existing ? "Save changes" : "Join the community"}
      </button>
    </form>
  );
}
