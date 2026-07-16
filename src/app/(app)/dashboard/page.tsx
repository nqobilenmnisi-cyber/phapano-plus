import Link from "next/link";
import { AppTopBar, SupportLine } from "@/components/AppChrome";
import { BottomNav } from "@/components/BottomNav";
import { OpportunityRadar, type RadarItem } from "@/components/OpportunityRadar";
import { Compass, Star, IconApplication, IconNotes } from "@/components/illustrations";
import { redirect } from "next/navigation";
import {
  getAuthState,
  getProfile,
  getSavedFunding,
  getNotifications,
  getDatedNotes,
  getSavedProgrammes,
} from "@/lib/queries";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { greeting, firstName } from "@/lib/utils";
import { demoRadar, DEMO_NOTICE } from "@/lib/demo";
import type { CareerStage } from "@/types/database";

export const metadata = { title: "Today — Phapano+" };

// Curated, pathway-focused daily encouragement. Easy to edit. Rotates by date.
const AFFIRMATIONS = [
  "One clear next step is still progress.",
  "You do not need to have the whole path figured out today.",
  "Check one requirement, save one opportunity, or ask one question. Small steps count.",
  "Your psychology pathway is built one decision at a time.",
  "Progress can be one saved institution, one checked deadline, or one note you don't forget.",
  "Pick the next useful thing, and let the rest wait.",
  "Tracking a deadline today saves a scramble later.",
];

function affirmationForToday(): string {
  const start = new Date(new Date().getFullYear(), 0, 0).getTime();
  const dayOfYear = Math.floor((Date.now() - start) / 86_400_000);
  return AFFIRMATIONS[dayOfYear % AFFIRMATIONS.length];
}

