import { AppTopBar } from "@/components/AppChrome";
import { BottomNav } from "@/components/BottomNav";
import {
  getManagedOrganisationPages,
  getMyCommunityProfile,
  getMyProfileVerifications,
} from "@/lib/community";
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
  const [notifications, profile, communityProfile, managedPages, verificationBadges] = await Promise.all([
    getNotifications(),
    getProfile(),
    getMyCommunityProfile(),
    getManagedOrganisationPages(),
    getMyProfileVerifications(),
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
          name: fullName || communityProfile?.display_name || "Your profile",
          avatarUrl: profile?.avatar_url ?? communityProfile?.avatar_url ?? null,
          headline: communityProfile?.headline ?? profile?.bio ?? null,
          institution: profile?.university ?? null,
          href: "/app/profile?section=community",
          manageHref: "/app/profile",
        }}
        managedPages={managedPages.map((page) => ({
          id: page.id,
          name: page.name,
          avatarUrl: page.avatar_url,
          headline: page.tagline,
          institution: null,
          href: `/app/community/member/${page.id}`,
          manageHref: `/app/organisations/${page.id}/edit`,
          organisationType: page.page_type,
          official: page.is_official,
        }))}
        verificationBadges={verificationBadges}
      />
      {children}
      <BottomNav />
    </div>
  );
}
