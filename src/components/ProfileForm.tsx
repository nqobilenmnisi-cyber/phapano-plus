"use client";

import { useEffect, useState, useTransition } from "react";
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
import { StandardOptionPicker } from "@/components/StandardOptionPicker";
import {
  PSYCHOLOGY_INTERESTS,
  PSYCHOLOGY_SKILLS,
} from "@/lib/profile-options";
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
  const [savedSection, setSavedSection] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSection, setLastSection] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function toggle(s: PsychologyStream) {
    setSavedSection(null);
    setDirty(true);
    setInterests((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  }

  function onSubmit(fd: FormData) {
    const section = String(fd.get("section") ?? "all");
    setLastSection(section);
    setError(null);
    setSavedSection(null);
    start(async () => {
      const res = await updateProfile(fd);
      if (res?.error) setError(res.error);
      else {
        setSavedSection(section);
        setDirty(false);
      }
    });
  }

  useEffect(() => {
    function warn(event: BeforeUnloadEvent) {
      if (!dirty) return;
      event.preventDefault();
    }
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  return (
    <form
      action={onSubmit}
      className="space-y-5"
      onChange={() => {
        setDirty(true);
        setSavedSection(null);
      }}
    >
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

      <SectionSave
        section="identity"
        pending={pending}
        active={lastSection === "identity"}
        saved={savedSection === "identity"}
        error={lastSection === "identity" ? error : null}
      />

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
          <option value="">Select a category (optional)</option>
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
      <SectionSave
        section="professional"
        pending={pending}
        active={lastSection === "professional"}
        saved={savedSection === "professional"}
        error={lastSection === "professional" ? error : null}
      />

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
          <StandardOptionPicker
            id="skills"
            name="skills"
            label="Skills"
            options={PSYCHOLOGY_SKILLS}
            initialValue={profile.skills}
            maximum={10}
            placeholder="Search psychology skills"
          />
          <StandardOptionPicker
            id="research_interests"
            name="research_interests"
            label="Professional and research interests"
            options={PSYCHOLOGY_INTERESTS}
            initialValue={profile.research_interests}
            maximum={6}
            placeholder="Search psychology interests"
          />
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
          <SectionSave
            section="experience"
            pending={pending}
            active={lastSection === "experience"}
            saved={savedSection === "experience"}
            error={lastSection === "experience" ? error : null}
          />
        </div>
      </div>

      {/* Links and professional profiles are optional and available to every
          member, regardless of career stage. */}
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
        </div>
        <SectionSave
          section="links"
          pending={pending}
          active={lastSection === "links"}
          saved={savedSection === "links"}
          error={lastSection === "links" ? error : null}
        />
      </div>

      {/* Preserve existing values for fields no longer shown in the form, so
          saving doesn't wipe them. (application_year, goals) */}
      <input type="hidden" name="application_year" value={profile.application_year ?? ""} />
      <input type="hidden" name="goals" value={profile.goals ?? ""} />

    </form>
  );
}

function SectionSave({
  section,
  pending,
  active,
  saved,
  error,
}: {
  section: "identity" | "professional" | "experience" | "links";
  pending: boolean;
  active: boolean;
  saved: boolean;
  error: string | null;
}) {
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-3">
      <button
        type="submit"
        name="section"
        value={section}
        disabled={pending}
        className="btn-primary whitespace-nowrap"
      >
        {pending && active ? "Saving…" : "Save section"}
      </button>
      {saved && (
        <span className="text-sm font-semibold text-ok" role="status">
          Saved
        </span>
      )}
      {error && (
        <span className="w-full text-sm font-semibold text-bronze-deep" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
