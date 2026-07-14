"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { completeOnboarding } from "@/app/(app)/profile-actions";
import {
  careerStageLabels,
  streamLabels,
  ONBOARDING_STAGES,
  STREAM_OPTIONS,
} from "@/lib/utils";
import type { CareerStage, PsychologyStream } from "@/types/database";
import { Compass, SteppingStones, Star } from "@/components/illustrations";
import { InstitutionAutocomplete } from "@/components/InstitutionAutocomplete";

function FinishButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary flex-1" disabled={pending}>
      {pending ? "One moment…" : "Enter Phapano+"}
    </button>
  );
}

export function OnboardingWizard({ defaultName }: { defaultName: string }) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState(defaultName);
  const [stage, setStage] = useState<CareerStage | "">("");
  const [stageOther, setStageOther] = useState("");
  const [university, setUniversity] = useState("");
  const [stream, setStream] = useState<PsychologyStream | "">("");

  const total = 3;

  // Neutral wording — Phapano+ supports Honours applicants and earlier stages,
  // not only Master's applicants.
  const streamQuestion = "Which psychology stream are you interested in?";

  const canContinueStage = stage !== "" && (stage !== "other" || stageOther.trim() !== "");

  return (
    <div className="card relative overflow-hidden p-8">
      <Compass className="pointer-events-none absolute -right-6 -top-4 w-36 opacity-80" />

      {/* progress dots */}
      <div className="mb-6 flex items-center gap-2">
        {Array.from({ length: total }).map((_, i) => (
          <span
            key={i}
            className={`h-1.5 rounded-full transition-all ${
              i <= step ? "w-7 bg-blue-action" : "w-3 bg-line"
            }`}
          />
        ))}
      </div>

      {/* STEP 1 — first name */}
      {step === 0 && (
        <div className="animate-fade">
          <SteppingStones className="mb-4 h-8 w-8" />
          <h1 className="font-sora text-2xl font-bold tracking-tight">
            Welcome to Phapano+
          </h1>
          <p className="mt-2 text-charcoal-soft">
            Let&apos;s set up your psychology pathway. This takes under a minute,
            and you can change anything later.
          </p>
          <label className="label mt-6" htmlFor="first_name_input">
            What should we call you?
          </label>
          <input
            id="first_name_input"
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your first name"
            autoFocus
          />
          <div className="mt-6">
            <button
              onClick={() => setStep(1)}
              disabled={!name.trim()}
              className="btn-primary w-full disabled:opacity-50"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* STEP 2 — stage */}
      {step === 1 && (
        <div className="animate-fade">
          <h2 className="font-sora text-xl font-bold tracking-tight">
            Where are you in your psychology pathway?
          </h2>
          <p className="mt-1 text-sm text-charcoal-soft">
            This helps us show what matters most to you.
          </p>
          <div className="mt-5 grid gap-2">
            {ONBOARDING_STAGES.map((s) => {
              const on = stage === s;
              return (
                <button
                  key={s}
                  onClick={() => setStage(s)}
                  aria-pressed={on}
                  className={`flex items-center justify-between rounded-chip border px-4 py-3 text-left font-semibold transition ${
                    on
                      ? "border-blue-action bg-blue-tint text-blue-deep ring-2 ring-blue/30"
                      : "border-line bg-white text-charcoal hover:border-blue"
                  }`}
                >
                  {careerStageLabels[s]}
                  {on && (
                    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
                      <path d="M5 13l4 4L19 7" stroke="#2E6FB0" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>

          {/* "Other" free-text */}
          {stage === "other" && (
            <div className="mt-3 animate-fade">
              <label className="label" htmlFor="stage_other_input">
                Tell us where you are in your pathway
              </label>
              <input
                id="stage_other_input"
                className="input"
                value={stageOther}
                onChange={(e) => setStageOther(e.target.value)}
                placeholder="In your own words"
                autoFocus
              />
            </div>
          )}

          <div className="mt-6 flex gap-3">
            <button onClick={() => setStep(0)} className="btn-secondary">
              Back
            </button>
            <button
              onClick={() => setStep(2)}
              disabled={!canContinueStage}
              className="btn-primary flex-1 disabled:opacity-50"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* STEP 3 — university + intended stream (both optional) */}
      {step === 2 && (
        <form
          action={async (formData) => {
            await completeOnboarding(formData);
          }}
          className="animate-fade"
        >
          <Star className="mb-3 h-6 w-6" />
          <h2 className="font-sora text-xl font-bold tracking-tight">
            A little more (optional)
          </h2>
          <p className="mt-1 text-sm text-charcoal-soft">
            Skip anything you&apos;re unsure of. You can add it later.
          </p>

          <label className="label mt-5" htmlFor="institution_input">
            Your university or institution
          </label>
          <InstitutionAutocomplete
            id="institution_input"
            name="university"
            value={university}
            onChange={setUniversity}
            placeholder="Start typing, e.g. Wits, UJ, UNISA, SACAP…"
          />

          <label className="label mt-4">{streamQuestion}</label>
          <div className="flex flex-wrap gap-2">
            {STREAM_OPTIONS.map((s) => {
              const on = stream === s;
              return (
                <button
                  type="button"
                  key={s}
                  onClick={() => setStream(on ? "" : s)}
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

          {/* hidden fields carry wizard state into the server action.
             (Institution is submitted by the autocomplete's own hidden input.) */}
          <input type="hidden" name="first_name" value={name} />
          <input type="hidden" name="career_stage" value={stage} />
          <input type="hidden" name="career_stage_other" value={stageOther} />
          <input type="hidden" name="stream" value={stream} />

          <div className="mt-7 flex gap-3">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="btn-secondary"
            >
              Back
            </button>
            <FinishButton />
          </div>
        </form>
      )}
    </div>
  );
}
