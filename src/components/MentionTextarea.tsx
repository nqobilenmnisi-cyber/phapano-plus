"use client";

import { useEffect, useRef, useState } from "react";
import { searchMembersAction } from "@/app/(app)/app/community/actions";
import { MemberAvatar } from "@/components/CommunityShared";

export type MentionSelection = {
  userId: string;
  label: string;
};

type Candidate = {
  userId: string;
  label: string;
  avatarUrl: string | null;
  headline: string | null;
};

export function MentionTextarea({
  id,
  value,
  onChange,
  onMentionsChange,
  mentions,
  placeholder,
  maxLength,
  disabled,
  className = "input min-h-28",
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  mentions: MentionSelection[];
  onMentionsChange: (mentions: MentionSelection[]) => void;
  placeholder: string;
  maxLength: number;
  disabled?: boolean;
  className?: string;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Candidate[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (!query) {
      setResults([]);
      return;
    }
    let live = true;
    const timer = window.setTimeout(async () => {
      const members = await searchMembersAction({ q: query });
      if (!live) return;
      setResults(
        members
          .filter((member) => member.identity_type !== "organisation")
          .slice(0, 6)
          .map((member) => ({
          userId: member.user_id,
          label: member.display_name,
          avatarUrl: member.avatar_url,
          headline: member.headline,
          }))
      );
      setActive(0);
    }, 250);
    return () => {
      live = false;
      window.clearTimeout(timer);
    };
  }, [query]);

  function updateMentionQuery(nextValue: string, caret: number) {
    const match = nextValue.slice(0, caret).match(/@([^@\n]{1,40})$/);
    const nextQuery = match?.[1].trim() ?? "";
    setQuery(nextQuery);
    setOpen(Boolean(nextQuery));
  }

  function handleChange(event: React.ChangeEvent<HTMLTextAreaElement>) {
    const nextValue = event.target.value;
    onChange(nextValue);
    onMentionsChange(
      mentions.filter((mention) => nextValue.includes(`@${mention.label}`))
    );
    updateMentionQuery(nextValue, event.target.selectionStart);
  }

  function pick(candidate: Candidate) {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const caret = textarea.selectionStart;
    const before = value.slice(0, caret);
    const match = before.match(/@([^@\n]{1,40})$/);
    if (!match) return;
    const start = caret - match[0].length;
    const inserted = `@${candidate.label} `;
    const nextValue = `${value.slice(0, start)}${inserted}${value.slice(caret)}`;
    if (nextValue.length > maxLength) return;
    onChange(nextValue);
    onMentionsChange([
      ...mentions.filter((mention) => mention.userId !== candidate.userId),
      { userId: candidate.userId, label: candidate.label },
    ]);
    setOpen(false);
    setQuery("");
    window.requestAnimationFrame(() => {
      const nextCaret = start + inserted.length;
      textarea.focus();
      textarea.setSelectionRange(nextCaret, nextCaret);
    });
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (!open || !results.length) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((index) => (index + 1) % results.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((index) => (index - 1 + results.length) % results.length);
    } else if (event.key === "Enter" && results[active]) {
      event.preventDefault();
      pick(results[active]);
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        id={id}
        className={className}
        placeholder={placeholder}
        maxLength={maxLength}
        value={value}
        onChange={handleChange}
        onClick={(event) =>
          updateMentionQuery(value, event.currentTarget.selectionStart)
        }
        onKeyUp={(event) =>
          updateMentionQuery(value, event.currentTarget.selectionStart)
        }
        onKeyDown={onKeyDown}
        disabled={disabled}
        role="combobox"
        aria-haspopup="listbox"
        aria-autocomplete="list"
        aria-expanded={open && results.length > 0}
        aria-controls={`${id}-mention-results`}
      />
      {open && results.length > 0 && (
        <ul
          id={`${id}-mention-results`}
          className="absolute left-0 right-0 z-30 mt-1 max-h-72 overflow-y-auto rounded-card border border-line bg-paper p-1 shadow-lift"
          role="listbox"
          aria-label="Mention a member"
        >
          {results.map((candidate, index) => (
            <li key={candidate.userId} role="option" aria-selected={index === active}>
              <button
                type="button"
                onMouseDown={(event) => {
                  event.preventDefault();
                  pick(candidate);
                }}
                onMouseEnter={() => setActive(index)}
                className={`flex min-h-11 w-full min-w-0 items-center gap-2 rounded-chip px-3 py-2 text-left ${
                  index === active ? "bg-blue-tint" : "hover:bg-soft"
                }`}
              >
                <MemberAvatar
                  name={candidate.label}
                  avatarUrl={candidate.avatarUrl}
                  size={30}
                />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-bold text-charcoal">
                    {candidate.label}
                  </span>
                  {candidate.headline && (
                    <span className="block truncate text-xs text-charcoal-soft">
                      {candidate.headline}
                    </span>
                  )}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
