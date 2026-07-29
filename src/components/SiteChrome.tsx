import Link from "next/link";
import { Logo } from "@/components/Logo";

const navLinks = [
  { href: "/about", label: "About" },
  { href: "/features", label: "Features" },
  { href: "/contact", label: "Contact" },
];

export function SiteHeader({ authed = false }: { authed?: boolean }) {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
        {/* Signed-in users land on the app home; signed-out on the public home. */}
        <Logo href={authed ? "/dashboard" : "/"} />
        <nav className="hidden items-center gap-7 md:flex">
          {navLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm font-semibold text-charcoal-soft transition hover:text-charcoal"
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {authed ? (
            <Link href="/dashboard" className="btn-primary !px-4 !py-2 text-sm">
              Open Phapano+
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="btn-primary !px-3.5 !py-2 text-sm sm:!px-4"
              >
                Log in
              </Link>
              <Link href="/signup" className="btn-secondary !px-3.5 !py-2 text-sm sm:!px-4">
                Create account
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export function SiteFooter({ authed = false }: { authed?: boolean }) {
  return (
    <footer className="mt-24 border-t border-line bg-soft">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <Logo href={authed ? "/dashboard" : "/"} />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-charcoal-soft">
              Psychology pathway support for South African students.
            </p>
          </div>
          <div>
            <h4 className="font-sora text-sm font-bold">Explore</h4>
            <ul className="mt-3 space-y-2 text-sm text-charcoal-soft">
              <li><Link href="/features" className="hover:text-charcoal">Features</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-sora text-sm font-bold">Phapano</h4>
            <ul className="mt-3 space-y-2 text-sm text-charcoal-soft">
              <li><Link href="/about" className="hover:text-charcoal">About</Link></li>
              <li><Link href="/contact" className="hover:text-charcoal">Contact</Link></li>
              <li><Link href="/support" className="hover:text-charcoal">Support resources</Link></li>
              {authed ? (
                <li><Link href="/dashboard" className="hover:text-charcoal">Open Phapano+</Link></li>
              ) : (
                <li><Link href="/signup" className="hover:text-charcoal">Create account</Link></li>
              )}
            </ul>
            <h4 className="mt-6 font-sora text-sm font-bold">Legal</h4>
            <ul className="mt-3 space-y-2 text-sm text-charcoal-soft">
              <li><Link href="/terms" className="hover:text-charcoal">Terms of Use</Link></li>
              <li><Link href="/privacy" className="hover:text-charcoal">Privacy Policy</Link></li>
              <li><Link href="/community-guidelines" className="hover:text-charcoal">Community Guidelines</Link></li>
            </ul>
          </div>
        </div>

        {/* Crisis support — verified, with source and last-checked date. */}
        <div className="mt-12 rounded-card border border-line bg-white px-5 py-4 text-xs leading-relaxed text-charcoal-soft">
          <b className="font-sora text-charcoal">Need urgent support?</b> Phapano+
          is not a counselling or crisis service. If you are in immediate danger
          or need urgent mental health support, please contact a verified crisis
          line. In South Africa: SADAG 24-hour Suicide Crisis Helpline{" "}
          <a href="tel:0800567567" className="font-semibold text-blue-action">0800 567 567</a>{" "}
          (or SMS <a href="sms:31393" className="font-semibold text-blue-action">31393</a>),
          LifeLine SA{" "}
          <a href="tel:0861322322" className="font-semibold text-blue-action">0861 322 322</a>,
          or emergency services{" "}
          <a href="tel:112" className="font-semibold text-blue-action">112</a>.{" "}
          <Link href="/support" className="font-semibold text-blue-action hover:underline">
            More support resources
          </Link>
          . <span className="opacity-70">Source: SADAG (sadag.org). Last checked 30 June 2026.</span>
        </div>

        <div className="mt-8 flex flex-col gap-2 border-t border-line pt-6 text-xs text-charcoal-soft sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Phapano - The Difference</p>
          <p>Psychology pathway support for South African students.</p>
        </div>
      </div>
    </footer>
  );
}
