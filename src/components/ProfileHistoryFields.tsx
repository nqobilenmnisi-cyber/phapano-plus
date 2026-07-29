"use client";

import { useState } from "react";
import { InstitutionAutocomplete } from "@/components/InstitutionAutocomplete";
import type { EducationEntry, ExperienceEntry } from "@/types/database";

function newId() {
  return crypto.randomUUID();
}

export function ProfileHistoryFields({
  education: initialEducation,
  experience: initialExperience,
}: {
  education: EducationEntry[];
  experience: ExperienceEntry[];
}) {
  const [education, setEducation] = useState(initialEducation);
  const [experience, setExperience] = useState(initialExperience);

  function updateEducation(id: string, patch: Partial<EducationEntry>) {
    setEducation((rows) =>
      rows.map((row) => (row.id === id ? { ...row, ...patch } : row))
    );
  }

  function updateExperience(id: string, patch: Partial<ExperienceEntry>) {
    setExperience((rows) =>
      rows.map((row) => (row.id === id ? { ...row, ...patch } : row))
    );
  }

  return (
    <div className="space-y-5">
      <input type="hidden" name="education" value={JSON.stringify(education)} />
      <input type="hidden" name="experience" value={JSON.stringify(experience)} />

      <HistorySection
        title="Education"
        description="Add qualifications and current studies to your Passport."
        addLabel="Add education"
        onAdd={() =>
          setEducation((rows) => [
            ...rows,
            {
              id: newId(),
              institution: "",
              qualification: "",
              field_of_study: "",
              start_year: "",
              end_year: "",
              current: false,
              description: "",
            },
          ])
        }
      >
        {education.map((row) => (
          <div key={row.id} className="rounded-card border border-line bg-white p-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <span className="label">Institution</span>
                <InstitutionAutocomplete
                  name={null}
                  value={row.institution}
                  placeholder="Start typing a university or institution"
                  onChange={(institution) =>
                    updateEducation(row.id, { institution })
                  }
                />
              </div>
              <HistoryInput
                label="Qualification"
                value={row.qualification}
                placeholder="e.g. BA Honours"
                onChange={(qualification) => updateEducation(row.id, { qualification })}
              />
              <HistoryInput
                label="Field of study"
                value={row.field_of_study}
                placeholder="e.g. Psychology"
                onChange={(field_of_study) =>
                  updateEducation(row.id, { field_of_study })
                }
              />
              <div className="grid grid-cols-2 gap-3">
                <HistoryInput
                  label="Start year"
                  value={row.start_year}
                  placeholder="2021"
                  inputMode="numeric"
                  onChange={(start_year) => updateEducation(row.id, { start_year })}
                />
                <HistoryInput
                  label="End year"
                  value={row.end_year}
                  placeholder="2024"
                  inputMode="numeric"
                  disabled={row.current}
                  onChange={(end_year) => updateEducation(row.id, { end_year })}
                />
              </div>
            </div>
            <CurrentCheckbox
              checked={row.current}
              label="I am currently studying here"
              onChange={(current) =>
                updateEducation(row.id, {
                  current,
                  end_year: current ? "" : row.end_year,
                })
              }
            />
            <HistoryTextarea
              label="Description"
              value={row.description}
              placeholder="Activities, achievements or a short summary"
              onChange={(description) => updateEducation(row.id, { description })}
            />
            <RemoveButton
              label="Remove education"
              onClick={() =>
                setEducation((rows) => rows.filter((item) => item.id !== row.id))
              }
            />
          </div>
        ))}
      </HistorySection>

      <HistorySection
        title="Experience"
        description="Add work, internships, placements, volunteering or leadership."
        addLabel="Add experience"
        onAdd={() =>
          setExperience((rows) => [
            ...rows,
            {
              id: newId(),
              title: "",
              organisation: "",
              location: "",
              start_date: "",
              end_date: "",
              current: false,
              description: "",
            },
          ])
        }
      >
        {experience.map((row) => (
          <div key={row.id} className="rounded-card border border-line bg-white p-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <HistoryInput
                label="Role or title"
                value={row.title}
                placeholder="e.g. Research assistant"
                onChange={(title) => updateExperience(row.id, { title })}
              />
              <HistoryInput
                label="Organisation"
                value={row.organisation}
                placeholder="e.g. Phapano"
                onChange={(organisation) =>
                  updateExperience(row.id, { organisation })
                }
              />
              <HistoryInput
                label="Location"
                value={row.location}
                placeholder="e.g. Johannesburg · Hybrid"
                onChange={(location) => updateExperience(row.id, { location })}
              />
              <div className="grid grid-cols-2 gap-3">
                <MonthInput
                  label="Start date"
                  value={row.start_date}
                  onChange={(start_date) => updateExperience(row.id, { start_date })}
                />
                <MonthInput
                  label="End date"
                  value={row.end_date}
                  disabled={row.current}
                  onChange={(end_date) => updateExperience(row.id, { end_date })}
                />
              </div>
            </div>
            <CurrentCheckbox
              checked={row.current}
              label="I currently work in this role"
              onChange={(current) =>
                updateExperience(row.id, {
                  current,
                  end_date: current ? "" : row.end_date,
                })
              }
            />
            <HistoryTextarea
              label="Description"
              value={row.description}
              placeholder="Responsibilities, contributions or achievements"
              onChange={(description) => updateExperience(row.id, { description })}
            />
            <RemoveButton
              label="Remove experience"
              onClick={() =>
                setExperience((rows) => rows.filter((item) => item.id !== row.id))
              }
            />
          </div>
        ))}
      </HistorySection>
    </div>
  );
}

function HistorySection({
  title,
  description,
  addLabel,
  onAdd,
  children,
}: {
  title: string;
  description: string;
  addLabel: string;
  onAdd: () => void;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-sora text-sm font-bold tracking-tight">{title}</h3>
          <p className="mt-1 text-xs leading-relaxed text-charcoal-soft">
            {description}
          </p>
        </div>
        <button type="button" onClick={onAdd} className="btn-secondary !px-3 !py-2 text-xs">
          + {addLabel}
        </button>
      </div>
      <div className="mt-3 space-y-3">{children}</div>
    </section>
  );
}

function HistoryInput({
  label,
  value,
  onChange,
  placeholder,
  inputMode,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  inputMode?: "numeric";
  disabled?: boolean;
}) {
  return (
    <label>
      <span className="label">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        inputMode={inputMode}
        disabled={disabled}
        className="input"
      />
    </label>
  );
}

function MonthInput({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <label>
      <span className="label">{label}</span>
      <input
        type="month"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        className="input"
      />
    </label>
  );
}

function CurrentCheckbox({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}) {
  return (
    <label className="mt-3 flex items-center gap-2 text-sm font-semibold text-charcoal">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 accent-blue-action"
      />
      {label}
    </label>
  );
}

function HistoryTextarea({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="mt-3 block">
      <span className="label">{label}</span>
      <textarea
        rows={3}
        maxLength={500}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="input resize-none"
      />
    </label>
  );
}

function RemoveButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-3 text-xs font-bold text-bronze-deep hover:underline"
    >
      {label}
    </button>
  );
}
