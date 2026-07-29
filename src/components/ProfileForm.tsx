"use client";

import { useState, useTransition } from "react";
import { updateProfile } from "@/app/(app)/profile-actions";
import {
  careerStageLabels,
  professionalCategoryLabels,
  streamLabels,
  SA_PROVINCES,
  ONBOARDING_STAGES,
  PROFESSIONAL_CATEGORIES,
  STREAM_OPTIONS,
} from "@/lib/utils";
import { InstitutionAutocomplete } from "@/components/InstitutionAutocomplete";
import { ProfileHistoryFields } from "@/components/ProfileHistoryFields";
import type {
  Profile,
  CareerStage,
  ProfessionalCategory,
  PsychologyStream,
} from "@/types/database";

export function ProfileForm({ profile }: { profile: Profile }) {
  const [stage, setStage] = useState<CareerStage | "">(
    profile.career_stage ?? ""
  );
  const [stageOther, setStageOther] = useState(profile.career_stage_other ?? "");
  const [professionalCategory, setProfessionalCategory] = useState<
    ProfessionalCategory | ""
  >(profile.professional_category ?? "");
  const [institution, setInstitution] = useState(profile.university ?? "");
  const [interests, setInterests] = useState<PsychologyStream[]>(
    profile.interests ?? []
  );
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  // Research links/sections appear for more senior stages so junior users
  // (undergraduate, Honours applicants) aren't overwhelmed.
  const SENIOR_STAGES = [
    "masters_student",
    "intern",
    "community_service",
    "professional",
  ];
  const senior = stage !== "" && SENIOR_STAGES.includes(stage as string);

  function toggle(s: PsychologyStream) {
    setSaved(false);
    setInterests((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  }

  function onSubmit(fd: FormData) {
    setError(null);
    setSaved(false);
    start(async () => {
      const res = await updateProfile(fd);
      if (res?.error) setError(res.error);
      else setSaved(true);
    });
  }

  return (
    <form action={onSubmit} className="space-y-5">
      <p className="text-xs text-charcoal-soft">
        Fields marked with <span className="font-semibold text-charcoal">*</span> are required.
      </p>

      {/* identity */}
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="full_name">First name *</label>
          <input
            id="full_name"
            name="full_name"
            required
            defaultValue={profile.full_name ?? ""}
            className="input"
            placeholder="Your first name"
          />
        </div>
        <div>
          <label className="label" htmlFor="surname">Surname</label>
          <input
            id="surname"
            name="surname"
            defaultValue={profile.surname ?? ""}
            className="input"
            placeholder="Your surname"
          />
        </div>
      </div>

      {/* professional bio — moved up, near identity */}
      <div>
        <label className="label" htmlFor="bio">Professional bio</label>
        <textarea
          id="bio"
          name="bio"
          defaultValue={profile.bio ?? ""}
          rows={4}
          className="input resize-none"
          placeholder="Write a short bio that summarises your psychology pathway, interests, experience and goals."
        />
      </div>

      {/* career stage */}
      <div>
        <label className="label" htmlFor="career_stage">Career stage</label>
        <select
          id="career_stage"
          name="career_stage"
          value={stage}
          onChange={(e) => setStage(e.target.value as CareerStage | "")}
          className="input"
        >
          <option value="">Select…</option>
          {ONBOARDING_STAGES.map((s) => (
            <option key={s} value={s}>{careerStageLabels[s]}</option>
          ))}
        </select>
      </div>

      {stage === "other" && (
        <div>
          <label className="label" htmlFor="career_stage_other">
            Tell us where you are in your pathway
          </label>
          <input
            id="career_stage_other"
            name="career_stage_other"
            value={stageOther}
            onChange={(e) => setStageOther(e.target.value)}
            className="input"
            placeholder="In your own words"
          />
        </div>
      )}
      {stage !== "other" && (
        <input type="hidden" name="career_stage_other" value="" />
      )}

      <div>
        <label className="label" htmlFor="professional_category">
          Professional category
        </label>
        <select
          id="professional_category"
          name="professional_category"
          value={professionalCategory}
          onChange={(event) =>
            setProfessionalCategory(
              event.target.value as ProfessionalCategory | ""
            )
          }
          className="input"
        >
          <option value="">Not applicable yet</option>
          {PROFESSIONAL_CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {professionalCategoryLabels[category]}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-charcoal-soft">
          For registered or professionally practising members. Verification is
          managed separately.
        </p>
      </div>

      {professionalCategory === "other" ? (
        <div>
          <label className="label" htmlFor="professional_category_other">
            Other professional category
          </label>
          <input
            id="professional_category_other"
            name="professional_category_other"
            defaultValue={profile.professional_category_other ?? ""}
            className="input"
            placeholder="Enter your professional category"
          />
        </div>
      ) : (
        <input type="hidden" name="professional_category_other" value="" />
      )}

      {/* institution + province */}
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="institution">
            University / institution
          </label>
          <InstitutionAutocomplete
            id="institution"
            name="university"
            value={institution}
            onChange={setInstitution}
            placeholder="Start typing, e.g. Wits, UJ, SACAP…"
          />
        </div>
        <div>
          <label className="label" htmlFor="province">Province</label>
          <select id="province" name="province" defaultValue={profile.province ?? ""} className="input">
            <option value="">Select…</option>
            {SA_PROVINCES.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
      </div>

      {/* streams */}
      <div>
        <label className="label">Psychology streams you&apos;re interested in</label>
        <div className="flex flex-wrap gap-2">
          {STREAM_OPTIONS.map((s) => {
            const on = interests.includes(s);
            return (
              <button
                type="button"
                key={s}
                onClick={() => toggle(s)}
                aria-pressed={on}
                className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                  on
                    ? "border-blue-action bg-blue-action text-white"
                    : "border-line bg-white text-charcoal hover:border-blue"
                }`}
              >
                {streamLabels[s]}
              </button>
            );
          })}
        </div>
        {interests.map((s) => (
          <input key={s} type="hidden" name="interests" value={s} />
        ))}
      </div>

      {/* research interests */}
      <div>
        <label className="label" htmlFor="research_interests">
          Research interests
        </label>
        <input
          id="research_interests"
          name="research_interests"
          defaultValue={profile.research_interests ?? ""}
          className="input"
          placeholder="e.g. trauma, child development"
        />
      </div>

      {/* Phapano Passport — grows with your stage */}
      <div className="rounded-card border border-line bg-soft/50 p-5">
        <p className="font-sora text-sm font-bold tracking-tight">
          Experience &amp; skills
        </p>
        <p className="mt-1 text-sm text-charcoal-soft">
          Build up your Phapano profile over time. Add only what&apos;s relevant
          to you right now.
        </p>

        <div className="mt-4 space-y-4">
          <div>
            <label className="label" htmlFor="skills">Skills &amp; interests</label>
            <input
              id="skills"
              name="skills"
              defaultValue={profile.skills ?? ""}
              className="input"
              placeholder="e.g. SPSS, qualitative research, peer support"
            />
          </div>
          <div>
            <label className="label" htmlFor="volunteering">Volunteering experience</label>
            <input
              id="volunteering"
              name="volunteering"
              defaultValue={profile.volunteering ?? ""}
              className="input"
              placeholder="e.g. Childline volunteer, campus peer mentor"
            />
          </div>
          <div>
            <label className="label" htmlFor="workshops">Workshops attended</label>
            <input
              id="workshops"
              name="workshops"
              defaultValue={profile.workshops ?? ""}
              className="input"
              placeholder="e.g. Phapano application workshop, research methods seminar"
            />
          </div>
          <ProfileHistoryFields
            education={profile.education ?? []}
            experience={profile.experience ?? []}
          />
        </div>
      </div>

      {/* Links & professional profiles — links always; research links for
          more senior stages so juniors aren't overwhelmed. */}
      <div className="rounded-card border border-line bg-soft/50 p-5">
        <p className="font-sora text-sm font-bold tracking-tight">
          Links &amp; profiles
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="linkedin_url">LinkedIn</label>
            <input id="linkedin_url" name="linkedin_url" inputMode="url" autoCapitalize="none" autoCorrect="off" defaultValue={profile.linkedin_url ?? ""} className="input" placeholder="linkedin.com/in/…" />
          </div>
          <div>
            <label className="label" htmlFor="website_url">Personal website</label>
            <input id="website_url" name="website_url" inputMode="url" autoCapitalize="none" autoCorrect="off" defaultValue={profile.website_url ?? ""} className="input" placeholder="yoursite.com" />
          </div>
          {senior && (
            <>
              <div>
                <label className="label" htmlFor="scholar_url">Google Scholar</label>
                <input id="scholar_url" name="scholar_url" inputMode="url" autoCapitalize="none" autoCorrect="off" defaultValue={profile.scholar_url ?? ""} className="input" placeholder="scholar.google.com/…" />
              </div>
              <div>
                <label className="label" htmlFor="researchgate_url">ResearchGate</label>
                <input id="researchgate_url" name="researchgate_url" inputMode="url" autoCapitalize="none" autoCorrect="off" defaultValue={profile.researchgate_url ?? ""} className="input" placeholder="researchgate.net/profile/…" />
              </div>
              <div>
                <label className="label" htmlFor="orcid">ORCID</label>
                <input id="orcid" name="orcid" defaultValue={profile.orcid ?? ""} className="input" placeholder="0000-0000-0000-0000" />
              </div>
            </>
          )}
        </div>
        {!senior && (
          <>
            <input type="hidden" name="scholar_url" value={profile.scholar_url ?? ""} />
            <input type="hidden" name="researchgate_url" value={profile.researchgate_url ?? ""} />
            <input type="hidden" name="orcid" value={profile.orcid ?? ""} />
            <p className="mt-3 text-xs text-charcoal-soft">
              Research profiles (Google Scholar, ResearchGate, ORCID) appear here
              as you progress into Master&apos;s study and beyond.
            </p>
          </>
        )}
      </div>

      {/* Preserve existing values for fields no longer shown in the form, so
          saving doesn't wipe them. (application_year, goals) */}
      <input type="hidden" name="application_year" value={profile.application_year ?? ""} />
      <input type="hidden" name="goals" value={profile.goals ?? ""} />

      {error && <p className="text-sm text-bronze-deep">{error}</p>}
      {saved && (
        <p className="flex items-center gap-2 text-sm font-semibold text-ok">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M5 13l4 4L19 7" stroke="#3F8F6F" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Saved
        </p>
      )}

      <button type="submit" disabled={pending} className="btn-primary">
        {pending ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}
