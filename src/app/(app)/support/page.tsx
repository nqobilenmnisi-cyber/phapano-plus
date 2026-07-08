import Link from "next/link";
import { Logo } from "@/components/Logo";

export const metadata = { title: "Support — Phapano+" };

const resources = [
  {
    name: "SADAG Suicide Crisis Helpline",
    detail: "0800 567 567",
    note: "Toll-free, 24 hours",
    href: "tel:0800567567",
  },
  {
    name: "SADAG (general counselling line)",
    detail: "011 234 4837",
    note: "Mental health support and referrals",
    href: "tel:0112344837",
  },
  {
    name: "SADAG SMS line",
    detail: "31393",
    note: "If you'd rather not call",
    href: "sms:31393",
  },
  {
    name: "LifeLine South Africa",
    detail: "0861 322 322",
    note: "National counselling line, 24 hours",
    href: "tel:0861322322",
  },
  {
    name: "Emergency services",
    detail: "10111 (police) · 10177 (ambulance)",
    note: "For immediate danger",
    href: "tel:10111",
  },
];

export default function SupportPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <div className="mb-8">
        <Logo href="/dashboard" />
      </div>

      <h1 className="font-sora text-3xl font-bold tracking-tight">
        Crisis and support resources
      </h1>
      <p className="mt-3 text-charcoal-soft">
        Phapano+ is not a counselling or crisis service. If you are in immediate
        danger or need urgent mental health support, please contact a verified
        service below.
      </p>

      <div className="mt-8 space-y-3">
        {resources.map((r) => (
          <a
            key={r.name}
            href={r.href}
            className="card flex items-center justify-between gap-4 p-5 transition hover:border-blue hover:shadow-lift"
          >
            <div>
              <div className="font-sora font-semibold">{r.name}</div>
              <div className="text-sm text-charcoal-soft">{r.note}</div>
            </div>
            <div className="whitespace-nowrap font-sora text-lg font-bold text-blue-action">
              {r.detail}
            </div>
          </a>
        ))}
      </div>

      <p className="mt-6 text-xs text-charcoal-soft">
        Source: SADAG (sadag.org). Last checked: 30 June 2026.
      </p>

      <Link href="/dashboard" className="btn-secondary mt-8 inline-flex">
        Back to Phapano+
      </Link>
    </div>
  );
}
