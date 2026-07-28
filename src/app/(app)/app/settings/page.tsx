import Link from "next/link";
import { signOut } from "@/app/(auth)/actions";
import {
  NotificationSettings,
  DangerZone,
} from "@/components/SettingsControls";
import { getProfile, getCurrentUser } from "@/lib/queries";
import { getBlockedAccounts } from "@/lib/community";
import { CommunityBlockedList } from "@/components/CommunityBlockedList";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { NotificationPrefs } from "@/types/database";

export const metadata = { title: "Settings — Phapano+" };

const DEFAULT_PREFS: NotificationPrefs = {
  deadlines: true,
  funding: true,
  community: true,
  product: true,
};

export default async function SettingsPage() {
  const [user, profile, blockedAccounts] = await Promise.all([
    getCurrentUser(),
    getProfile(),
    getBlockedAccounts(),
  ]);
  const prefs = profile?.notification_prefs ?? DEFAULT_PREFS;
  // Real Supabase Auth email for the signed-in user. Never a demo value.
  const email = user?.email ?? profile?.email ?? "—";

  return (
    <main className="mx-auto max-w-2xl px-6 pb-10">
      <section className="pt-7">
        <Link
          href="/app/profile"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-charcoal-soft hover:text-charcoal"
        >
          ← Back to your profile
        </Link>
        <h1 className="mt-3 font-sora text-3xl font-bold tracking-tight">
          Settings &amp; privacy
        </h1>
      </section>

      {/* notifications */}
      <section className="mt-8">
        <h2 className="mb-3 font-sora text-lg font-bold tracking-tight">
          Notifications
        </h2>
        <NotificationSettings prefs={prefs} disabled={!isSupabaseConfigured} />
      </section>

      {/* account */}
      <section className="mt-9">
        <h2 className="mb-3 font-sora text-lg font-bold tracking-tight">
          Account
        </h2>
        <div className="card divide-y divide-line">
          <Row label="Email" value={email} />
          <Row label="Account type" value="Free account" />
        </div>
        <form action={signOut} className="mt-4">
          <button type="submit" className="btn-secondary w-full">
            Sign out
          </button>
        </form>
      </section>

      {/* data & privacy */}
      <section className="mt-9">
        <h2 className="mb-3 font-sora text-lg font-bold tracking-tight">
          Your data &amp; privacy
        </h2>
        <div className="card space-y-3 p-5 text-sm text-charcoal-soft">
          <p>
            Phapano+ collects the information needed to provide your account,
            profile, saved items, notes and reminders. We use this information to
            operate the platform and personalise your psychology pathway
            experience. Phapano+ does not sell your personal information.
          </p>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <Link
              href="/privacy"
              className="inline-flex font-semibold text-blue-action hover:underline"
            >
              Read Privacy Policy →
            </Link>
            <Link
              href="/terms"
              className="inline-flex font-semibold text-blue-action hover:underline"
            >
              Read Terms of Use →
            </Link>
          </div>
        </div>
      </section>

      {/* community */}
      <section className="mt-9">
        <h2 className="mb-3 font-sora text-lg font-bold tracking-tight">
          Community
        </h2>
        <div className="card space-y-4 p-5">
          <p className="text-sm text-charcoal-soft">
            Manage what other members can see, and the accounts you&apos;ve
            blocked. The community follows our{" "}
            <Link
              href="/community-guidelines"
              className="font-semibold text-blue-action hover:underline"
            >
              Community Guidelines
            </Link>
            .
          </p>
          <Link
            href="/app/community/profile/edit"
            className="inline-flex font-semibold text-blue-action hover:underline"
          >
            Edit community profile &amp; visibility →
          </Link>
          <div>
            <h3 className="mb-2 text-sm font-bold text-charcoal">
              Blocked accounts
            </h3>
            <CommunityBlockedList blocked={blockedAccounts} />
          </div>
        </div>
      </section>

      {/* danger zone */}
      <section className="mt-9">
        <DangerZone disabled={!isSupabaseConfigured} />
      </section>
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-4">
      <span className="text-sm font-semibold text-charcoal-soft">{label}</span>
      <span className="text-right text-sm text-charcoal">{value}</span>
    </div>
  );
}
