import { IconFunding } from "@/components/illustrations";
import { FundingDirectory } from "@/components/FundingDirectory";
import { getFunding, getSavedIdSets } from "@/lib/queries";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { DEMO_FUNDING } from "@/lib/demo-content";
import { DEMO_NOTICE } from "@/lib/demo";

export const metadata = { title: "Funding | Phapano+" };

export default async function FundingPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const query = await searchParams;
  const [funding, sets] = await Promise.all([getFunding(), getSavedIdSets()]);
  const list = isSupabaseConfigured ? funding : DEMO_FUNDING;
  const savedIds = Array.from(sets.fundingIds);

  return (
    <main className="mx-auto max-w-4xl px-4 pb-12 sm:px-6">
      <section className="card relative mt-7 overflow-hidden border-blue/30 bg-gradient-to-br from-[#EAF4FF] via-white to-[#FBF4ED] p-5 sm:p-7">
        <div aria-hidden="true" className="absolute -right-14 -top-16 h-44 w-44 rounded-full bg-blue/15 blur-2xl" />
        <div className="relative">
          <p className="inline-flex items-center gap-2 rounded-full border border-blue/25 bg-white/85 px-3 py-1.5 text-xs font-extrabold uppercase tracking-wider text-blue-deep">
            <span className="h-2 w-2 rounded-full bg-ok" />
            Live funding board
          </p>
          <div className="mt-4 flex items-center gap-3">
            <span className="grid h-11 w-11 flex-none place-items-center rounded-card bg-blue-action text-white shadow-sm">
              <IconFunding className="h-7 w-7" />
            </span>
            <h1 className="font-sora text-3xl font-bold tracking-tight sm:text-4xl">Funding</h1>
          </div>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-charcoal-soft sm:text-base">
            Find bursaries, scholarships, research grants and conference support
            relevant to psychology pathways in South Africa.
          </p>
          <p className="mt-4 max-w-2xl text-xs leading-relaxed text-charcoal-soft">
            Phapano+ monitors official sources for changes. Always confirm final
            eligibility and dates on the funder&apos;s own page before applying.
          </p>
        </div>
      </section>

      {!isSupabaseConfigured && (
        <p className="mb-2 mt-3 rounded-chip border border-bronze-soft bg-bronze-soft/30 px-4 py-2.5 text-center text-xs font-semibold text-bronze-deep">
          {DEMO_NOTICE}
        </p>
      )}

      {list.length > 0 ? (
        <FundingDirectory
          funding={list}
          savedIds={savedIds}
          initialSavedOnly={query.saved === "true"}
          demo={!isSupabaseConfigured}
        />
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
