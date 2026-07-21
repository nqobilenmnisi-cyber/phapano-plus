import Link from "next/link";

export const metadata = {
  title: "Terms of Use — Phapano+",
  description:
    "The terms that govern your use of Phapano+, the psychology pathway platform for South African students and professionals.",
};

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-8">
      <h2 className="font-sora text-xl font-bold tracking-tight">{title}</h2>
      <div className="mt-2 space-y-3 text-sm leading-relaxed text-charcoal-soft">
        {children}
      </div>
    </section>
  );
}

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 pb-20">
      <section className="pt-12">
        <h1 className="font-sora text-3xl font-bold tracking-tight">
          Terms of Use
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-charcoal-soft">
          Version 2026-07-v1. These terms are written in plain language on
          purpose — they are the agreement between you and Phapano, the
          non-profit organisation behind Phapano+ (&quot;we&quot;,
          &quot;us&quot;), for your use of the Phapano+ platform.
        </p>
      </section>

      <Section title="1. Accepting these terms">
        <p>
          By creating an account or using Phapano+, you accept these Terms of
          Use, our <Link href="/privacy" className="font-semibold text-blue-action hover:underline">Privacy Policy</Link> and, when you take part in the
          community, our <Link href="/community-guidelines" className="font-semibold text-blue-action hover:underline">Community Guidelines</Link>. If you do not agree,
          please do not use the platform.
        </p>
      </Section>

      <Section title="2. Eligibility and your account">
        <p>
          Phapano+ supports South African psychology students and
          professionals. You are responsible for the accuracy of the
          information on your account, for keeping your password confidential,
          and for activity that happens under your account. Tell us promptly
          through the contact page if you believe your account has been
          accessed without your permission.
        </p>
      </Section>

      <Section title="3. Permitted use">
        <p>
          You may use Phapano+ to plan your psychology pathway, explore
          programmes and funding, keep notes, and take part in the community.
          You agree not to misuse the platform — including attempting to
          access other people&apos;s data, disrupting the service, scraping
          content at scale, misrepresenting who you are, or using Phapano+
          for anything unlawful.
        </p>
      </Section>

      <Section title="4. Your content in the community">
        <p>
          You own the content you post. So that the platform can work, you
          give us a non-exclusive, royalty-free licence to store, display and
          distribute your community content within Phapano+ for as long as it
          remains on the platform. You can edit or delete your own posts and
          comments at any time.
        </p>
        <p>
          You are responsible for what you post. Content must follow the
          Community Guidelines, which prohibit harassment, hate, sexual or
          exploitative content, threats, privacy violations, impersonation,
          scams, false qualification claims, plagiarism, unauthorised
          advertising, false admission or funding information, irresponsible
          clinical advice, intellectual-property violations and spam.
        </p>
      </Section>

      <Section title="5. Reporting, moderation and enforcement">
        <p>
          Every post, comment and community profile can be reported. We review
          reports and may remove content, restrict posting, suspend a
          community profile or, for serious or repeated violations, terminate
          an account. Moderation decisions are recorded internally. If you
          believe a decision was made in error, you can contact us through
          the contact page and we will look at it again.
        </p>
      </Section>

      <Section title="6. Intellectual property">
        <p>
          The Phapano+ name, design and platform content we create belong to
          Phapano. University, programme and funder names belong to their
          respective institutions; Phapano+ is independent and not endorsed
          by them.
        </p>
      </Section>

      <Section title="7. Pathway, programme and funding information">
        <p>
          We work to keep programme, funding and pathway information accurate
          and we show verification dates where available — but requirements,
          dates and eligibility change and mistakes are possible. Always
          confirm details on the official university or funder website before
          acting. Phapano+ does not guarantee admission to any programme,
          funding, employment, or professional registration, and using the
          platform does not create any advisory relationship.
        </p>
      </Section>

      <Section title="8. Phapano+ is not a counselling or crisis service">
        <p>
          Phapano+ is a pathway-planning and community platform. It does not
          provide counselling, therapy, psychological assessment or crisis
          support, and community content is not professional advice. If you
          need urgent support, contact a qualified professional or the crisis
          resources listed on our support page.
        </p>
      </Section>

      <Section title="9. Third-party links">
        <p>
          Phapano+ links to external websites such as universities and
          funders. We are not responsible for their content, availability or
          privacy practices.
        </p>
      </Section>

      <Section title="10. Ending your account">
        <p>
          You can delete your account at any time from Settings. Deletion is
          permanent: your profile, applications, saved items, notes and
          community content are removed. Reports and moderation records may
          be retained in anonymised form — with your identity removed — where
          this is needed for the safety and integrity of the platform. We may
          suspend or terminate accounts that seriously or repeatedly violate
          these terms or the Community Guidelines.
        </p>
      </Section>

      <Section title="11. Availability, disclaimers and liability">
        <p>
          Phapano+ is provided as a free platform during its beta, on an
          &quot;as available&quot; basis. We do not promise uninterrupted or
          error-free operation. To the extent permitted by South African law,
          Phapano is not liable for indirect losses arising from your use of
          the platform — including decisions made in reliance on programme,
          funding or community information. Nothing in these terms limits
          rights you have under the Consumer Protection Act or other laws
          that cannot be excluded.
        </p>
      </Section>

      <Section title="12. Changes">
        <p>
          We may update the platform and these terms as Phapano+ develops. If
          the terms change materially, we will show the new version and its
          date here, and continued use after a change means you accept the
          updated terms.
        </p>
      </Section>

      <Section title="13. Governing law and contact">
        <p>
          These terms are governed by the laws of the Republic of South
          Africa, and South African courts have jurisdiction over any
          dispute. Questions about these terms can be sent through our{" "}
          <Link href="/contact" className="font-semibold text-blue-action hover:underline">contact page</Link>.
        </p>
      </Section>
    </main>
  );
}
