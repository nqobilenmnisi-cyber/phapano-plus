import { PageHero } from "@/components/Marketing";
import {
  IconApplication,
  IconFunding,
  IconDashboard,
  IconProfile,
  IconNotes,
} from "@/components/illustrations";
import { getAuthState } from "@/lib/queries";
import Link from "next/link";

export const metadata = { title: "Features | Phapano+" };

const features = [
  { icon: <IconApplication className="h-7 w-7" />, title: "Apply", body: "Explore psychology programmes, review application requirements and keep track of the programmes you are considering." },
  { icon: <IconFunding className="h-7 w-7" />, title: "Funding", body: "Browse available bursaries, scholarships and other relevant funding opportunities, and save the ones you want to revisit." },
  { icon: <IconDashboard className="h-7 w-7" />, title: "My Pathway", body: "View upcoming application dates, funding deadlines, saved items and pathway milestones in one planning space." },
  { icon: <IconDashboard className="h-7 w-7" />, title: "Today", body: "See practical next steps based on the information you have added, including saved programmes, deadlines, goals and notes." },
  { icon: <IconProfile className="h-7 w-7" />, title: "Community", body: "Connect with psychology students and professionals, share questions and resources, and take part in pathway-focused discussions." },
  { icon: <IconNotes className="h-7 w-7" />, title: "Notes", body: "Keep private planning notes, reminders, questions and next steps linked to your psychology journey." },
];

export default async function FeaturesPage() {
  const { authed } = await getAuthState();
  return (
    <>
      <PageHero
        eyebrow="Features"
        title="Support for your psychology pathway"
        intro="Explore the current Phapano+ tools for planning, finding opportunities and participating in the psychology community."
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
            {authed ? "Open Phapano+" : "Create Account"}
          </Link>
        </div>
      </section>
    </>
  );
}
