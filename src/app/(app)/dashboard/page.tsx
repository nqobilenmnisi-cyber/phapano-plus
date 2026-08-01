import Link from "next/link";
import { AppTopBar, SupportLine } from "@/components/AppChrome";
import { BottomNav } from "@/components/BottomNav";
import { MyPathway, type PathwayItem } from "@/components/MyPathway";
import { IconApplication, IconNotes } from "@/components/illustrations";
import { redirect } from "next/navigation";
import {
  getAuthState,
  getProfile,
  getSavedFunding,
  getNotifications,
  getJournalEntries,
  getDatedNotes,
  getSavedProgrammes,
} from "@/lib/queries";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { isApplicationStarted } from "@/lib/application-plan-status";
import { daysUntil, formatDateShort, greeting, firstName } from "@/lib/utils";
import {
  johannesburgDateLabel,
  johannesburgDateParts,
} from "@/lib/time";
import { demoPathway, DEMO_NOTICE } from "@/lib/demo";
import type { CareerStage } from "@/types/database";

export const metadata = { title: "Today | Phapano+" };

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
  const today = johannesburgDateParts();
  const dayOfYear = Math.floor(
    (Date.UTC(today.year, today.month - 1, today.day) -
      Date.UTC(today.year, 0, 0)) /
      86_400_000
  );
  return AFFIRMATIONS[dayOfYear % AFFIRMATIONS.length];
}

