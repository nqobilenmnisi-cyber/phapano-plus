import { IconApplication } from "@/components/illustrations";
import { ApplyDirectory } from "@/components/ApplyDirectory";
import {
  getProgrammes,
  getSavedProgrammes,
} from "@/lib/queries";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { isApplicationActive } from "@/lib/application-plan-status";

export const metadata = { title: "Apply | Phapano+" };
export const dynamic = "force-dynamic";

export default async function ApplyPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; applications?: string }>;
}) {
  const query = await searchParams;
  const [programmes, plans] = await Promise.all([
    getProgrammes(),
    getSavedProgrammes(),
  ]);
  const savedIds = plans.filter((plan) => plan.is_saved).map((plan) => plan.programme_id);
  const applicationIds = plans.filter(isApplicationActive).map((plan) => plan.programme_id);
  const notesByProgramme = Object.fromEntries(
    plans.map((plan) => [plan.programme_id, plan.notes])
  );

  return (
    <main className="mx-auto max-w-4xl px-4 pb-12 sm:px-6">
      <section className="relative pb-2 pt-7">
        <div className="flex items-center gap-2.5">
          <IconApplication className="h-7 w-7 flex-none" />
          <h1 className="font-sora text-3xl font-bold tracking-tight">Apply</h1>
        </div>
        <p className="mt-1.5 text-sm text-charcoal-soft">
          Explore verified Psychology study routes from undergraduate study
          through doctoral research. Open the university&apos;s own programme
          source before you apply.
        </p>
      </section>

      {!isSupabaseConfigured ? (
        <div className="mt-6 rounded-card border border-dashed border-divider bg-soft px-6 py-12 text-center">
          <IconApplication className="mx-auto h-10 w-10" />
          <h3 className="mt-4 font-sora text-base font-semibold tracking-tight">
            Connect Supabase to load the programme directory
          </h3>
          <p className="mx-auto mt-1.5 max-w-md text-sm text-charcoal-soft">
            The Apply directory reads from your programmes database. Once
            connected, verified Psychology programmes appear here.
          </p>
        </div>
      ) : programmes.length === 0 ? (
        <div className="mt-6 rounded-card border border-dashed border-divider bg-soft px-6 py-12 text-center">
          <IconApplication className="mx-auto h-10 w-10" />
          <h3 className="mt-4 font-sora text-base font-semibold tracking-tight">
            No programmes added yet
          </h3>
          <p className="mx-auto mt-1.5 max-w-md text-sm text-charcoal-soft">
            Run the latest Apply migration and the verified directory will populate here.
          </p>
        </div>
      ) : (
        <ApplyDirectory
          programmes={programmes}
          savedIds={savedIds}
          applicationIds={applicationIds}
          notesByProgramme={notesByProgramme}
          initialSavedOnly={query.saved === "true"}
          initialApplicationsOnly={query.applications === "true"}
          demo={!isSupabaseConfigured}
        />
      )}
    </main>
  );
}