export default async function DashboardPage() {
  // A signed-in user who hasn't finished onboarding belongs in onboarding,
  // not here. (Middleware already guarantees only authed users reach this
  // page; the onboarding page redirects completed users back to /dashboard,
  // so these two guards are mutually exclusive — no loop is possible.)
  if (isSupabaseConfigured) {
    const { authed, onboarded } = await getAuthState();
    if (authed && !onboarded) redirect("/onboarding");
  }

  const [profile, savedFunding, notifications, datedNotes, savedProgrammes] =
    await Promise.all([
      getProfile(),
      getSavedFunding(),
      getNotifications(),
      getDatedNotes(),
      getSavedProgrammes(),
    ]);

  // Build radar items from the user's real saved data + application deadlines.
  let radarItems: RadarItem[] = [];

  if (isSupabaseConfigured) {
    for (const f of savedFunding) {
      radarItems.push({
        id: `fund-${f.id}`,
        kind: "Funding you saved",
        title: f.title,
        date: f.closing_date,
        verifiedAt: f.last_verified_at,
        href: `/app/funding/${f.id}`,
        meta: f.amount_description ?? undefined,
      });
    }
  } else {
    radarItems = demoRadar();
  }

  // Saved Apply programmes appear on the radar (by closing date) and count
  // toward progress. Only SAVED programmes surface here — never the whole list.
  if (isSupabaseConfigured) {
    for (const sp of savedProgrammes) {
      const prog = sp.programme;
      if (!prog) continue;
      const label =
        prog.qualification === "masters"
          ? `${prog.institution} · Master's`
          : `${prog.institution} · Honours`;
      radarItems.push({
        id: `saved-prog-${prog.id}`,
        kind: "Programme deadline",
        title: label,
        date: sp.my_deadline ?? prog.closing_date,
        verifiedAt: null,
        href: `/app/apply/programme/${prog.id}`,
        meta: sp.next_action ?? undefined,
      });
    }
  }

  // Notes that have a due date become dated reminders on the radar.
  if (isSupabaseConfigured) {
    for (const n of datedNotes) {
      radarItems.push({
        id: `note-${n.id}`,
        kind: n.approach ? `Note · ${n.approach}` : "Your note",
        title: n.content.length > 60 ? `${n.content.slice(0, 60)}…` : n.content,
        date: n.due_date,
        verifiedAt: null,
        href: "/app/journal",
      });
    }
  }

  const name = firstName(profile?.full_name);
  const unread = notifications.filter((n) => !n.read).length;
  const programmesSaved = savedProgrammes.length;
  // An application is "in progress" once the user moves it beyond Interested
  // (or marks it submitted) in their planner.
  const appsStarted = savedProgrammes.filter(
    (sp) => sp.submitted || (sp.status != null && sp.status !== "Interested")
  ).length;
  const fundingSaved = savedFunding.length;
  const deadlinesTracked = datedNotes.length;
  const stage = profile?.career_stage ?? null;

  // Pathway progress only: saved programmes, applications in progress, funding,
  // deadlines. Profile setup is deliberately NOT counted here (this card is
  // pathway progress, so it starts at 0% until the user acts).
  const milestones = [
    programmesSaved > 0,
    appsStarted > 0,
    fundingSaved > 0,
    deadlinesTracked > 0,
  ];
  const milestonesDone = milestones.filter(Boolean).length;
  const progressPct = Math.round((milestonesDone / milestones.length) * 100);
  const hasData = milestonesDone > 0 || Boolean(profile?.goals);

  // Only nudge when the profile is genuinely missing required fields.
  const profileIncomplete =
    isSupabaseConfigured && (!profile?.full_name || !profile?.career_stage);

  return (
    <div className="min-h-screen pb-24">
      <AppTopBar unread={unread} />

      <main className="mx-auto max-w-3xl px-6">
        {!isSupabaseConfigured && (
          <p className="mt-3 rounded-chip border border-bronze-soft bg-bronze-soft/30 px-4 py-2.5 text-center text-xs font-semibold text-bronze-deep">
            {DEMO_NOTICE}
          </p>
        )}

        {/* greeting + compass (date lives only in the top badge) */}
        <section className="relative overflow-hidden px-1 pb-1.5 pt-7">
          <Compass className="pointer-events-none absolute -top-1.5 right-0 w-44 opacity-90" />
          <h1 className="mt-1 font-sora text-[2.15rem] font-bold leading-tight tracking-tight">
            {name ? (
              <>
                {greeting()}, <span className="text-blue-action">{name}</span>.
              </>
            ) : (
              "Welcome back."
            )}
            <br />
            Let&apos;s take the next step.
          </h1>
        </section>

        {/* gentle prompt to complete profile (only when truly incomplete) */}
        {profileIncomplete && (
          <Link
            href="/app/profile"
            className="mt-5 flex items-center gap-3 rounded-card border border-[#D3E4F6] bg-blue-tint/50 px-5 py-4 transition hover:border-blue"
          >
            <span className="grid h-9 w-9 flex-none place-items-center rounded-full bg-white text-blue-action">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="9" r="3.2" stroke="currentColor" strokeWidth="1.7" />
                <path d="M5.5 20a6.5 6.5 0 0 1 13 0" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
              </svg>
            </span>
            <div className="flex-1">
              <p className="font-sora text-sm font-semibold tracking-tight">
                Finish setting up your profile
              </p>
              <p className="text-sm text-charcoal-soft">
                A few details help us show what matters most to you.
              </p>
            </div>
            <span className="text-blue-action">→</span>
          </Link>
        )}

        {/* a short, practical note */}
        <div className="relative mt-5 flex items-start gap-3.5 overflow-hidden rounded-card border border-line bg-gradient-to-b from-white to-[#FBFCFE] px-5 py-5 shadow-card">
          <span className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-blue to-bronze-soft" />
          <Star className="mt-0.5 h-[22px] w-[22px] flex-none" />
          <p className="font-medium leading-relaxed text-charcoal">
            {affirmationForToday()}
          </p>
        </div>

        {/* your next steps */}
        <div className="mt-10 flex items-center gap-3 px-1">
          <IconApplication className="h-[26px] w-[26px] flex-none" />
          <h2 className="font-sora text-[1.34rem] font-bold tracking-tight">
            Your next steps
          </h2>
          <span className="ml-auto text-sm font-semibold text-charcoal-soft">
            {appsStarted > 0 ? "Pick up where you left off" : "Where to start"}
          </span>
        </div>
        <p className="ml-[40px] mt-0.5 text-sm text-charcoal-soft">
          {hasData
            ? "Based on your stage and what you've saved."
            : "Add your goals, saved institutions or deadlines to personalise your next steps."}
        </p>

        <FocusList
          stage={stage}
          appsStarted={appsStarted}
          savedCount={programmesSaved}
          goals={profile?.goals ?? null}
        />

        {/* radar */}
        <div className="mt-5">
          <OpportunityRadar items={radarItems} />
        </div>

        {/* progress — driven entirely by real data; empty when nothing done */}
        <div className="mt-10 flex items-center gap-4 rounded-card border border-bronze-soft bg-gradient-to-b from-white to-[#FBF7F3] px-5 py-5 shadow-card">
          <span className="grid h-[52px] w-[52px] flex-none place-items-center rounded-full border-[3px] border-bronze-soft bg-white">
            <span className="font-sora text-sm font-extrabold tabular-nums text-bronze-deep">
              {progressPct}%
            </span>
          </span>
          <div className="flex-1">
            <b className="font-sora text-base font-bold">Your progress so far</b>
            {hasData ? (
              <div className="text-sm text-charcoal-soft">
                {programmesSaved} programme{programmesSaved === 1 ? "" : "s"} saved ·{" "}
                {appsStarted} application{appsStarted === 1 ? "" : "s"} tracked ·{" "}
                {fundingSaved} funding saved · {deadlinesTracked} deadline
                {deadlinesTracked === 1 ? "" : "s"}
              </div>
            ) : (
              <div className="text-sm text-charcoal-soft">
                Your progress will appear here once you save an institution, add
                an application or track a deadline.
              </div>
            )}
            <div className="mt-2.5 h-[9px] overflow-hidden rounded-full border border-bronze-soft bg-white">
              <div
                className="h-full rounded-full bg-gradient-to-r from-bronze to-[#C99A7C] transition-all duration-1000"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* notes nudge — practical planning, not wellness */}
        <div className="mt-10 flex items-center gap-3 px-1 text-[0.74rem] font-extrabold uppercase tracking-[0.16em] text-charcoal-soft">
          Your pathway notes
          <span className="h-px flex-1 bg-divider opacity-60" />
        </div>
        <div className="relative mt-3.5 overflow-hidden rounded-card border border-dashed border-[#E0D3C6] bg-gradient-to-b from-[#FBF8F4] to-white px-6 py-5 shadow-card">
          <div className="flex items-center gap-2 text-[0.72rem] font-extrabold uppercase tracking-wider text-bronze">
            <IconNotes className="h-4 w-4" />
            Private notes &amp; reminders
          </div>
          <h3 className="mt-2 font-sora text-lg font-semibold tracking-tight">
            Keep application notes, funding leads and next steps in one place.
          </h3>
          <p className="mt-1 text-sm text-charcoal-soft">
            Private to you. Never used to profile you.
          </p>
          <Link href="/app/journal" className="btn-bronze mt-4">
            <IconNotes className="h-[15px] w-[15px]" />
            Open your notes
          </Link>
        </div>

        <SupportLine />
      </main>

      <BottomNav />
    </div>
  );
}

