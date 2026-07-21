import Link from "next/link";

export const metadata = {
  title: "Community Guidelines — Phapano+",
  description:
    "The standards that keep the Phapano+ community safe, honest and useful for South African psychology students and professionals.",
};

const PROHIBITED: { title: string; detail: string }[] = [
  {
    title: "Harassment and bullying",
    detail:
      "Targeting, intimidating or demeaning another member has no place here.",
  },
  {
    title: "Hate speech and discrimination",
    detail:
      "Content that attacks people on the basis of race, ethnicity, religion, gender, sexual orientation, disability or any other characteristic.",
  },
  {
    title: "Sexual or exploitative content",
    detail: "Sexual content and any form of exploitative material.",
  },
  {
    title: "Threats and violence",
    detail: "Threats, incitement or encouragement of violence of any kind.",
  },
  {
    title: "Sharing private information",
    detail:
      "Publishing another person's personal details, records or correspondence without their consent.",
  },
  {
    title: "Impersonation",
    detail:
      "Pretending to be another person, institution or organisation.",
  },
  {
    title: "Fraud and application scams",
    detail:
      "Fake opportunities, fee scams, and schemes that exploit applicants.",
  },
  {
    title: "Plagiarism and academic dishonesty",
    detail:
      "Presenting others' work as your own, or facilitating academic misconduct.",
  },
  {
    title: "Misrepresenting qualifications",
    detail:
      "False claims about degrees, professional registration or HPCSA status.",
  },
  {
    title: "Unauthorised advertising",
    detail:
      "Promotional content, recruitment and selling that hasn't been approved by Phapano.",
  },
  {
    title: "False admission, funding or accreditation information",
    detail:
      "Sharing inaccurate claims about programmes, funders or accreditation as fact.",
  },
  {
    title: "Irresponsible clinical advice",
    detail:
      "Diagnosing others or offering clinical guidance the platform is not designed or authorised to provide.",
  },
  {
    title: "Intellectual property violations",
    detail:
      "Content that infringes another person's or organisation's rights.",
  },
  {
    title: "Spam",
    detail: "Repetitive, irrelevant or disruptive posting.",
  },
];

export default function CommunityGuidelinesPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 pb-20">
      <section className="pt-12">
        <h1 className="font-sora text-3xl font-bold tracking-tight">
          Community Guidelines
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-charcoal-soft">
          The Phapano+ community exists so that South African psychology
          students and professionals can support one another along the pathway
          — honestly, generously and safely. These guidelines protect that
          purpose. By posting or commenting, you agree to follow them together
          with our Terms of Use.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="font-sora text-xl font-bold tracking-tight">
          What we ask of every member
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-charcoal-soft">
          Be accurate about your experience and qualifications. Be kind in
          disagreement. Share opportunities and information you believe to be
          true, and say so when you are unsure. Remember that many members are
          navigating stressful application seasons — write the kind of post you
          would want to receive.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="font-sora text-xl font-bold tracking-tight">
          Not allowed on Phapano+
        </h2>
        <ul className="mt-3 space-y-3">
          {PROHIBITED.map((p) => (
            <li
              key={p.title}
              className="rounded-card border border-line bg-paper px-5 py-4"
            >
              <h3 className="text-sm font-bold text-charcoal">{p.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-charcoal-soft">
                {p.detail}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="font-sora text-xl font-bold tracking-tight">
          Reporting and moderation
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-charcoal-soft">
          Every post, comment and profile has a report action. Reports are
          private, reviewed by the Phapano+ team, and may lead to content
          removal, posting restrictions or suspension from the community.
          Repeated or serious violations may affect your Phapano+ account.
        </p>
      </section>

      <section className="mt-8 rounded-card border border-line bg-soft px-5 py-4">
        <p className="text-sm leading-relaxed text-charcoal-soft">
          Phapano+ is a pathway-planning and community platform. It is not a
          counselling, therapy or crisis service, and content in the community
          is not professional psychological advice. If you or someone you know
          needs urgent support, please contact a qualified professional or an
          emergency service in your area.
        </p>
      </section>

      <p className="mt-8 text-xs text-charcoal-soft">
        Version 2026-07-v1 · Questions? Visit{" "}
        <Link href="/contact" className="font-semibold text-blue-action hover:underline">
          our contact page
        </Link>
        .
      </p>
    </main>
  );
}
