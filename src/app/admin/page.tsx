import Link from "next/link";
import { getAdminStats } from "@/lib/admin";

export const metadata = { title: "Admin — Phapano+" };

export default async function AdminHome() {
  const stats = await getAdminStats();

  const tiles = [
    { label: "Universities", value: stats.universities, href: "/admin/universities" },
    { label: "Programmes", value: stats.programmes, href: "/admin/universities" },
    { label: "Funding", value: stats.funding, href: "/admin/funding" },
    { label: "Articles", value: stats.articles, href: "/admin/articles" },
    { label: "Members", value: stats.users, href: "/admin" },
  ];

  return (
    <div>
      <h1 className="font-sora text-2xl font-bold tracking-tight">Overview</h1>
      <p className="mt-1 text-sm text-charcoal-soft">
        The health of the information that makes Phapano trustworthy.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-5">
        {tiles.map((t) => (
          <Link
            key={t.label}
            href={t.href}
            className="card p-5 transition hover:-translate-y-0.5 hover:shadow-lift"
          >
            <div className="font-sora text-3xl font-extrabold tabular-nums text-blue-action">
              {t.value}
            </div>
            <div className="mt-1 text-xs font-semibold text-charcoal-soft">
              {t.label}
            </div>
          </Link>
        ))}
      </div>

      {/* trust health */}
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div
          className={`card p-6 ${
            stats.reviewDue > 0 ? "border-bronze-soft bg-[#FCF6F2]" : ""
          }`}
        >
          <h2 className="font-sora text-lg font-bold tracking-tight">
            Verification health
          </h2>
          {stats.reviewDue > 0 ? (
            <>
              <p className="mt-2 text-sm text-charcoal-soft">
                <b className="text-bronze-deep">{stats.reviewDue}</b> item
                {stats.reviewDue === 1 ? " is" : "s are"} due for review. Keeping
                these current is how we protect trust.
              </p>
              <Link
                href="/admin/universities"
                className="btn-bronze mt-4 !py-2 text-sm"
              >
                Review now
              </Link>
            </>
          ) : (
            <p className="mt-2 text-sm text-charcoal-soft">
              Everything is verified and current. This is the standard.
            </p>
          )}
        </div>

        <div className="card p-6">
          <h2 className="font-sora text-lg font-bold tracking-tight">
            Quick actions
          </h2>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href="/admin/universities" className="btn-secondary !py-2 text-sm">
              Add a university
            </Link>
            <Link href="/admin/funding" className="btn-secondary !py-2 text-sm">
              Add funding
            </Link>
            <Link href="/admin/articles" className="btn-secondary !py-2 text-sm">
              Write an article
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
