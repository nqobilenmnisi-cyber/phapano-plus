import Link from "next/link";
import { ReachingHands } from "@/components/illustrations";
import { CountdownRing, VerifiedBadge } from "@/components/Trust";
import { daysUntil, urgencyOf, formatDateShort, type Urgency } from "@/lib/utils";

export interface PathwayItem {
  id: string;
  kind: string; // "Application closes", "Funding you qualify for", ...
  title: string;
  date: string | null;
  verifiedAt: string | null;
  href: string;
  meta?: string;
}

function bandOf(items: PathwayItem[], band: Urgency) {
  return items
    .map((it) => ({ it, d: daysUntil(it.date), u: urgencyOf(daysUntil(it.date)) }))
    .filter((x) => x.u === band)
    .sort((a, b) => (a.d ?? 9999) - (b.d ?? 9999));
}

function timingLabel(kind: string, days: number | null): string {
  if (days === null) return "Date to be confirmed";
  if (days < 0) {
    const overdue = Math.abs(days);
    return `Overdue by ${overdue} ${overdue === 1 ? "day" : "days"}`;
  }
  const lowerKind = kind.toLowerCase();
  const verb =
    lowerKind.includes("selection") || lowerKind.includes("event")
      ? "Starts"
      : lowerKind.includes("note")
        ? "Due"
        : "Closes";
  if (days === 0) return `${verb} today`;
  if (days === 1) return `${verb} tomorrow`;
  return `${verb} in ${days} days`;
}

function Row({ it, d, u }: { it: PathwayItem; d: number | null; u: Urgency }) {
  const timing = timingLabel(it.kind, d);
  return (
    <Link
      href={it.href}
      aria-label={`${it.title}. ${timing}.`}
      className="group flex items-center gap-4 rounded-[15px] p-3.5 transition hover:translate-x-0.5 hover:bg-soft"
    >
      <CountdownRing days={d} urgency={u} />
      <div className="min-w-0 flex-1">
        <div className="text-[0.68rem] font-extrabold uppercase tracking-wider text-charcoal-soft">
          {it.kind}
        </div>
        <h4 className="truncate font-sora text-base font-semibold tracking-tight">
          {it.title}
        </h4>
        <div className="flex flex-wrap items-center gap-1.5 text-sm text-charcoal-soft">
          <span className="font-semibold">{timing}</span>
          {it.date && <span>· {formatDateShort(it.date)}</span>}
          {it.meta && <span>· {it.meta}</span>}
          <VerifiedBadge date={it.verifiedAt} />
        </div>
      </div>
    </Link>
  );
}

export function MyPathway({ items }: { items: PathwayItem[] }) {
  const now = bandOf(items, "now");
  const soon = bandOf(items, "soon");
  const ahead = bandOf(items, "ahead");
  const hasAny = now.length + soon.length + ahead.length > 0;

  return (
    <section
      aria-label="My Pathway"
      className="overflow-hidden rounded-[26px] border-[1.5px] border-[#D3E4F6] shadow-[0_3px_6px_rgba(55,55,56,.05),0_26px_60px_rgba(46,111,176,.13)]"
    >
      <div className="relative overflow-hidden border-b border-[#E0EBF7] bg-gradient-to-br from-[#E8F2FC] to-[#F3F9FF] px-6 pb-5 pt-6">
        <ReachingHands className="pointer-events-none absolute -bottom-5 -right-2.5 w-40 opacity-[0.16]" />
        <div className="flex items-center gap-2.5 text-[0.7rem] font-extrabold uppercase tracking-[0.18em] text-blue-action">
          <svg viewBox="0 0 22 22" className="h-[22px] w-[22px]">
            <circle cx="11" cy="11" r="9.5" fill="none" stroke="#76B9F0" strokeWidth="1.5" opacity="0.55" />
            <circle cx="11" cy="11" r="5" fill="none" stroke="#76B9F0" strokeWidth="1.5" opacity="0.55" />
            <line x1="11" y1="11" x2="11" y2="2.5" stroke="#AD795B" strokeWidth="1.6" strokeLinecap="round" />
            <circle cx="11" cy="11" r="1.6" fill="#2E6FB0" />
          </svg>
          Coming up
        </div>
        <h2 className="mt-2 font-sora text-2xl font-extrabold tracking-tight">
          My Pathway
        </h2>
        <p className="mt-1 max-w-[90%] text-sm text-charcoal-soft">
          Keep track of your upcoming deadlines, milestones and next steps.
        </p>
      </div>

      {!hasAny ? (
        <div className="bg-white px-6 py-10 text-center">
          <p className="font-sora text-charcoal">Nothing coming up yet.</p>
          <p className="mt-1 text-sm text-charcoal-soft">
            Save an institution or some funding, or add a note with a due date,
            and upcoming dates will appear here.
          </p>
          <Link href="/app/apply" className="btn-secondary mt-5 inline-flex">
            Go to Apply
          </Link>
        </div>
      ) : (
        <>
          {now.length > 0 && (
            <Band label="This week" tick="#C2693F">
              {now.map((x) => (
                <Row key={x.it.id} {...x} />
              ))}
            </Band>
          )}
          {soon.length > 0 && (
            <Band label="Coming up" tick="#2E6FB0">
              {soon.map((x) => (
                <Row key={x.it.id} {...x} />
              ))}
            </Band>
          )}
          {ahead.length > 0 && (
            <Band label="On the horizon" tick="#5C5C5E">
              {ahead.map((x) => (
                <Row key={x.it.id} {...x} />
              ))}
            </Band>
          )}
        </>
      )}
    </section>
  );
}

function Band({
  label,
  tick,
  children,
}: {
  label: string;
  tick: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white">
      <div className="flex items-center gap-2.5 px-5 pb-2 pt-3.5 text-[0.7rem] font-extrabold uppercase tracking-wider text-charcoal-soft">
        <span className="h-2 w-2 flex-none rounded-full" style={{ background: tick }} />
        {label}
      </div>
      <div className="px-2 pb-1">{children}</div>
    </div>
  );
}
