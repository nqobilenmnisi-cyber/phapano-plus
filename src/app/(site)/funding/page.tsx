import { PageHero, MarketingCTA } from "@/components/Marketing";
import { getAuthState } from "@/lib/queries";

export const metadata = { title: "Funding — Phapano+" };

export default async function Page() {
  const { authed } = await getAuthState();
  return (
    <>
      <PageHero
        eyebrow="Funding"
        title="Find funding that fits you"
        intro="Funding opportunities for psychology students are limited and often hard to track. Phapano+ helps you find verified opportunities, save what is relevant and stay aware of important deadlines."
      />
      <section className="mx-auto max-w-3xl px-6 py-16">
        <p className="text-charcoal-soft">
          When you create a free account, this section becomes personalised:
          saved opportunities, deadline reminders and your own funding tracker,
          so a bursary or scholarship that&apos;s relevant to you is easier to
          catch when it becomes available.
        </p>
        <MarketingCTA authed={authed} />
      </section>
    </>
  );
}
