import { NotificationsList } from "@/components/NotificationsList";
import { getNotifications } from "@/lib/queries";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { Notification } from "@/types/database";

export const metadata = { title: "Notifications | Phapano+" };

function demoNotifications(): Notification[] {
  const ago = (d: number) => {
    const x = new Date();
    x.setDate(x.getDate() - d);
    return x.toISOString();
  };
  return [
    {
      id: "n1",
      user_id: "demo",
      type: "deadline",
      title: "Wits MA Clinical closes in 6 days",
      body: "Your saved application deadline is approaching.",
      link: "/app/apply",
      read: false,
      created_at: ago(0),
    },
    {
      id: "n2",
      user_id: "demo",
      type: "funding",
      title: "New funding that fits you",
      body: "NRF Postgraduate Scholarship matches your stage and interests.",
      link: "/app/funding",
      read: false,
      created_at: ago(1),
    },
    {
      id: "n3",
      user_id: "demo",
      type: "system",
      title: "Welcome to Phapano+",
      body: "Your journey starts here. Save a university to begin My Pathway.",
      link: "/app/apply",
      read: true,
      created_at: ago(3),
    },
  ];
}

export default async function NotificationsPage() {
  const live = await getNotifications();
  const items = isSupabaseConfigured ? live : demoNotifications();

  return (
    <main className="mx-auto max-w-2xl px-6 pb-10">
      <section className="pt-7">
        <h1 className="font-sora text-3xl font-bold tracking-tight">
          Notifications
        </h1>
        <p className="mt-2 text-sm text-charcoal-soft">
          Updates from your saved opportunities and Community activity appear
          here.
        </p>
      </section>

      <NotificationsList initial={items} demo={!isSupabaseConfigured} />
    </main>
  );
}
