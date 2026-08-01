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
  const fullName = [profile?.full_name, profile?.surname]
    .filter(Boolean)
    .join(" ")
    .trim();

  return (
    <div className="min-h-screen pb-24">
      <AppTopBar
        unread={unread}
        personalIdentity={{
          id: profile?.id ?? "personal",
          name: fullName || "Your profile",
          avatarUrl: profile?.avatar_url ?? null,
          headline: profile?.bio ?? null,
          institution: profile?.university ?? null,
          href: "/app/profile?section=community",
          manageHref: "/app/profile",
        }}
      />
      {children}
      <BottomNav />
    </div>
  );
}
