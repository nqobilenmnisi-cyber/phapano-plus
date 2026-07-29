import { PageHero, MarketingCTA } from "@/components/Marketing";
import { getAuthState } from "@/lib/queries";

export const metadata = { title: "Learn | Phapano+" };

export default async function Page() {
  const { authed } = await getAuthState();
  return (
    <>
      <PageHero
        eyebrow="Learn"
        title="Psychology pathway resources in one place"
        intro="Access practical videos, guides and workshop resources from Phapano to help you understand psychology applications, requirements, interviews, selection processes and next steps."
      />
      <section className="mx-auto max-w-3xl px-6 py-16">
        <p className="text-charcoal-soft">
          Phapano shares practical guidance through videos, workshops and
          written guides. When you create a free account, your saved resources,
          guides and reminders come together with the rest of your pathway,
          including links to Phapano&apos;s YouTube videos, workshop recordings
          and application explainers as they&apos;re added.
        </p>
        <MarketingCTA authed={authed} secondaryLabel="See all features" />
      </section>
    </>
  );
}
