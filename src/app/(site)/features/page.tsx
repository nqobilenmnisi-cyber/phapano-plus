import { PageHero } from "@/components/Marketing";
import {
  IconApplication,
  IconFunding,
  IconRadar,
  IconDashboard,
  IconLearn,
  IconNotes,
} from "@/components/illustrations";
import { getAuthState } from "@/lib/queries";
import Link from "next/link";

export const metadata = { title: "Features — Phapano+" };

const features = [
  { icon: <IconApplication className="h-7 w-7" />, title: "Apply", body: "Explore psychology programmes across South Africa, with verified deadlines, requirements, referee guidance and application tracking, for both Honours and Master's applicants." },
  { icon: <IconFunding className="h-7 w-7" />, title: "Funding", body: "Keep track of verified bursaries, scholarships and relevant opportunities, with deadline reminders so nothing is missed." },
  { icon: <IconRadar className="h-7 w-7" />, title: "Opportunity Radar", body: "Your personalised view of what matters now: closing application deadlines, saved funding and your next step, ordered by what's most urgent." },
  { icon: <IconDashboard className="h-7 w-7" />, title: "A dashboard that orients you", body: "Open Phapano+ and see exactly where you are and what to do next, adapted to your stage. Every screen answers one question: what is the next useful step?" },
  { icon: <IconLearn className="h-7 w-7" />, title: "Learning resources", body: "Practical videos, guides and workshop resources from Phapano on applications, requirements, interviews and selection, for the South African psychology pathway." },
  { icon: <IconNotes className="h-7 w-7" />, title: "Private planning notes", body: "A private space to record application notes, goals, decisions and next steps. Your notes stay private and are never used to profile you." },
];

export default async function FeaturesPage() {
  const { authed } = await getAuthState();
  return (
    <>
      <PageHero
        eyebrow="Features"
        title="Everything you need, nothing that overwhelms"
        intro="Phapano+ is not a collection of tools. It is a companion designed around the psychology pathway, from first application to professional practice."
      />
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-6 md:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="card p-7">
              <div className="mb-4 grid h-12 w-12 place-items-center rounded-card bg-blue-tint/60">{f.icon}</div>
              <h3 className="font-sora text-lg font-bold tracking-tight">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-charcoal-soft">{f.body}</p>
            </div>
          ))}
        </div>
        <div className="mt-12 text-center">
          <Link href={authed ? "/dashboard" : "/signup"} className="btn-primary">
            {authed ? "Open Phapano+" : "Create your free account"}
          </Link>
        </div>
      </section>
    </>
  );
}
