import { Prose } from "@/components/Marketing";

export const metadata = { title: "Privacy Policy — Phapano+" };

// Note: this policy still requires legal review before launch (internal).
export default function PrivacyPage() {
  return (
    <>
      <section className="border-b border-line bg-soft">
        <div className="mx-auto max-w-4xl px-6 py-16">
          <h1 className="font-sora text-4xl font-bold tracking-tight">
            Privacy Policy
          </h1>
        </div>
      </section>

      <Prose>
        <h2>1. Information we collect</h2>
        <p>
          Phapano+ collects the information needed to create and manage your
          account and provide the app&apos;s features. This includes your
          account details, profile information, saved institutions,
          applications, funding opportunities, notes, reminders and preferences,
          and basic technical information required to operate and secure the
          service.
        </p>

        <h2>2. How we use your information</h2>
        <p>
          We use your information to provide the service, to personalise your
          psychology pathway experience, to save and display the information you
          choose, to support the reminders you enable, and to improve the
          reliability and security of the app. Phapano+ does not sell your
          personal information.
        </p>

        <h2>3. Data storage and security</h2>
        <p>
          Your information is stored using trusted infrastructure providers and
          protected by reasonable safeguards. Access to your private profile and
          notes is restricted to your authenticated account. No system can be
          guaranteed to be completely secure, but we take reasonable measures to
          protect your information.
        </p>
      </Prose>
    </>
  );
}