interface FocusStep {
  pill: string;
  tone: "blue" | "bronze";
  title: string;
  body: string;
  href: string;
  done?: boolean;
}

/** Stage-aware next steps. Does not assume the user is a Master's applicant. */
function focusStepsFor(
  stage: CareerStage | null,
  appsStarted: number,
  savedCount: number,
  goals: string | null
): FocusStep[] {
  const steps: FocusStep[] = [];

  // If the user set a current focus/goal, surface it first — it's theirs.
  if (goals && goals.trim()) {
    steps.push({
      pill: "Your focus",
      tone: "bronze",
      title: goals.trim(),
      body: "Your current focus, from your profile. Edit it any time.",
      href: "/app/profile",
    });
  }

  // Primary step, by stage.
  switch (stage) {
    case "undergraduate":
      steps.push({
        pill: "Explore",
        tone: "blue",
        title: "Explore psychology pathways",
        body: "See where an undergraduate degree can lead, and what to plan for.",
        href: "/app/apply",
      });
      break;
    case "honours_applicant":
      steps.push({
        pill: "Apply",
        tone: "blue",
        title:
          appsStarted > 0
            ? "Continue your Honours applications"
            : "Start tracking your Honours applications",
        body: "Explore universities and track each Honours application in one place.",
        href: "/app/apply",
      });
      break;
    case "honours":
      steps.push({
        pill: "Plan ahead",
        tone: "blue",
        title: "Plan for your Master's applications",
        body: "Explore programmes and start saving the universities you're considering.",
        href: "/app/apply",
      });
      break;
    case "masters_applicant":
      steps.push({
        pill: "Apply",
        tone: "blue",
        title:
          appsStarted > 0
            ? "Continue your Master's applications"
            : "Start tracking your Master's applications",
        body: "Explore programmes and track each application stage by stage.",
        href: "/app/apply",
      });
      break;
    case "masters_student":
      steps.push({
        pill: "Funding",
        tone: "blue",
        title: "Find funding for your studies",
        body: "Browse bursaries and grants that fit your stage and stream.",
        href: "/app/funding",
      });
      break;
    case "intern":
      steps.push({
        pill: "Prepare",
        tone: "blue",
        title: "Prepare for your internship milestones",
        body: "Keep board exam dates and internship requirements on your radar.",
        href: "/app/funding",
      });
      break;
    case "community_service":
      steps.push({
        pill: "Next steps",
        tone: "blue",
        title: "Plan your next professional steps",
        body: "Track opportunities, funding and milestones beyond community service.",
        href: "/app/funding",
      });
      break;
    case "professional":
      steps.push({
        pill: "Opportunities",
        tone: "blue",
        title: "Discover opportunities and funding",
        body: "Browse opportunities, grants and resources relevant to your practice.",
        href: "/app/funding",
      });
      break;
    default:
      steps.push({
        pill: "Explore",
        tone: "blue",
        title: "Explore psychology programmes",
        body: "Browse universities and start saving the ones you're interested in.",
        href: "/app/apply",
      });
  }

  // Learning step, tailored to the stage (selection week is Master's-specific).
  if (stage === "masters_applicant") {
    steps.push({
      pill: "Learn",
      tone: "blue",
      title: "Read: how selection week works",
      body: "A short, practical guide for Master's applicants.",
      href: "/learn",
    });
  } else if (stage === "honours_applicant") {
    steps.push({
      pill: "Learn",
      tone: "blue",
      title: "Read: what Honours selection looks for",
      body: "A short guide to strengthening your Honours application.",
      href: "/learn",
    });
  } else if (stage === "undergraduate") {
    steps.push({
      pill: "Learn",
      tone: "blue",
      title: "Read: planning your psychology pathway",
      body: "What to do in each undergraduate year to stay on track.",
      href: "/learn",
    });
  } else {
    steps.push({
      pill: "Learn",
      tone: "blue",
      title: "Explore guidance and resources",
      body: "Practical guides for the South African psychology pathway.",
      href: "/learn",
    });
  }

  // A neutral, non-gamified "first step" prompt.
  steps.push({
    pill: "Next step",
    tone: "bronze",
    title: savedCount > 0 ? "You've saved a programme" : "Save a programme to begin",
    body:
      savedCount > 0
        ? "It now appears on your radar, with its deadline tracked."
        : "Saving a programme starts your radar and tracks its deadline.",
    href: "/app/apply",
    done: savedCount > 0,
  });

  return steps;
}

