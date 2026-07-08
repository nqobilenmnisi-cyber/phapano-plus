import Link from "next/link";
import { notFound } from "next/navigation";
import { getFundingOne, getSavedIdSets } from "@/lib/queries";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { DEMO_FUNDING } from "@/lib/demo-content";
import { SaveButton } from "@/components/SaveButton";
import { VerifiedBadge, CountdownRing } from "@/components/Trust";
import { toggleSaveFunding } from "@/app/(app)/app/funding/actions";
import {
  streamLabels,
  careerStageLabels,
  daysUntil,
  urgencyOf,
  formatDate,
} from "@/lib/utils";

const typeLabels: Record<string, string> = {
  scholarship: "Scholarship",
  bursary: "Bursary",
  research_funding: "Research funding",
  conference_funding: "Conference funding",
  travel_grant: "Travel grant",
  other: "Funding",
};

export default async function FundingDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let funding = await getFundingOne(id);
  let saved = false;

  if (!isSupabaseConfigured) {
    funding = DEMO_FUNDING.find((f) => f.id === id) ?? null;
  } else {
    const sets = await getSavedIdSets();
    saved = sets.fundingIds.has(id);
  }

  if (!funding) notFound();
  const days = daysUntil(funding.closing_date);

  return (
    <main className="mx-auto max-w-3xl px-6 pb-10">
      <Link
        href="/app/funding"
        className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-charcoal-soft hover:text-charcoal"
      >
        ← All funding
      </Link>

      <section className="mt-4 flex items-start justify-between gap-4">
        <div>
          <div className="text-[0.7rem] font-extrabold uppercase tracking-wider text-charcoal-soft">
            {typeLabels[funding.type]}{" "}
            {funding.provider ? `· ${funding.provider}` : ""}
          </div>
          <h1 className="mt-1 font-sora text-2xl font-bold tracking-tight">
            {funding.title}
          </h1>
          {funding.amount_description && (
            <p className="mt-1 font-semibold text-bronze-deep">
              {funding.amount_description}
            </p>
          )}
          <div className="mt-2">
            <VerifiedBadge date={funding.last_verified_at} />
          </div>
        </div>
        <div className="flex flex-col items-center gap-3">
          {funding.closing_date && (
            <CountdownRing days={days} urgency={urgencyOf(days)} />
          )}
          <SaveButton
            saved={saved}
            onToggle={async (s) => toggleSaveFunding(funding!.id, s)}
          />
        </div>
      </section>

      {funding.closing_date && (
        <p className="mt-5 rounded-card border border-line bg-soft px-4 py-3 text-sm font-semibold text-charcoal">
          Closes {formatDate(funding.closing_date)}
        </p>
      )}

      {funding.description && (
        <p className="mt-5 text-charcoal-soft">{funding.description}</p>
      )}

      {funding.eligibility && (
        <>
          <h2 className="mb-2 mt-7 font-sora text-lg font-bold tracking-tight">
            Eligibility
          </h2>
          <p className="text-charcoal-soft">{funding.eligibility}</p>
        </>
      )}

      {(funding.relevant_streams?.length > 0 ||
        funding.relevant_stages?.length > 0) && (
        <div className="mt-5 flex flex-wrap gap-2">
          {funding.relevant_streams?.map((s) => (
            <span
              key={s}
              className="rounded-full bg-blue-tint px-3 py-1 text-xs font-bold text-blue-deep"
            >
              {streamLabels[s]}
            </span>
          ))}
          {funding.relevant_stages?.map((s) => (
            <span
              key={s}
              className="rounded-full border border-line px-3 py-1 text-xs font-bold text-charcoal-soft"
            >
              {careerStageLabels[s]}
            </span>
          ))}
        </div>
      )}

      {funding.link && (
        <a
          href={funding.link}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary mt-7"
        >
          Go to official application ↗
        </a>
      )}

      <p className="mt-8 rounded-card border border-line bg-soft px-5 py-4 text-xs leading-relaxed text-charcoal-soft">
        Always confirm details and deadlines on the official provider page before
        applying. We verify regularly, and the official link above is the source
        of truth.
      </p>
    </main>
  );
}
