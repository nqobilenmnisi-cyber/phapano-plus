import { PageHero, MarketingCTA } from "@/components/Marketing";
import { getAuthState } from "@/lib/queries";

export const metadata = { title: "Applications | Phapano+" };

export default async function Page() {
  const { authed } = await getAuthState();
  return (
    <>
      <PageHero
        eyebrow="Applications"
        title="Plan your Honours and Master's applications"
        intro="Honours and Master's applications in South African psychology can be difficult to navigate. Phapano+ helps you explore programmes, track requirements, save institutions and keep up with important deadlines."
      />
      <section className="mx-auto max-w-3xl px-6 py-16">
        <p className="text-charcoal-soft">
          With an account, you can explore programmes at universities and
          private institutions, review available requirements and guidance,
          save institutions you are considering and organise application dates.
        </p>
        <MarketingCTA authed={authed} />
      </section>
    </>
  );
}