function FocusList({
  stage,
  appsStarted,
  savedCount,
  goals,
}: {
  stage: CareerStage | null;
  appsStarted: number;
  savedCount: number;
  goals: string | null;
}) {
  const steps = focusStepsFor(stage, appsStarted, savedCount, goals);

  return (
    <div className="relative mt-4 pl-[42px]">
      <span className="pointer-events-none absolute bottom-3.5 left-[15px] top-2 w-[3px] rounded bg-[repeating-linear-gradient(180deg,#76B9F0_0_9px,transparent_9px_16px)] opacity-50" />
      {steps.map((s, i) => (
        <div key={i} className="relative mb-3.5">
          <span
            className={`absolute -left-[34px] top-4 z-[2] grid h-6 w-6 place-items-center rounded-full border-[2.5px] ${
              s.done
                ? "border-bronze bg-bronze"
                : i === 0
                  ? "border-blue bg-white shadow-[0_0_0_6px_rgba(118,185,240,.16)]"
                  : "border-blue bg-white"
            }`}
          >
            {s.done && (
              <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5">
                <path d="M5 13l4 4L19 7" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </span>
          <Link
            href={s.href}
            className={`block rounded-card border p-[17px] shadow-card transition hover:-translate-y-0.5 hover:border-[#D2E4F7] hover:shadow-lift ${
              s.done
                ? "border-bronze-soft bg-gradient-to-b from-[#FFFDFB] to-[#FBF7F3]"
                : "border-line bg-white"
            }`}
          >
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[0.72rem] font-bold ${
                s.tone === "bronze"
                  ? "bg-bronze-soft text-bronze-deep"
                  : "bg-blue-tint text-blue-deep"
              }`}
            >
              {s.pill}
            </span>
            <h3 className="mt-2 font-sora text-[1.08rem] font-semibold tracking-tight">
              {s.title}
            </h3>
            <p className="text-sm text-charcoal-soft">{s.body}</p>
          </Link>
        </div>
      ))}
    </div>
  );
}
