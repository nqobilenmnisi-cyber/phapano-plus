import { NextResponse } from "next/server";
import {
  getManagedOrganisationPages,
  getMyCommunityProfile,
  getMyProfileVerifications,
} from "@/lib/community";
import { getCurrentUser, getProfile } from "@/lib/queries";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const [profile, communityProfile, managedPages, verificationBadges] =
    await Promise.all([
      getProfile(),
      getMyCommunityProfile(),
      getManagedOrganisationPages(),
      getMyProfileVerifications(),
    ]);
  const fullName = [profile?.full_name, profile?.surname]
    .filter(Boolean)
    .join(" ")
    .trim();

  return NextResponse.json(
    {
      personalIdentity: {
        id: profile?.id ?? user.id,
        name: fullName || communityProfile?.display_name || "Your profile",
        avatarUrl: profile?.avatar_url ?? communityProfile?.avatar_url ?? null,
        headline: communityProfile?.headline ?? profile?.bio ?? null,
        institution: profile?.university ?? null,
        href: "/app/profile?section=community",
        manageHref: "/app/profile",
      },
      managedPages: managedPages.map((page) => ({
        id: page.id,
        name: page.name,
        avatarUrl: page.avatar_url,
        headline: page.tagline,
        institution: null,
        href: `/app/community/member/${page.id}`,
        manageHref: `/app/organisations/${page.id}/edit`,
        organisationType: page.page_type,
        official: page.is_official,
      })),
      verificationBadges,
    },
    { headers: { "Cache-Control": "private, no-store" } }
  );
}
