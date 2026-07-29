import { PageHero, MarketingCTA } from "@/components/Marketing";
import { getAuthState } from "@/lib/queries";

export const metadata = { title: "Funding | Phapano+" };

export default async function Page() {
  const { authed } = await getAuthState();
  return (
    <>
      <PageHero
        eyebrow="Funding"
        title="Explore psychology funding"
        intro="Browse bursaries, scholarships and other funding opportunities that may be relevant to different stages of the psychology pathway."
      />
      <section className="mx-auto max-w-3xl px-6 py-16">
        <p className="text-charcoal-soft">
          With an account, you can save opportunities you want to revisit and
          keep their available closing dates alongside your other pathway
          planning.
        </p>
        <MarketingCTA authed={authed} />
      </section>
    </>
  );
}
