"use client";

import { useMemo, useState } from "react";
import { parseStandardOptions } from "@/lib/profile-options";

export function StandardOptionPicker({
  id,
  name,
  label,
  options,
  initialValue,
  maximum,
  placeholder,
}: {
  id: string;
  name: string;
  label: string;
  options: readonly string[];
  initialValue: string | null;
  maximum: number;
  placeholder: string;
}) {
  const [selected, setSelected] = useState(() =>
    parseStandardOptions(initialValue).filter((item) =>
      options.some((option) => option === item)
    )
  );
  const [query, setQuery] = useState("");
  const available = useMemo(
    () =>
      options.filter(
        (option) =>
          !selected.includes(option) &&
          option.toLocaleLowerCase("en-ZA").includes(
            query.trim().toLocaleLowerCase("en-ZA")
          )
      ),
    [options, query, selected]
  );

  function add(option: string) {
    if (selected.length >= maximum) return;
    setSelected((current) => [...current, option]);
    setQuery("");
  }

  return (
    <div>
      <label className="label" htmlFor={id}>
        {label}
      </label>
      <input type="hidden" name={name} value={selected.join(", ")} />
      {selected.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {selected.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() =>
                setSelected((current) =>
                  current.filter((item) => item !== option)
                )
              }
              className="inline-flex min-h-9 items-center gap-1 rounded-full border border-blue/25 bg-blue-tint px-3 py-1.5 text-xs font-bold text-blue-deep"
              aria-label={`Remove ${option}`}
            >
              {option}
              <span aria-hidden="true">×</span>
            </button>
          ))}
        </div>
      )}
      <div className="relative">
        <input
          id={id}
          className="input"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={
            selected.length >= maximum
              ? `${maximum} selected`
              : placeholder
          }
          disabled={selected.length >= maximum}
          autoComplete="off"
        />
        {query.trim() && available.length > 0 && (
          <ul className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-card border border-line bg-paper p-1 shadow-lift">
            {available.slice(0, 8).map((option) => (
              <li key={option}>
                <button
                  type="button"
                  onMouseDown={(event) => {
                    event.preventDefault();
                    add(option);
                  }}
                  className="min-h-11 w-full rounded-chip px-3 py-2 text-left text-sm font-semibold hover:bg-soft"
                >
                  {option}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <p className="mt-1 text-xs text-charcoal-soft">
        Choose up to {maximum}. {selected.length}/{maximum} selected.
      </p>
    </div>
  );
}
