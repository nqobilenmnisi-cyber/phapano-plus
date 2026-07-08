import { PageHero } from "@/components/Marketing";
import { ContactForm } from "@/components/ContactForm";

export const metadata = { title: "Contact — Phapano+" };

export default function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow="Contact"
        title="We'd love to hear from you"
        intro="Whether you have a question, want to report incorrect information, suggest a funding opportunity, explore a partnership, or share feedback, reach out."
      />
      <section className="mx-auto max-w-2xl px-6 py-16">
        <ContactForm />
      </section>
    </>
  );
}