function noteStatus(dueDate: string | null): string | null {
  const days = daysUntil(dueDate);
  if (days === null) return null;
  if (days < 0) {
    const overdue = Math.abs(days);
    return `Overdue by ${overdue} ${overdue === 1 ? "day" : "days"}`;
  }
  if (days === 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  if (days <= 7) return `Due soon · ${formatDateShort(dueDate)}`;
  return `Upcoming · ${formatDateShort(dueDate)}`;
}

function priorityLabel(priority: string | null): string | null {
  if (!priority) return null;
  return `${priority.charAt(0).toUpperCase()}${priority.slice(1)} priority`;
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

  const [
    profile,
    savedFunding,
    notifications,
    recentNotes,
    datedNotes,
    savedProgrammes,
  ] =
    await Promise.all([
      getProfile(),
      getSavedFunding(),
      getNotifications(),
      getJournalEntries(),
      getDatedNotes(),
      getSavedProgrammes(),
    ]);

  // Build My Pathway from the user's real saved data and application deadlines.
  let pathwayItems: PathwayItem[] = [];

  if (isSupabaseConfigured) {
    for (const f of savedFunding) {
      pathwayItems.push({
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
    pathwayItems = demoPathway();
  }

  // Saved Apply programmes appear in My Pathway (by closing date) and count
  // toward progress. Only SAVED programmes surface here — never the whole list.
  if (isSupabaseConfigured) {
    for (const sp of savedProgrammes) {
      const applicationStarted = isApplicationStarted(sp);
      if (!sp.is_saved && !applicationStarted) continue;
      const prog = sp.programme;
      if (!prog) continue;
      const label =
        prog.qualification === "masters"
          ? `${prog.institution} · Master's`
          : `${prog.institution} · Honours`;
      pathwayItems.push({
        id: `saved-prog-${prog.id}`,
        kind: sp.is_saved ? "Programme deadline" : "Application plan",
        title: label,
        date: sp.my_deadline ?? prog.closing_date,
        verifiedAt: null,
        href: `/app/apply/programme/${prog.id}`,
        meta: sp.next_action ?? undefined,
      });
    }
  }

  // Notes that have a due date become dated reminders in My Pathway.
  if (isSupabaseConfigured) {
    for (const n of datedNotes) {
      pathwayItems.push({
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
  const programmesSaved = savedProgrammes.filter((sp) => sp.is_saved).length;
  // An application is "in progress" once the user moves it beyond Interested
  // (or marks it submitted) in their planner.
  const appsStarted = savedProgrammes.filter(isApplicationStarted).length;
  const stage = profile?.career_stage ?? null;
  const hasData =
    programmesSaved > 0 ||
    appsStarted > 0 ||
    savedFunding.length > 0 ||
    datedNotes.length > 0 ||
    Boolean(profile?.goals);

  // Only nudge when the profile is genuinely missing required fields.
  const profileIncomplete =
    isSupabaseConfigured && (!profile?.full_name || !profile?.career_stage);
  const dueSoon = pathwayItems.filter((item) => {
    const days = daysUntil(item.date);
    return days !== null && days >= 0 && days <= 7;
  }).length;

  return (
    <div className="min-h-screen pb-24">
      <AppTopBar
        unread={unread}
        profileName={profile?.full_name}
        avatarUrl={profile?.avatar_url}
      />

      <main className="mx-auto max-w-3xl px-4 sm:px-6">
        {!isSupabaseConfigured && (
          <p className="mt-3 rounded-chip border border-bronze-soft bg-bronze-soft/30 px-4 py-2.5 text-center text-xs font-semibold text-bronze-deep">
            {DEMO_NOTICE}
          </p>
        )}

        <section className="pt-7">
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-blue-action">
            {johannesburgDateLabel()} · Johannesburg time
          </p>
          <h1 className="mt-2 max-w-2xl font-sora text-[2rem] font-bold leading-tight tracking-tight sm:text-[2.35rem]">
            {name ? (
              <>
                {greeting()}, <span className="text-blue-action">{name}</span>.
              </>
            ) : (
              "Welcome back."
            )}
          </h1>
          <p className="mt-2 text-base text-charcoal-soft">
            {dueSoon > 0
              ? `${dueSoon} ${dueSoon === 1 ? "item needs" : "items need"} your attention this week.`
              : "Nothing urgent is due this week. Continue when you are ready."}
          </p>
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
                A few details help us suggest more relevant next steps.
              </p>
            </div>
            <span className="text-blue-action">→</span>
          </Link>
        )}

        <div className="mt-5 rounded-card border border-line bg-gradient-to-r from-blue-tint/55 to-white px-5 py-4 text-sm font-medium leading-relaxed text-charcoal shadow-card">
          {affirmationForToday()}
        </div>

        {/* your next steps */}
        <div className="mt-10 flex items-center gap-3 px-1">
          <IconApplication className="h-[26px] w-[26px] flex-none" />
          <h2 className="font-sora text-[1.34rem] font-bold tracking-tight">
            Continue your pathway
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

        <TodayFocusGrid
          stage={stage}
          appsStarted={appsStarted}
          savedCount={programmesSaved}
          goals={profile?.goals ?? null}
        />

        {/* My Pathway */}
        <div className="mt-5">
          <MyPathway items={pathwayItems} />
        </div>

        {/* My Notes summary. The complete editor remains on the Notes page. */}
        <div className="mt-10 flex items-center gap-3 px-1 text-[0.74rem] font-extrabold uppercase tracking-[0.16em] text-charcoal-soft">
          My Notes
          <span className="h-px flex-1 bg-divider opacity-60" />
        </div>
        <div className="relative mt-3.5 overflow-hidden rounded-card border border-[#E0D3C6] bg-gradient-to-b from-[#FBF8F4] to-white px-5 py-5 shadow-card sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-[0.72rem] font-extrabold uppercase tracking-wider text-bronze">
                <IconNotes className="h-4 w-4" />
                Private planning notes
              </div>
              <h3 className="mt-2 font-sora text-lg font-semibold tracking-tight">
                Recent notes and reminders
              </h3>
            </div>
            <Link href="/app/journal#new-note" className="btn-bronze !px-4 !py-2 text-sm">
              New note
            </Link>
          </div>

          {recentNotes.length === 0 ? (
            <div className="mt-4 rounded-card border border-dashed border-line bg-white/70 px-4 py-5 text-sm text-charcoal-soft">
              Add a note to keep a question, reminder or next step close by.
            </div>
          ) : (
            <ul className="mt-4 space-y-2">
              {recentNotes.slice(0, 3).map((note) => {
                const status = noteStatus(note.due_date);
                const priority = priorityLabel(note.priority);
                return (
                  <li
                    key={note.id}
                    className="rounded-card border border-line bg-white px-4 py-3"
                  >
                    <p className="line-clamp-2 text-sm font-semibold leading-relaxed text-charcoal">
                      {note.content}
                    </p>
                    {(status || priority) && (
                      <div className="mt-2 flex flex-wrap gap-2 text-xs font-bold">
                        {status && (
                          <span className={status.startsWith("Overdue") ? "text-bronze-deep" : "text-blue-deep"}>
                            {status}
                          </span>
                        )}
                        {priority && (
                          <span className="text-charcoal-soft">{priority}</span>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          <Link
            href="/app/journal"
            className="mt-4 inline-flex text-sm font-bold text-blue-action hover:underline"
          >
            View all notes
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

  // If the user set a current focus/goal, surface it first because it is theirs.
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
        body: "Keep board exam dates and internship requirements in My Pathway.",
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
        ? "It now appears in My Pathway with its deadline."
        : "Saving a programme adds its deadline to My Pathway.",
    href: "/app/apply",
    done: savedCount > 0,
  });

  return steps;
}

function TodayFocusGrid({
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
    <div className="mt-4 grid gap-3 sm:grid-cols-3">
      {steps.slice(0, 3).map((s) => (
        <div key={`${s.pill}-${s.title}`} className="min-w-0">
          <Link
            href={s.href}
            className={`flex h-full min-w-0 flex-col rounded-card border p-4 shadow-card transition hover:-translate-y-0.5 hover:border-[#D2E4F7] hover:shadow-lift ${
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
            <h3 className="mt-2 break-words font-sora text-base font-semibold tracking-tight">
              {s.title}
            </h3>
            <p className="text-sm text-charcoal-soft">{s.body}</p>
          </Link>
        </div>
      ))}
    </div>
  );
}
