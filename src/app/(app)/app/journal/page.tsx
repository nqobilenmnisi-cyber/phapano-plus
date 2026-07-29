import { JournalEntries } from "@/components/JournalEntries";
import { SupportLine } from "@/components/AppChrome";
import { getJournalEntries } from "@/lib/queries";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata = { title: "My Notes | Phapano+" };

export default async function JournalPage() {
  const entries = await getJournalEntries();

  return (
    <main className="mx-auto max-w-2xl px-6">
      <section className="pt-7">
        <h1 className="font-sora text-3xl font-bold tracking-tight">
          My notes
        </h1>
        <p className="mt-2 text-charcoal-soft">
          Keep private notes, reminders and next steps for your psychology
          applications, funding searches and pathway planning.
        </p>
        <span className="mt-3.5 inline-flex items-center gap-1.5 rounded-full bg-soft px-3.5 py-1.5 text-xs font-bold text-charcoal-soft">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
            <rect x="5" y="11" width="14" height="9" rx="2" stroke="currentColor" strokeWidth="1.8" />
            <path d="M8 11V8a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="1.8" />
          </svg>
          Private to you. Never used to profile you.
        </span>
      </section>

      <JournalEntries initial={entries} demo={!isSupabaseConfigured} />

      <SupportLine />
    </main>
  );
}
