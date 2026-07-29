import { IconApplication } from "@/components/illustrations";
import { ApplyDirectory } from "@/components/ApplyDirectory";
import { getProgrammes, getSavedProgrammeIds } from "@/lib/queries";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata = { title: "Apply | Phapano+" };

export default async function ApplyPage() {
  const [programmes, savedIds] = await Promise.all([
    getProgrammes(),
    getSavedProgrammeIds(),
  ]);

  return (
    <main className="mx-auto max-w-4xl px-6 pb-12">
      <section className="relative pb-2 pt-7">
        <div className="flex items-center gap-2.5">
          <IconApplication className="h-7 w-7 flex-none" />
          <h1 className="font-sora text-3xl font-bold tracking-tight">Apply</h1>
        </div>
        <p className="mt-1.5 text-sm text-charcoal-soft">
          Every South African Psychology Honours and Master&apos;s programme in
          one place. Save the ones you&apos;re interested in, plan your
          applications, and jump straight to the official university pages.
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
            connected, Honours and Master&apos;s programmes appear here.
          </p>
        </div>
      ) : programmes.length === 0 ? (
        <div className="mt-6 rounded-card border border-dashed border-divider bg-soft px-6 py-12 text-center">
          <IconApplication className="mx-auto h-10 w-10" />
          <h3 className="mt-4 font-sora text-base font-semibold tracking-tight">
            No programmes added yet
          </h3>
          <p className="mx-auto mt-1.5 max-w-md text-sm text-charcoal-soft">
            Run the programmes migration and the directory will populate here.
          </p>
        </div>
      ) : (
        <ApplyDirectory
          programmes={programmes}
          savedIds={savedIds}
          demo={!isSupabaseConfigured}
        />
      )}
    </main>
  );
}
