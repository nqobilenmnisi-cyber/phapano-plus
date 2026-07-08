"use client";

import { useState, useRef, useEffect } from "react";
import { searchInstitutions, type Institution } from "@/lib/institutions";

/**
 * Searchable institution input. Shows suggestions after 2 characters, allows
 * picking a suggestion or typing free text. The current value is mirrored into
 * a hidden input named `name` so it submits with the surrounding form, and an
 * optional `onChange` keeps parent state in sync.
 */
export function InstitutionAutocomplete({
  name = "university",
  value,
  onChange,
  placeholder = "Start typing your institution…",
  id,
}: {
  name?: string;
  value: string;
  onChange?: (v: string) => void;
  placeholder?: string;
  id?: string;
}) {
  const [text, setText] = useState(value ?? "");
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<Institution[]>([]);
  const [active, setActive] = useState(-1);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setText(value ?? "");
  }, [value]);

  // Close on outside click.
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function update(v: string) {
    setText(v);
    onChange?.(v);
    const r = searchInstitutions(v);
    setResults(r);
    setOpen(r.length > 0);
    setActive(-1);
  }

  function pick(inst: Institution) {
    setText(inst.name);
    onChange?.(inst.name);
    setOpen(false);
    setActive(-1);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!open || results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter" && active >= 0) {
      e.preventDefault();
      pick(results[active]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={wrapRef} className="relative">
      <input
        id={id}
        type="text"
        autoComplete="off"
        className="input"
        placeholder={placeholder}
        value={text}
        onChange={(e) => update(e.target.value)}
        onFocus={() => {
          if (results.length > 0) setOpen(true);
        }}
        onKeyDown={onKeyDown}
      />
      {/* mirror value for form submission */}
      <input type="hidden" name={name} value={text} />

      {open && results.length > 0 && (
        <ul className="absolute z-20 mt-1.5 max-h-64 w-full overflow-auto rounded-card border border-line bg-white p-1 shadow-lift">
          {results.map((inst, i) => (
            <li key={inst.name}>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  pick(inst);
                }}
                onMouseEnter={() => setActive(i)}
                className={`block w-full rounded-chip px-3 py-2 text-left text-sm transition ${
                  i === active
                    ? "bg-blue-tint text-blue-deep"
                    : "text-charcoal hover:bg-soft"
                }`}
              >
                {inst.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
