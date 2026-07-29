import { NotificationBell } from "@/components/NotificationBell";
import { GlobalSearch } from "@/components/GlobalSearch";
import { MemberAvatar } from "@/components/CommunityShared";
import Link from "next/link";

export function AppTopBar({
  unread,
  profileName,
  avatarUrl,
}: {
  unread?: number;
  profileName?: string | null;
  avatarUrl?: string | null;
}) {
  const name = profileName?.trim() || "Your profile";
  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-paper/95 backdrop-blur-xl">
      <div className="mx-auto flex max-w-3xl items-center gap-2.5 px-3 py-3 sm:gap-3 sm:px-6">
        <Link
          href="/app/profile"
          aria-label="Open your profile"
          title="Your profile"
          className="shrink-0 rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue focus-visible:outline-offset-2"
        >
          <MemberAvatar name={name} avatarUrl={avatarUrl ?? null} size={40} />
        </Link>
        <GlobalSearch />
        <NotificationBell unread={unread ?? 0} />
      </div>
    </header>
  );
}

export function SupportLine() {
  return (
    <div className="mx-auto mt-10 max-w-3xl px-6 pb-4 text-center">
      <p className="text-xs leading-relaxed text-charcoal-soft">
        Phapano is a companion for your psychology journey, not a counselling or
        crisis service.
        <br />
        If you&apos;re struggling,{" "}
        <Link href="/support" className="font-bold text-blue-action hover:underline">
          find someone to talk to
        </Link>
        .
      </p>
    </div>
  );
}
