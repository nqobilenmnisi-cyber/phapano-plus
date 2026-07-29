import { formatDate, type Urgency } from "@/lib/utils";

export function VerifiedBadge({ date }: { date: string | null }) {
  if (!date) return null;
  return (
    <span className="inline-flex items-center gap-1 text-xs font-bold text-ok">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
        <path
          d="M5 13l4 4L19 7"
          stroke="#3F8F6F"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      Verified {formatDate(date)}
    </span>
  );
}

const ringColour: Record<Urgency, string> = {
  now: "#C2693F",
  soon: "#2E6FB0",
  ahead: "#5C5C5E",
  past: "#D8DEE3",
};
const numColour: Record<Urgency, string> = {
  now: "#B4502F",
  soon: "#2E6FB0",
  ahead: "#373738",
  past: "#5C5C5E",
};

/**
 * A quiet countdown ring. Communicates urgency through fill + colour
 * temperature, never alarm. Fuller + warmer = closer.
 */
export function CountdownRing({
  days,
  urgency,
}: {
  days: number | null;
  urgency: Urgency;
}) {
  const R = 23;
  const C = 2 * Math.PI * R; // ~144.5
  // fraction filled: closer deadlines = fuller ring (cap at 30 days view)
  const frac =
    days === null ? 0.15 : Math.max(0.06, Math.min(1, (30 - Math.min(days, 30)) / 30));
  const offset = C * (1 - frac);

  return (
    <div className="relative grid h-[54px] w-[54px] flex-none place-items-center">
      <svg viewBox="0 0 54 54" className="absolute inset-0 -rotate-90">
        <circle cx="27" cy="27" r={R} fill="none" stroke="#E8ECEF" strokeWidth="3.5" />
        <circle
          cx="27"
          cy="27"
          r={R}
          fill="none"
          stroke={ringColour[urgency]}
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="flex flex-col items-center">
        <span
          className="font-sora text-[1.18rem] font-extrabold leading-none tabular-nums tracking-tight"
          style={{ color: numColour[urgency] }}
        >
          {days === null ? "TBC" : days < 0 ? "Past" : days}
        </span>
        <span className="mt-0.5 text-[0.55rem] font-bold uppercase tracking-wider text-charcoal-soft">
          {days !== null && days >= 0 ? "days" : "soon"}
        </span>
      </div>
    </div>
  );
}
