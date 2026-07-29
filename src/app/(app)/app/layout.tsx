import { AppTopBar } from "@/components/AppChrome";
import { BottomNav } from "@/components/BottomNav";
import { getNotifications, getProfile } from "@/lib/queries";

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
  const [notifications, profile] = await Promise.all([
    getNotifications(),
    getProfile(),
  ]);
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen pb-24">
      <AppTopBar
        unread={unread}
        profileName={profile?.full_name}
        avatarUrl={profile?.avatar_url}
      />
      {children}
      <BottomNav />
    </div>
  );
}
