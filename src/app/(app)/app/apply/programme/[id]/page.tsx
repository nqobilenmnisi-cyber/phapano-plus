import Link from "next/link";
import { notFound } from "next/navigation";
import { getProgramme, getSavedProgramme } from "@/lib/queries";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { applyStreamLabel } from "@/lib/utils";
import { SaveProgrammeButton } from "@/components/ApplyDirectory";
import { ApplicationPlanTracker } from "@/components/ApplicationPlan";
import { UniversityBadge } from "@/components/UniversityBadge";

export const metadata = { title: "Programme | Phapano+" };

// Official quick links in priority order. Only links that exist are shown;
// the general homepage is the last resort.
function quickLinks(p: {
  department_url: string | null;
  programme_url: string | null;
  primary_source_url: string | null;
  application_link: string | null;
  requirements_url: string | null;
  institution_url: string | null;
}) {
  const links: { label: string; url: string; hint: string }[] = [];
  if (p.department_url) links.push({ label: "Psychology department", url: p.department_url, hint: "Official department page" });
  const programmePage = p.programme_url ?? p.primary_source_url;
  if (programmePage) links.push({ label: "Programme page", url: programmePage, hint: "Programme details" });
  if (p.application_link) links.push({ label: "Apply online", url: p.application_link, hint: "Official application" });
  if (p.requirements_url) links.push({ label: "Admission requirements", url: p.requirements_url, hint: "Entry requirements" });
  // Homepage only as a last resort, and only if we have nothing better.
  if (links.length === 0 && p.institution_url) {
    links.push({ label: "University website", url: p.institution_url, hint: "Find the psychology pages here" });
  }
  return links;
}

export default async function ProgrammeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [p, plan] = await Promise.all([getProgramme(id), getSavedProgramme(id)]);

  if (!p) notFound();

  const links = quickLinks(p);

  return (
    <main className="mx-auto max-w-2xl px-6 pb-14">
      <div className="pt-7">
        <Link
          href="/app/apply"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-charcoal-soft hover:text-charcoal"
        >
          ← Back to Apply
        </Link>
      </div>

      <header className="mt-4 flex items-start gap-3">
        <UniversityBadge institution={p.institution} size="lg" />
        <div className="min-w-0">
          <h1 className="font-sora text-2xl font-bold leading-tight tracking-tight">
            {p.institution}
          </h1>
          <p className="mt-1 text-sm text-charcoal-soft">
            {p.programme_title ?? (
              p.qualification === "masters"
                ? `Psychology Master's · ${applyStreamLabel(p.stream)}`
                : "Psychology Honours"
            )}
            {p.province ? ` · ${p.province}` : ""}
          </p>
        </div>
      </header>

      <div className="mt-5">
        <SaveProgrammeButton
          programmeId={p.id}
          initialSaved={plan?.is_saved ?? false}
        />
      </div>

      {/* Official quick links — the navigation hub */}
      <section className="card mt-6 p-6">
        <h2 className="font-sora text-lg font-bold tracking-tight">Official links</h2>
        <p className="mt-1 text-sm text-charcoal-soft">
          Go straight to the university&apos;s own psychology pages, the source
          of truth for dates, fees and requirements.
        </p>
        {links.length > 0 ? (
          <ul className="mt-4 space-y-2">
            {links.map((l) => (
              <li key={l.url}>
                <a
                  href={l.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between gap-3 rounded-card border border-line bg-white px-4 py-3 transition hover:border-blue"
                >
                  <span>
                    <span className="block text-sm font-semibold text-charcoal">{l.label}</span>
                    <span className="block text-xs text-charcoal-soft">{l.hint}</span>
                  </span>
                  <span className="text-blue-action">↗</span>
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 rounded-card border border-dashed border-divider px-4 py-6 text-center text-sm text-charcoal-soft">
            Official links are being added for this programme.
          </p>
        )}
      </section>

      {/* Personal application tracker (per-user planning) */}
      <ApplicationPlanTracker
        programmeId={p.id}
        initial={plan}
        demo={!isSupabaseConfigured}
      />

      <p className="mt-4 text-xs text-charcoal-soft">
        Phapano+ helps you discover, organise and track your applications. The
        universities remain the authoritative source. Always confirm details on
        their official pages before applying.
      </p>
    </main>
  );
}
