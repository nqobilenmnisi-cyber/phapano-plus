import Link from "next/link";
import { Logo } from "@/components/Logo";
import { signOut } from "@/app/(auth)/actions";
import { requireAdmin } from "@/lib/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";

const navItems = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/universities", label: "Universities" },
  { href: "/admin/funding", label: "Funding" },
  { href: "/admin/articles", label: "Articles" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Enforces admin access (or demo preview). Redirects handled inside.
  await requireAdmin();

  return (
    <div className="min-h-screen bg-soft">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
          <div className="flex items-center gap-3">
            <Logo href="/admin" />
            <span className="rounded-full bg-charcoal px-2.5 py-0.5 text-[0.68rem] font-bold uppercase tracking-wider text-white">
              Staff
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="text-sm font-semibold text-charcoal-soft hover:text-charcoal"
            >
              Back to app
            </Link>
            <form action={signOut}>
              <button className="text-sm font-semibold text-charcoal-soft hover:text-charcoal">
                Sign out
              </button>
            </form>
          </div>
        </div>
        <nav className="mx-auto flex max-w-6xl gap-1 px-4">
          {navItems.map((it) => (
            <Link
              key={it.href}
              href={it.href}
              className="border-b-2 border-transparent px-4 py-2.5 text-sm font-semibold text-charcoal-soft transition hover:text-charcoal"
            >
              {it.label}
            </Link>
          ))}
        </nav>
      </header>

      {!isSupabaseConfigured && (
        <div className="mx-auto max-w-6xl px-6 pt-4">
          <p className="rounded-chip border border-bronze-soft bg-bronze-soft/30 px-4 py-2.5 text-center text-xs font-semibold text-bronze-deep">
            Admin preview · connect Supabase and set your profile role to
            &lsquo;admin&rsquo; to manage live content
          </p>
        </div>
      )}

      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
