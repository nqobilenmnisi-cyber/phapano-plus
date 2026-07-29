"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveCommunityProfile } from "@/app/(app)/app/community/actions";
import {
  COMMUNITY_BIO_MAX_LENGTH,
  COMMUNITY_HEADLINE_MAX_LENGTH,
  COMMUNITY_INSTITUTION_MAX_LENGTH,
  COMMUNITY_OTHER_MAX_LENGTH,
  otherFieldRequired,
} from "@/lib/community-profile-fields";
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

const CONNECTION_OPTIONS = [
  {
    value: "everyone",
    label: "Everyone",
    hint: "Any visible Phapano+ member can send you a request.",
  },
  {
    value: "following",
    label: "People you follow",
    hint: "Only members you already follow can send you a request.",
  },
  {
    value: "nobody",
    label: "No one",
    hint: "Your current connections remain, but new requests are paused.",
  },
] as const;

export function CommunityProfileForm({
  existing,
  defaults,
}: {
  existing: CommunityProfile | null;
  defaults: {
    name: string;
    stage: string;
    stageOther: string;
    institution: string;
  };
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();
  const [stage, setStage] = useState(existing?.stage ?? defaults.stage ?? "");
  const [stageOther, setStageOther] = useState(
    existing?.stage_other ?? defaults.stageOther
  );
  const [stream, setStream] = useState(existing?.stream ?? "");
  const [streamOther, setStreamOther] = useState(
    existing?.stream_other ?? ""
  );

  function submit(formData: FormData) {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await saveCommunityProfile(formData);
      if (result && "error" in result) setError(result.error);
      else {
        setSaved(true);
        router.push("/app/community/profile");
        router.refresh();
      }
    });
  }

  return (
    <form action={submit} className="space-y-4">
      <p className="text-xs text-charcoal-soft">
        Fields marked with <span aria-hidden="true">*</span>
        <span className="sr-only">an asterisk</span> are required.
      </p>

      <div>
        <label className="label" htmlFor="display_name">
          Display name <RequiredMark />
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
          This is the name shown in the community. Your private Passport data
          stays private unless you choose to share it.
        </p>
      </div>

      <div>
        <label className="label" htmlFor="headline">
          Headline
        </label>
        <input
          id="headline"
          name="headline"
          maxLength={COMMUNITY_HEADLINE_MAX_LENGTH}
          className="input"
          placeholder="e.g. Honours student · aspiring clinical psychologist"
          defaultValue={existing?.headline ?? ""}
          disabled={pending}
        />
        <p className="mt-1 text-xs text-charcoal-soft">
          A short line displayed under your name. It is separate from your
          pathway stage.
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
            value={stage}
            onChange={(event) => setStage(event.target.value)}
            disabled={pending}
          >
            <option value="">Prefer not to say</option>
            {Object.entries(careerStageLabels).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
          {otherFieldRequired(stage) && (
            <div className="mt-2">
              <label className="label" htmlFor="stage_other">
                Your pathway stage <RequiredMark />
              </label>
              <input
                id="stage_other"
                name="stage_other"
                maxLength={COMMUNITY_OTHER_MAX_LENGTH}
                required
                className="input"
                placeholder="Describe your pathway stage"
                value={stageOther}
                onChange={(event) => setStageOther(event.target.value)}
                disabled={pending}
              />
            </div>
          )}
        </div>
        <div>
          <label className="label" htmlFor="stream">
            Stream or interest area
          </label>
          <select
            id="stream"
            name="stream"
            className="input"
            value={stream}
            onChange={(event) => setStream(event.target.value)}
            disabled={pending}
          >
            <option value="">Prefer not to say</option>
            {Object.entries(streamLabels).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
          {otherFieldRequired(stream) && (
            <div className="mt-2">
              <label className="label" htmlFor="stream_other">
                Your stream or interest area <RequiredMark />
              </label>
              <input
                id="stream_other"
                name="stream_other"
                maxLength={COMMUNITY_OTHER_MAX_LENGTH}
                required
                className="input"
                placeholder="Describe your stream or interest area"
                value={streamOther}
                onChange={(event) => setStreamOther(event.target.value)}
                disabled={pending}
              />
            </div>
          )}
        </div>
      </div>

      <div>
        <label className="label" htmlFor="institution">
          Institution
        </label>
        <input
          id="institution"
          name="institution"
          maxLength={COMMUNITY_INSTITUTION_MAX_LENGTH}
          className="input"
          defaultValue={existing?.institution ?? defaults.institution}
          disabled={pending}
        />
      </div>

      <div>
        <label className="label" htmlFor="bio">
          Short bio
        </label>
        <textarea
          id="bio"
          name="bio"
          maxLength={COMMUNITY_BIO_MAX_LENGTH}
          className="input min-h-20"
          defaultValue={existing?.bio ?? ""}
          disabled={pending}
        />
        <p className="mt-1 text-xs text-charcoal-soft">
          Share a concise introduction to your psychology journey.
        </p>
      </div>

      <div>
        <label className="label" htmlFor="interests">
          Interests
        </label>
        <input
          id="interests"
          name="interests"
          className="input"
          placeholder="e.g. neuropsychology, research methods, NSFAS advice"
          defaultValue={(existing?.interests ?? []).join(", ")}
          disabled={pending}
        />
        <p className="mt-1 text-xs text-charcoal-soft">
          Separate interests with commas.
        </p>
      </div>

      <fieldset>
        <legend className="label">
          Who can find you <RequiredMark />
        </legend>
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
                required
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

      <fieldset>
        <legend className="label">
          Who can connect with you <RequiredMark />
        </legend>
        <div className="space-y-2">
          {CONNECTION_OPTIONS.map((option) => (
            <label
              key={option.value}
              className="flex cursor-pointer items-start gap-2.5 rounded-card border border-line bg-paper px-4 py-3"
            >
              <input
                type="radio"
                name="connection_permission"
                value={option.value}
                required
                defaultChecked={
                  (existing?.connection_permission ?? "everyone") ===
                  option.value
                }
                className="mt-1"
                disabled={pending}
              />
              <span>
                <span className="block text-sm font-semibold text-charcoal">
                  {option.label}
                </span>
                <span className="block text-xs text-charcoal-soft">
                  {option.hint}
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

function RequiredMark() {
  return (
    <>
      <span aria-hidden="true">*</span>
      <span className="sr-only">(required)</span>
    </>
  );
}
