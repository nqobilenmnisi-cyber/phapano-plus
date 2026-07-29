import type { PathwayItem } from "@/components/MyPathway";

export const DEMO_NOTICE =
  "Demo mode · sample data shown until Supabase is connected";

/** Sample pathway items used only in placeholder mode for preview. */
export function demoPathway(): PathwayItem[] {
  const today = new Date();
  const plus = (n: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() + n);
    return d.toISOString().slice(0, 10);
  };
  const minus = (n: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() - n);
    return d.toISOString().slice(0, 10);
  };

  return [
    {
      id: "demo-1",
      kind: "Application closes",
      title: "Wits, MA Clinical Psychology",
      date: plus(6),
      verifiedAt: minus(1),
      href: "/app/apply",
    },
    {
      id: "demo-2",
      kind: "Funding opportunity",
      title: "NRF Postgraduate, Master's bursary",
      date: plus(12),
      verifiedAt: minus(2),
      href: "/app/funding",
      meta: "full cost",
    },
    {
      id: "demo-3",
      kind: "Selection week",
      title: "UJ, Counselling Psychology interviews",
      date: plus(23),
      verifiedAt: minus(3),
      href: "/app/apply",
    },
  ];
}
