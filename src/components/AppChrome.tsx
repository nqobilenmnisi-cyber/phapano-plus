import { Logo } from "@/components/Logo";
import { signOut } from "@/app/(auth)/actions";
import Link from "next/link";

export function AppTopBar({
  unread,
}: {
  unread?: number;
}) {
  const today = new Date().toLocaleDateString("en-ZA", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  return (
    <header className="mx-auto flex max-w-3xl items-center justify-between px-6 pb-1.5 pt-5">
      <Logo href="/dashboard" priority />
      <div className="flex items-center gap-1.5">
        <span
          className="hidden items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1.5 text-[0.82rem] font-semibold text-charcoal-soft shadow-card sm:flex"
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-[16px] w-[16px]">
            <rect x="4" y="5" width="16" height="15" rx="2.5" stroke="#76B9F0" strokeWidth="1.7" />
            <path d="M4 9h16M8 3v4M16 3v4" stroke="#76B9F0" strokeWidth="1.7" strokeLinecap="round" />
            <circle cx="12" cy="14" r="1.6" fill="#AD795B" />
          </svg>
          {today}
        </span>
        <Link
          href="/app/notifications"
          aria-label="Notifications"
          className="relative grid h-10 w-10 place-items-center rounded-chip border border-line bg-white text-charcoal-soft transition hover:border-blue hover:text-charcoal"
        >
          {!!unread && unread > 0 && (
            <span className="absolute right-2.5 top-2.5 h-[7px] w-[7px] rounded-full border-[1.5px] border-white bg-bronze" />
          )}
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
            <path
              d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinejoin="round"
            />
            <path d="M10 20a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          </svg>
        </Link>
        <form action={signOut}>
          <button
            type="submit"
            aria-label="Sign out"
            className="grid h-10 w-10 place-items-center rounded-chip border border-line bg-white text-charcoal-soft transition hover:border-blue hover:text-charcoal"
          >
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
              <path
                d="M15 4h3a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-3M10 8l-4 4 4 4M6 12h10"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </form>
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
