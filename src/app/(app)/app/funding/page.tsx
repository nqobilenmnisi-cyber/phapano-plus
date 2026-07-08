import { IconFunding } from "@/components/illustrations";
import { FundingDirectory } from "@/components/FundingDirectory";
import { getFunding, getSavedIdSets } from "@/lib/queries";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { DEMO_FUNDING } from "@/lib/demo-content";
import { DEMO_NOTICE } from "@/lib/demo";

export const metadata = { title: "Funding — Phapano+" };

export default async function FundingPage() {
  const [funding, sets] = await Promise.all([getFunding(), getSavedIdSets()]);
  const list = isSupabaseConfigured ? funding : DEMO_FUNDING;
  const savedIds = Array.from(sets.fundingIds);

  return (
    <main className="mx-auto max-w-3xl px-6 pb-12">
      <section className="pb-2 pt-7">
        <div className="flex items-center gap-2.5">
          <IconFunding className="h-7 w-7 flex-none" />
          <h1 className="font-sora text-3xl font-bold tracking-tight">Funding</h1>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-charcoal-soft">
          Phapano+ is a guide to funding opportunities that may be relevant to
          psychology students and graduates. Funding opportunities open and close
          throughout the year, eligibility requirements may change, and not every
          opportunity is available every year. Always verify the latest
          information on the official funder&apos;s website before making plans or
          submitting an application.
        </p>
      </section>

      {!isSupabaseConfigured && (
        <p className="mb-2 mt-3 rounded-chip border border-bronze-soft bg-bronze-soft/30 px-4 py-2.5 text-center text-xs font-semibold text-bronze-deep">
          {DEMO_NOTICE}
        </p>
      )}

      {list.length > 0 ? (
        <FundingDirectory funding={list} savedIds={savedIds} demo={!isSupabaseConfigured} />
      ) : (
        <div className="mt-6 rounded-card border border-dashed border-divider bg-soft px-6 py-12 text-center">
          <IconFunding className="mx-auto h-9 w-9" />
          <h3 className="mt-4 font-sora text-base font-semibold tracking-tight">
            No funding opportunities yet
          </h3>
          <p className="mx-auto mt-1.5 max-w-md text-sm text-charcoal-soft">
            Psychology-relevant bursaries, scholarships and research funding will
            appear here.
          </p>
        </div>
      )}
    </main>
  );
}
