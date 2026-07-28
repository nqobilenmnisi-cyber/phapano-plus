import Link from "next/link";
import { CommunityConnections } from "@/components/CommunityConnections";
import { getConnectionHub } from "@/lib/community";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata = { title: "Connections — Phapano+" };

export default async function CommunityConnectionsPage() {
  const hub = isSupabaseConfigured
    ? await getConnectionHub()
    : { connections: [], incoming: [], outgoing: [] };

  return (
    <main className="mx-auto max-w-2xl px-6 pb-12">
      <section className="pb-5 pt-7">
        <Link
          href="/app/community"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-charcoal-soft hover:text-charcoal"
        >
          ← Back to community
        </Link>
        <h1 className="mt-3 font-sora text-3xl font-bold tracking-tight">
          Connections
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-charcoal-soft">
          Build mutual professional relationships across the psychology
          pathway. Following and connecting remain separate, so you stay in
          control of your feed.
        </p>
      </section>

      <CommunityConnections
        connections={hub.connections}
        incoming={hub.incoming}
        outgoing={hub.outgoing}
      />
    </main>
  );
}
