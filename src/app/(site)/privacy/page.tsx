import { Prose } from "@/components/Marketing";
import Link from "next/link";

export const metadata = { title: "Privacy Policy — Phapano+" };

// Note: this policy still requires legal review before public launch (internal).
export default function PrivacyPage() {
  return (
    <>
      <section className="border-b border-line bg-soft">
        <div className="mx-auto max-w-4xl px-6 py-16">
          <h1 className="font-sora text-4xl font-bold tracking-tight">
            Privacy Policy
          </h1>
          <p className="mt-3 text-sm text-charcoal-soft">Version 2026-07-v1</p>
        </div>
      </section>

      <Prose>
        <h2>1. Information we collect</h2>
        <p>
          Phapano+ collects what it needs to run your account and its features:
          your account details (such as email), the profile information you
          provide, and the pathway data you choose to save — saved
          institutions, applications, funding opportunities, notes, reminders
          and preferences — along with basic technical information needed to
          operate and secure the service.
        </p>
        <p>
          If you take part in the community, we also store your community
          profile, your posts and comments, your follows, reactions and blocks,
          and a record that you accepted the Community Guidelines. When you
          submit a report, we store the report and enough context for our team
          to review it.
        </p>

        <h2>2. How we use your information</h2>
        <p>
          We use your information to provide the service, to save and display
          the pathway information you choose, to support the reminders you
          enable, to run the community and keep it safe, and to improve the
          reliability and security of the app. Phapano+ does not sell your
          personal information.
        </p>

        <h2>3. What the community can and cannot see</h2>
        <p>
          Your private Phapano Passport — applications, saved programmes,
          funding records, notes, deadlines, documents and account settings —
          is never shown in the community. Only the community profile you
          create, and the posts and comments you publish, are visible to other
          members, according to the visibility setting you choose. Reports and
          moderation records are visible only to authorised administrators, and
          the person you report is never told who reported them.
        </p>

        <h2>4. Data storage and security</h2>
        <p>
          Your information is stored using trusted infrastructure providers and
          protected by reasonable safeguards, including database-level access
          rules that restrict your private profile and notes to your
          authenticated account. No system can be guaranteed completely secure,
          but we take reasonable measures to protect your information.
        </p>

        <h2>5. Deleting your account</h2>
        <p>
          You can delete your account at any time from Settings. When you do,
          your profile, saved items, applications, notes and community posts,
          comments, reactions and follows are permanently removed.
        </p>
        <p>
          For the safety and integrity of the community, reports and moderation
          records may be kept in <b>anonymised</b> form after deletion — with
          your identity removed — so that a record of safety decisions remains.
          These retained records no longer identify you.
        </p>

        <h2>6. Contact</h2>
        <p>
          For any privacy question, or to request help with your data, please
          use our{" "}
          <Link href="/contact">contact page</Link>. This policy may be updated
          as Phapano+ develops; the version and date above will change when it
          does.
        </p>
      </Prose>
    </>
  );
}
