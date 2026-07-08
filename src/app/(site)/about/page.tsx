import { PageHero, Prose } from "@/components/Marketing";
import Link from "next/link";
import { getAuthState } from "@/lib/queries";

export const metadata = { title: "About — Phapano+" };


export default async function AboutPage() {
  const { authed } = await getAuthState();
  return (
    <>
      <PageHero
        eyebrow="About Phapano+"
        title="Built for the psychology journey"
        intro="Phapano+ brings psychology applications, funding, planning, reminders and trusted guidance into one place, so you can navigate each step with clarity."
      />
      <Prose>
        <p>
          Phapano+ is the digital platform built by Phapano. Phapano is the
          broader organisation and movement working to make the psychology
          journey in South Africa more accessible, connected and fair. Phapano+
          is where that work becomes a practical, everyday tool you can use.
        </p>
        <h2>Why Phapano+ exists</h2>
        <p>
          Every year, students spend countless hours searching through
          university websites, group chats, PDFs and social media just to answer
          simple questions. Where can I apply? When do applications open? What
          are the requirements? How do I find funding? The information exists,
          but it is scattered. Phapano+ exists to bring it together into one
          trusted place.
        </p>
        <h2>What Phapano+ does</h2>
        <p>
          Phapano+ helps you explore psychology programmes across South Africa,
          track your Honours and Master&apos;s applications, discover funding you
          qualify for, and stay ahead of deadlines, all alongside guidance
          written for where you are in your pathway. It is a practical academic
          and career companion, not another inbox to manage.
        </p>
        <h2>How we treat information</h2>
        <p>
          The value of Phapano+ depends on the quality of its information. We
          show where information comes from and when it was last checked, and we
          always point you to the official university or funder to confirm the
          details. Where something is not yet verified or available, we say so.
        </p>
        <p>
          To learn more about the wider Phapano organisation and movement, visit
          the main Phapano website. Phapano+ is here to complement that work and
          support you, one step at a time.
        </p>
        <p>
          <Link href={authed ? "/dashboard" : "/signup"} className="font-semibold text-blue-action hover:underline">
            {authed ? "Open Phapano+ →" : "Create your free account →"}
          </Link>
        </p>
      </Prose>
    </>
  );
}
