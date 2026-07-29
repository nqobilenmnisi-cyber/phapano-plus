"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { searchGlobal } from "@/app/(app)/app/search/actions";
import { MemberAvatar } from "@/components/CommunityShared";
import { SearchIcon } from "@/components/PhapanoIcons";
import { VerificationBadges } from "@/components/VerificationBadges";
import {
  GLOBAL_SEARCH_GROUP_LABELS,
  GLOBAL_SEARCH_KIND_ORDER,
  type GlobalSearchResult,
} from "@/lib/global-search";

const RECENT_KEY = "phapano:recent-searches";

function rememberSearch(value: string) {
  const term = value.trim();
  if (!term) return;
  try {
    const stored = JSON.parse(
      window.localStorage.getItem(RECENT_KEY) ?? "[]"
    ) as string[];
    const next = [term, ...stored.filter((item) => item !== term)].slice(0, 5);
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    // Search still works if storage is unavailable.
  }
}

export function GlobalSearch({
  initialQuery = "",
  expanded = false,
}: {
  initialQuery?: string;
  expanded?: boolean;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<GlobalSearchResult[]>([]);
  const [open, setOpen] = useState(expanded && initialQuery.length >= 2);
  const [recent, setRecent] = useState<string[]>([]);
  const [pending, startTransition] = useTransition();
  const wrapRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    try {
      setRecent(
        JSON.parse(window.localStorage.getItem(RECENT_KEY) ?? "[]") as string[]
      );
    } catch {
      setRecent([]);
    }
  }, []);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    let live = true;
    const timer = window.setTimeout(() => {
      startTransition(async () => {
        const next = await searchGlobal(query);
        if (live) setResults(next);
      });
    }, 260);
    return () => {
      live = false;
      window.clearTimeout(timer);
    };
  }, [query]);

  useEffect(() => {
    function close(event: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(event.target as Node))
        setOpen(false);
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const groups = useMemo(
    () =>
      GLOBAL_SEARCH_KIND_ORDER.map((kind) => ({
        kind,
        items: results.filter((result) => result.kind === kind),
      })).filter((group) => group.items.length > 0),
    [results]
  );

  function submit() {
    const term = query.trim();
    if (!term) return;
    rememberSearch(term);
    router.push(`/app/search?q=${encodeURIComponent(term)}`);
    if (!expanded) setOpen(false);
  }

  return (
    <div ref={wrapRef} className={`relative min-w-0 ${expanded ? "w-full" : "flex-1"}`}>
      <form
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
        className="relative"
      >
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-charcoal-soft" />
        <input
          type="search"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search Phapano+"
          aria-label="Search Phapano+"
          className={`w-full rounded-full border border-line bg-white py-2.5 pl-10 pr-3 text-sm outline-none transition placeholder:text-charcoal-soft/70 focus:border-blue focus:ring-2 focus:ring-blue/25 ${
            expanded ? "h-12" : "h-10"
          }`}
        />
      </form>

      {open && (
        <div
          className={`z-50 overflow-hidden rounded-card border border-line bg-white shadow-lift ${
            expanded
              ? "mt-3 w-full"
              : "absolute left-0 right-0 top-[calc(100%+0.5rem)] max-h-[70vh] overflow-y-auto sm:min-w-[28rem]"
          }`}
        >
          {query.trim().length < 2 ? (
            <RecentSearches
              items={recent}
              onPick={(term) => {
                setQuery(term);
                setOpen(true);
              }}
              onClear={() => {
                window.localStorage.removeItem(RECENT_KEY);
                setRecent([]);
              }}
            />
          ) : pending ? (
            <p className="p-5 text-sm text-charcoal-soft" role="status">
              Searching…
            </p>
          ) : groups.length ? (
            <div className="divide-y divide-line">
              {groups.map((group) => (
                <section key={group.kind} className="p-2">
                  <h2 className="px-2 pb-1 pt-1 text-[0.68rem] font-extrabold uppercase tracking-[0.12em] text-charcoal-soft">
                    {GLOBAL_SEARCH_GROUP_LABELS[group.kind]}
                  </h2>
                  {group.items.map((result) => (
                    <SearchResultRow
                      key={`${result.kind}-${result.id}`}
                      result={result}
                      query={query}
                      onSelect={() => {
                        rememberSearch(query);
                        setOpen(false);
                      }}
                    />
                  ))}
                </section>
              ))}
              {!expanded && (
                <button
                  type="button"
                  onClick={submit}
                  className="w-full px-4 py-3 text-left text-sm font-bold text-blue-action hover:bg-blue-tint/40"
                >
                  View all results for “{query.trim()}”
                </button>
              )}
            </div>
          ) : (
            <div className="p-5">
              <p className="font-semibold text-charcoal">No results found</p>
              <p className="mt-1 text-sm text-charcoal-soft">
                Try a person, page, programme, funding opportunity or topic.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SearchResultRow({
  result,
  query,
  onSelect,
}: {
  result: GlobalSearchResult;
  query: string;
  onSelect: () => void;
}) {
  return (
    <Link
      href={result.href}
      onClick={onSelect}
      className="flex min-w-0 items-center gap-3 rounded-chip px-2 py-2.5 hover:bg-soft focus-visible:bg-soft focus-visible:outline-none"
    >
      {result.avatarUrl || result.kind === "people" || result.kind === "organisations" ? (
        <MemberAvatar name={result.title} avatarUrl={result.avatarUrl} size={36} />
      ) : (
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-blue-tint text-blue-deep">
          <SearchIcon className="h-4 w-4" />
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="flex min-w-0 items-center gap-1">
          <span className="truncate text-sm font-bold text-charcoal">
            {result.title}
          </span>
          {result.verified ? (
            <VerificationBadges badges={["verified_person"]} />
          ) : null}
        </span>
        {result.description ? (
          <span className="line-clamp-2 text-xs text-charcoal-soft">
            {highlight(result.description, query)}
          </span>
        ) : null}
      </span>
    </Link>
  );
}

function highlight(value: string, query: string) {
  const clean = query.trim();
  const index = value.toLocaleLowerCase("en-ZA").indexOf(
    clean.toLocaleLowerCase("en-ZA")
  );
  if (!clean || index < 0) return value;
  return (
    <>
      {value.slice(0, index)}
      <mark className="bg-blue-tint text-charcoal">
        {value.slice(index, index + clean.length)}
      </mark>
      {value.slice(index + clean.length)}
    </>
  );
}

function RecentSearches({
  items,
  onPick,
  onClear,
}: {
  items: string[];
  onPick: (term: string) => void;
  onClear: () => void;
}) {
  if (!items.length)
    return (
      <p className="p-5 text-sm text-charcoal-soft">
        Search people, pages, posts, programmes, funding and resources.
      </p>
    );
  return (
    <div className="p-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-wide text-charcoal-soft">
          Recent searches
        </p>
        <button
          type="button"
          onClick={onClear}
          className="text-xs font-bold text-blue-action"
        >
          Clear
        </button>
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        {items.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => onPick(item)}
            className="max-w-full truncate rounded-full border border-line px-3 py-2 text-sm font-semibold text-charcoal hover:border-blue"
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  );
}
