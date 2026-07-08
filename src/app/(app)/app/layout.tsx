import { AppTopBar } from "@/components/AppChrome";
import { BottomNav } from "@/components/BottomNav";
import { getNotifications } from "@/lib/queries";

/**
 * Layout for authenticated app pages. Onboarding has its own minimal layout,
 * so we render chrome here for everything else. Route protection is handled by
 * middleware; this layout only assembles the shell.
 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const notifications = await getNotifications();
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen pb-24">
      <AppTopBar unread={unread} />
      {children}
      <BottomNav />
    </div>
  );
}
