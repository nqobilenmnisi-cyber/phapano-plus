import Link from "next/link";
import {
  IconApplication,
  IconFunding,
  IconRadar,
  IconDashboard,
  Compass,
} from "@/components/illustrations";
import { getAuthState } from "@/lib/queries";

export default async function LandingPage() {
  const { authed } = await getAuthState();
  const ctaHref = authed ? "/dashboard" : "/signup";
  const ctaLabel = authed ? "Open Phapano+" : "Create your free account";

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <Compass className="pointer-events-none absolute right-2 top-6 hidden w-64 opacity-80 sm:block" />
        <div className="mx-auto max-w-6xl px-6 pb-16 pt-20">
          <p className="eyebrow">Psychology pathway support for South African students</p>
          <h1 className="mt-4 max-w-3xl font-sora text-4xl font-bold leading-[1.1] tracking-tight sm:text-6xl">
            Navigate your psychology pathway{" "}
            <span className="text-blue-action">with confidence.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-charcoal-soft">
            Phapano+ brings Honours and Master&apos;s applications, funding
            opportunities and pathway guidance together, helping South African
            psychology students find verified information, track next steps and
            plan with clarity.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link href={ctaHref} className="btn-primary">
              {ctaLabel}
            </Link>
            <Link href="/features" className="btn-secondary">
              See how it works
            </Link>
          </div>
        </div>
      </section>

      {/* THE PROBLEM */}
      <section className="border-y border-line bg-soft">
        <div className="mx-auto max-w-4xl px-6 py-16 text-center">
          <h2 className="font-sora text-2xl font-bold tracking-tight sm:text-3xl">
            The information exists. The problem is that it&apos;s scattered.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-charcoal-soft">
            University websites, Facebook groups, WhatsApp chats, PDFs, email
            lists. Every year, students spend countless hours hunting for answers
            they deserve to find in one place. Phapano+ closes that gap.
          </p>
        </div>
      </section>

      {/* VALUE PROPS */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid gap-6 md:grid-cols-3">
          <ValueCard
            icon={<IconApplication className="h-8 w-8" />}
            title="Apply with confidence"
            body="Explore psychology programmes across South Africa, with verified deadlines, requirements and referee guidance. Track every Honours and Master's application in one place."
          />
          <ValueCard
            icon={<IconFunding className="h-8 w-8" />}
            title="Find funding that fits"
            body="Keep track of verified bursaries, scholarships and relevant opportunities, with deadline reminders so you don't miss the ones that matter."
          />
          <ValueCard
            icon={<IconRadar className="h-8 w-8" />}
            title="Stay ahead of deadlines"
            body="Your Opportunity Radar surfaces what's closing soon and what to do next, ordered by what's most urgent, so nothing slips past you."
          />
        </div>
      </section>

      {/* OPPORTUNITY RADAR FEATURE */}
      <section className="border-y border-line bg-gradient-to-br from-[#EAF3FC] to-[#F4F9FF]">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-6 py-20 md:grid-cols-2">
          <div>
            <div className="flex items-center gap-2.5 text-[0.7rem] font-extrabold uppercase tracking-[0.18em] text-blue-action">
              <IconRadar className="h-6 w-6" />
              The Opportunity Radar
            </div>
            <h2 className="mt-3 font-sora text-3xl font-bold tracking-tight">
              You should never wonder what to do next.
            </h2>
            <p className="mt-4 text-charcoal-soft">
              Phapano&apos;s defining feature surfaces what matters right now:
              the deadlines approaching, the funding you&apos;ve saved, the next
              step in an application you&apos;ve started, ordered by what&apos;s
              closest.
            </p>
            <Link href={ctaHref} className="btn-primary mt-7">
              {ctaLabel}
            </Link>
          </div>
          <div className="card overflow-hidden p-0">
            <div className="border-b border-line bg-white px-6 py-4">
              <p className="text-[0.68rem] font-extrabold uppercase tracking-wider text-blue-action">
                Your radar · today
              </p>
              <p className="mt-1 font-sora text-lg font-bold">
                Everything that matters, today
              </p>
            </div>
            <PreviewRow days={6} kind="Application closes" title="Wits, MA Clinical" colour="#C2693F" />
            <PreviewRow days={12} kind="Funding you saved" title="NRF Master's bursary" colour="#2E6FB0" />
            <PreviewRow days={23} kind="Selection week" title="UJ Counselling interviews" colour="#5C5C5E" />
          </div>
        </div>
      </section>

      {/* JOURNEY */}
      <section className="mx-auto max-w-4xl px-6 py-20 text-center">
        <IconDashboard className="mx-auto h-12 w-12" />
        <h2 className="mt-4 font-sora text-2xl font-bold tracking-tight sm:text-3xl">
          Built for every stage, not just one season
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-charcoal-soft">
          From your first curiosity about psychology, through Honours,
          Master&apos;s applications, training and into professional practice,
          Phapano+ grows with you. The platform you wish had existed when you
          began.
        </p>
        <Link href={ctaHref} className="btn-primary mt-8">
          {ctaLabel}
        </Link>
      </section>

      {/* CTA */}
      <section className="border-t border-line bg-charcoal">
        <div className="mx-auto max-w-4xl px-6 py-16 text-center">
          <h2 className="font-sora text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Plan your next step in psychology.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-white/70">
            {authed
              ? "Pick up where you left off and keep your applications on track."
              : "Create your free account and see your whole application picture come together in minutes."}
          </p>
          <Link
            href={ctaHref}
            className="mt-7 inline-flex items-center justify-center gap-2 rounded-chip bg-blue px-6 py-3.5 font-semibold text-charcoal transition hover:bg-white"
          >
            {ctaLabel}
          </Link>
        </div>
      </section>
    </>
  );
}

function ValueCard({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="card p-7">
      <div className="mb-4 grid h-12 w-12 place-items-center rounded-card bg-blue-tint/60">
        {icon}
      </div>
      <h3 className="font-sora text-lg font-bold tracking-tight">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-charcoal-soft">{body}</p>
    </div>
  );
}

function PreviewRow({
  days,
  kind,
  title,
  colour,
}: {
  days: number;
  kind: string;
  title: string;
  colour: string;
}) {
  return (
    <div className="flex items-center gap-4 border-b border-line-soft bg-white px-6 py-4 last:border-0">
      <div className="grid h-12 w-12 flex-none place-items-center rounded-full border-[3px]" style={{ borderColor: colour }}>
        <span className="font-sora text-lg font-extrabold tabular-nums" style={{ color: colour }}>
          {days}
        </span>
      </div>
      <div>
        <div className="text-[0.68rem] font-extrabold uppercase tracking-wider text-charcoal-soft">
          {kind}
        </div>
        <div className="font-sora font-semibold">{title}</div>
      </div>
    </div>
  );
}
