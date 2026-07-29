import Link from "next/link";
import {
  IconApplication,
  IconFunding,
  IconDashboard,
  Compass,
} from "@/components/illustrations";
import { Logo } from "@/components/Logo";
import { getAuthState } from "@/lib/queries";

export default async function LandingPage() {
  const { authed } = await getAuthState();
  const ctaHref = authed ? "/dashboard" : "/signup";
  const ctaLabel = authed ? "Open Phapano+" : "Create Account";

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <Compass className="pointer-events-none absolute right-2 top-6 hidden w-64 opacity-80 sm:block" />
        <div className="mx-auto max-w-6xl px-5 pb-12 pt-14 sm:px-6 sm:pb-16 sm:pt-20">
          <p className="eyebrow">Psychology pathway support for South African students</p>
          <h1 className="mt-4 max-w-3xl break-words font-sora text-3xl font-bold leading-[1.12] tracking-tight sm:text-6xl">
            Navigate your psychology pathway{" "}
            <span className="text-blue-action">with confidence.</span>
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-charcoal-soft sm:mt-6 sm:text-lg">
            Finding reliable psychology pathway information can feel
            overwhelming. Phapano+ helps you organise your journey, explore
            guidance and keep track of your next steps.
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
            title="Plan your applications"
            body="Explore psychology programmes, review application requirements and keep track of the programmes you are considering."
          />
          <ValueCard
            icon={<IconFunding className="h-8 w-8" />}
            title="Explore funding"
            body="Browse relevant bursaries, scholarships and funding opportunities, and save the ones you want to revisit."
          />
          <ValueCard
            icon={<IconDashboard className="h-8 w-8" />}
            title="Manage upcoming dates"
            body="Keep your application deadlines, funding dates and pathway milestones together so they are easier to follow."
          />
        </div>
      </section>

      {/* MY PATHWAY FEATURE */}
      <section className="border-y border-line bg-gradient-to-br from-[#EAF3FC] to-[#F4F9FF]">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-6 py-20 md:grid-cols-2">
          <div>
            <div className="flex items-center gap-2.5 text-[0.7rem] font-extrabold uppercase tracking-[0.18em] text-blue-action">
              <IconDashboard className="h-6 w-6" />
              My Pathway
            </div>
            <h2 className="mt-3 font-sora text-3xl font-bold tracking-tight">
              Keep your next steps in view.
            </h2>
            <p className="mt-4 text-charcoal-soft">
              View upcoming application dates, funding deadlines, saved items
              and pathway milestones in one planning space.
            </p>
            <Link href={ctaHref} className="btn-primary mt-7">
              {ctaLabel}
            </Link>
          </div>
          <div className="card overflow-hidden p-0">
            <div className="border-b border-line bg-white px-6 py-4">
              <p className="text-[0.68rem] font-extrabold uppercase tracking-wider text-blue-action">
                Coming up
              </p>
              <p className="mt-1 font-sora text-lg font-bold">
                Keep track of upcoming dates
              </p>
            </div>
            <PreviewRow status="Closes in 6 days" kind="Application" title="Wits, MA Clinical" colour="#C2693F" />
            <PreviewRow status="Due in 12 days" kind="Funding you saved" title="NRF Master's bursary" colour="#2E6FB0" />
            <PreviewRow status="Starts in 23 days" kind="Selection week" title="UJ Counselling interviews" colour="#5C5C5E" />
          </div>
        </div>
      </section>

      {/* JOURNEY */}
      <section className="mx-auto max-w-4xl px-6 py-20 text-center">
        <div className="mx-auto flex justify-center">
          <Logo href={null} size={52} />
        </div>
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
              : "Begin organising your psychology pathway with a Phapano+ account."}
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
  status,
  kind,
  title,
  colour,
}: {
  status: string;
  kind: string;
  title: string;
  colour: string;
}) {
  return (
    <div className="flex items-center gap-4 border-b border-line-soft bg-white px-6 py-4 last:border-0">
      <div>
        <div className="text-[0.68rem] font-extrabold uppercase tracking-wider text-charcoal-soft">
          {kind}
        </div>
        <div className="font-sora font-semibold">{title}</div>
        <div className="mt-0.5 text-xs font-bold" style={{ color: colour }}>
          {status}
        </div>
      </div>
    </div>
  );
}
