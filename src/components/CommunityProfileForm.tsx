"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveCommunityProfile } from "@/app/(app)/app/community/actions";
import {
  COMMUNITY_HEADLINE_MAX_LENGTH,
  type CommunityProfileSharingKey,
} from "@/lib/community-profile-fields";
import {
  careerStageLabels,
  professionalCategoryLabels,
  streamLabels,
} from "@/lib/utils";
import type { CommunityProfile, Profile } from "@/types/database";

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

type SharingControl = {
  key: CommunityProfileSharingKey;
  label: string;
  value: string | null;
};

export function CommunityProfileForm({
  existing,
  passport,
}: {
  existing: CommunityProfile | null;
  passport: Profile | null;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const fullName = [passport?.full_name, passport?.surname]
    .filter(Boolean)
    .join(" ");
  const stage = passport?.career_stage
    ? passport.career_stage === "other"
      ? passport.career_stage_other || "Other"
      : careerStageLabels[passport.career_stage]
    : null;
  const psychologyInterests =
    passport?.interests
      .map((interest) => streamLabels[interest] ?? interest)
      .join(", ") || null;
  const professionalCategory = passport?.professional_category
    ? passport.professional_category === "other"
      ? passport.professional_category_other || "Other"
      : professionalCategoryLabels[passport.professional_category]
    : null;

  const sharingControls: SharingControl[] = [
    { key: "share_bio", label: "Professional bio", value: passport?.bio ?? null },
    { key: "share_career_stage", label: "Career stage", value: stage },
    {
      key: "share_professional_category",
      label: "Professional category",
      value: professionalCategory,
    },
    { key: "share_university", label: "University", value: passport?.university ?? null },
    { key: "share_province", label: "Province", value: passport?.province ?? null },
    {
      key: "share_psychology_interests",
      label: "Psychology streams & interests",
      value: psychologyInterests,
    },
    { key: "share_skills", label: "Skills", value: passport?.skills ?? null },
    {
      key: "share_volunteering",
      label: "Volunteering",
      value: passport?.volunteering ?? null,
    },
    { key: "share_workshops", label: "Workshops", value: passport?.workshops ?? null },
    { key: "share_linkedin", label: "LinkedIn", value: passport?.linkedin_url ?? null },
    { key: "share_website", label: "Website", value: passport?.website_url ?? null },
    { key: "share_scholar", label: "Google Scholar", value: passport?.scholar_url ?? null },
    {
      key: "share_researchgate",
      label: "ResearchGate",
      value: passport?.researchgate_url ?? null,
    },
    { key: "share_orcid", label: "ORCID", value: passport?.orcid ?? null },
    {
      key: "share_education",
      label: "Education",
      value:
        passport?.education?.length
          ? `${passport.education.length} ${passport.education.length === 1 ? "entry" : "entries"}`
          : null,
    },
    {
      key: "share_experience",
      label: "Experience",
      value:
        passport?.experience?.length
          ? `${passport.experience.length} ${passport.experience.length === 1 ? "entry" : "entries"}`
          : null,
    },
  ];

  function submit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await saveCommunityProfile(formData);
      if (result && "error" in result) {
        setError(result.error);
        return;
      }
      router.push("/app/community/profile");
      router.refresh();
    });
  }

  return (
    <form action={submit} className="space-y-6">
      <section>
        <h2 className="font-sora text-base font-bold tracking-tight">
          Community identity
        </h2>
        <p className="mt-1 text-sm text-charcoal-soft">
          These social details belong to Community and stay under your control.
        </p>
        <div className="mt-4 space-y-4">
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
              defaultValue={existing?.display_name ?? fullName}
              disabled={pending}
            />
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
              A short Community introduction, separate from your Passport career stage.
            </p>
          </div>
        </div>
      </section>

      <fieldset className="border-t border-line pt-6">
        <legend className="font-sora text-base font-bold tracking-tight">
          Share from your Phapano Passport
        </legend>
        <p className="mt-1 text-sm leading-relaxed text-charcoal-soft">
          Every field is opt-in. Changes to shared Passport details and your
          avatar stay synchronized automatically.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {sharingControls.map((control) => (
            <label
              key={control.key}
              className="flex cursor-pointer items-start gap-3 rounded-card border border-line bg-paper px-4 py-3.5 transition hover:border-blue/50"
            >
              <input
                type="checkbox"
                name="shared_fields"
                value={control.key}
                defaultChecked={Boolean(passport?.[control.key])}
                className="mt-1 h-4 w-4 accent-blue-action"
                disabled={pending}
              />
              <span className="min-w-0">
                <span className="block text-sm font-bold text-charcoal">
                  {control.label}
                </span>
                <span className="mt-0.5 block break-words text-xs leading-relaxed text-charcoal-soft">
                  {control.value || "Not added to your Passport yet"}
                </span>
              </span>
            </label>
          ))}
        </div>
        <p className="mt-3 text-xs leading-relaxed text-charcoal-soft">
          Turning a field off removes its value from your public Community
          profile immediately. Edit the source value from your main profile.
        </p>
      </fieldset>

      <section className="rounded-card border border-blue/25 bg-blue-tint/45 px-4 py-4">
        <h2 className="text-sm font-bold text-charcoal">Always private</h2>
        <p className="mt-1 text-xs leading-relaxed text-charcoal-soft">
          Applications, funding records, notes, documents, email address, and
          account or security information never have public-sharing controls.
        </p>
      </section>

      <fieldset className="border-t border-line pt-6">
        <legend className="label">
          Who can find you <RequiredMark />
        </legend>
        <div className="space-y-2">
          {VISIBILITY_OPTIONS.map((option) => (
            <RadioOption
              key={option.value}
              name="visibility"
              option={option}
              selected={(existing?.visibility ?? "visible") === option.value}
              pending={pending}
            />
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="label">
          Who can connect with you <RequiredMark />
        </legend>
        <div className="space-y-2">
          {CONNECTION_OPTIONS.map((option) => (
            <RadioOption
              key={option.value}
              name="connection_permission"
              option={option}
              selected={
                (existing?.connection_permission ?? "everyone") === option.value
              }
              pending={pending}
            />
          ))}
        </div>
      </fieldset>

      {error && (
        <p aria-live="polite" className="text-sm font-semibold text-bronze-deep">
          {error}
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

function RadioOption({
  name,
  option,
  selected,
  pending,
}: {
  name: string;
  option: { value: string; label: string; hint: string };
  selected: boolean;
  pending: boolean;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-2.5 rounded-card border border-line bg-paper px-4 py-3">
      <input
        type="radio"
        name={name}
        value={option.value}
        required
        defaultChecked={selected}
        className="mt-1"
        disabled={pending}
      />
      <span>
        <span className="block text-sm font-semibold text-charcoal">
          {option.label}
        </span>
        <span className="block text-xs text-charcoal-soft">{option.hint}</span>
      </span>
    </label>
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
