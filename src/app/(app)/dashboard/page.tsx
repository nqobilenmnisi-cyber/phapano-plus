import Link from "next/link";
import { AppTopBar, SupportLine } from "@/components/AppChrome";
import { BottomNav } from "@/components/BottomNav";
import { MyPathway, type PathwayItem } from "@/components/MyPathway";
import { IconNotes } from "@/components/illustrations";
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
import {
  careerStageLabels,
  daysUntil,
  formatDateShort,
  greeting,
  firstName,
} from "@/lib/utils";
import {
  johannesburgDateLabel,
  johannesburgTimeLabel,
} from "@/lib/time";
import { demoPathway, DEMO_NOTICE } from "@/lib/demo";

export const metadata = { title: "Today | Phapano+" };

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
  const activePlan = savedProgrammes.find(
    (programme) => isApplicationStarted(programme) && programme.programme
  );
  const stageLabel =
    profile?.career_stage === "other"
      ? profile.career_stage_other || "Other pathway stage"
      : profile?.career_stage
        ? careerStageLabels[profile.career_stage]
        : "Pathway stage not set";
  const continueCard = activePlan?.programme
    ? {
        eyebrow: "Application in progress",
        title: `Continue ${activePlan.programme.institution}`,
        body:
          activePlan.next_action ||
          "Return to your application plan and continue from your latest stage.",
        href: `/app/apply/programme/${activePlan.programme.id}`,
        action: "Continue application",
      }
    : programmesSaved > 0
      ? {
          eyebrow: "Saved programmes",
          title: "Review the programmes you saved",
          body: "Compare your saved options and start an application plan when you are ready.",
          href: "/app/apply",
          action: "Open Apply",
        }
      : savedFunding.length > 0
        ? {
            eyebrow: "Saved funding",
            title: "Return to your funding shortlist",
            body: "Review deadlines and eligibility for the opportunities you saved.",
            href: "/app/funding",
            action: "Open Funding",
          }
        : {
            eyebrow: "Start your pathway",
            title: "Build your first shortlist",
            body: "Use Apply to save a programme and begin tracking your progress.",
            href: "/app/apply",
            action: "Go to Apply",
          };

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
          <p className="inline-flex items-center gap-2 rounded-full border border-blue/35 bg-white px-3.5 py-2 text-xs font-bold text-blue-deep shadow-sm">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-4 w-4">
              <path d="M6 3v3M18 3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v14H4V6a1 1 0 0 1 1-1Z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>{johannesburgDateLabel()}</span>
            <span aria-hidden="true" className="h-1 w-1 rounded-full bg-bronze" />
            <time>{johannesburgTimeLabel()}</time>
          </p>
          <h1 className="mt-4 max-w-2xl font-sora text-[2rem] font-bold leading-tight tracking-tight sm:text-[2.35rem]">
            {name ? (
              <>
                {greeting()}, <span className="text-blue-action">{name}</span>.
              </>
            ) : (
              "Welcome back."
            )}
          </h1>
          <p className="mt-2 text-sm font-semibold text-charcoal-soft">
            {stageLabel}
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

        <section className="card mt-7 overflow-hidden border-blue/25">
          <div className="grid grid-cols-3 divide-x divide-line border-b border-line bg-white py-4">
            <DashboardMetric value={programmesSaved} label="Saved programmes" />
            <DashboardMetric value={appsStarted} label="Applications active" />
            <DashboardMetric value={savedFunding.length} label="Funding saved" />
          </div>
          <div className="bg-gradient-to-br from-blue-tint/65 to-white p-5 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="min-w-0">
                <p className="text-[0.7rem] font-extrabold uppercase tracking-[0.15em] text-blue-action">
                  {continueCard.eyebrow}
                </p>
                <h2 className="mt-1 font-sora text-xl font-bold tracking-tight">
                  {continueCard.title}
                </h2>
                <p className="mt-1 max-w-xl text-sm leading-relaxed text-charcoal-soft">
                  {continueCard.body}
                </p>
                {dueSoon > 0 && (
                  <p className="mt-3 text-xs font-bold text-bronze-deep">
                    {dueSoon} {dueSoon === 1 ? "deadline needs" : "deadlines need"} attention this week.
                  </p>
                )}
              </div>
              <Link href={continueCard.href} className="btn-primary flex-none">
                {continueCard.action}
              </Link>
            </div>
          </div>
        </section>

        {/* My Pathway */}
        <div id="pathway" className="mt-6 scroll-mt-24">
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

function DashboardMetric({ value, label }: { value: number; label: string }) {
  return (
    <div className="min-w-0 px-2 text-center">
      <span className="block font-sora text-xl font-bold tabular-nums text-charcoal">
        {value}
      </span>
      <span className="mt-1 block text-[0.66rem] font-semibold leading-tight text-charcoal-soft sm:text-xs">
        {label}
      </span>
    </div>
  );
}
