import Link from "next/link";
export function PageHero({
  eyebrow,
  title,
  intro,
}: {
  eyebrow: string;
  title: string;
  intro: string;
}) {
  return (
    <section className="overflow-hidden border-b border-line bg-soft">
      <div className="mx-auto max-w-4xl px-5 py-11 sm:px-6 sm:py-16">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="mt-3 break-words font-sora text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
          {title}
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-charcoal-soft sm:text-lg">
          {intro}
        </p>
      </div>
    </section>
  );
}

export function Prose({ children }: { children: React.ReactNode }) {
  return (
    <section className="mx-auto max-w-3xl space-y-5 px-6 py-16 text-charcoal-soft [&_h2]:mb-2 [&_h2]:mt-8 [&_h2]:font-sora [&_h2]:text-xl [&_h2]:font-bold [&_h2]:tracking-tight [&_h2]:text-charcoal [&_strong]:text-charcoal">
      {children}
    </section>
  );
}


/** Auth-aware marketing CTA: signed-in users get "Open Phapano+". */
export function MarketingCTA({
  authed,
  signedOutLabel = "Log in",
  secondaryHref = "/features",
  secondaryLabel = "See all features",
}: {
  authed: boolean;
  signedOutLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
}) {
  return (
    <div className="mt-8 flex flex-wrap gap-3">
      <Link href={authed ? "/dashboard" : "/login"} className="btn-primary">
        {authed ? "Open Phapano+" : signedOutLabel}
      </Link>
      <Link href={secondaryHref} className="btn-secondary">
        {secondaryLabel}
      </Link>
    </div>
  );
}
