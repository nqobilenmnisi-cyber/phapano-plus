"use client";

import { NotificationBell } from "@/components/NotificationBell";
import { GlobalSearch } from "@/components/GlobalSearch";
import { MemberAvatar } from "@/components/CommunityShared";
import {
  ProfileDrawer,
  type DrawerIdentity,
} from "@/components/ProfileDrawer";
import type { ProfileVerificationBadge } from "@/types/database";
import Link from "next/link";
import { useState } from "react";

export function AppTopBar({
  unread,
  personalIdentity,
  managedPages = [],
  verificationBadges = [],
  profileName,
  avatarUrl,
}: {
  unread?: number;
  personalIdentity?: DrawerIdentity;
  managedPages?: DrawerIdentity[];
  verificationBadges?: ProfileVerificationBadge[];
  profileName?: string | null;
  avatarUrl?: string | null;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [drawerLoaded, setDrawerLoaded] = useState(false);
  const identity =
    personalIdentity ??
    ({
      id: "personal",
      name: profileName?.trim() || "Your profile",
      avatarUrl: avatarUrl ?? null,
      headline: null,
      institution: null,
      href: "/app/profile?section=community",
      manageHref: "/app/profile",
    } satisfies DrawerIdentity);
  const [drawerIdentity, setDrawerIdentity] = useState(identity);
  const [drawerPages, setDrawerPages] = useState(managedPages);
  const [drawerBadges, setDrawerBadges] = useState(verificationBadges);

  async function openDrawer() {
    setDrawerOpen(true);
    if (drawerLoaded || drawerLoading) return;
    setDrawerLoading(true);
    try {
      const response = await fetch("/api/profile-drawer", { cache: "no-store" });
      if (!response.ok) return;
      const data = (await response.json()) as {
        personalIdentity: DrawerIdentity;
        managedPages: DrawerIdentity[];
        verificationBadges: ProfileVerificationBadge[];
      };
      setDrawerIdentity(data.personalIdentity);
      setDrawerPages(data.managedPages);
      setDrawerBadges(data.verificationBadges);
      setDrawerLoaded(true);
    } finally {
      setDrawerLoading(false);
    }
  }
  return (
    <>
      <header className="sticky top-0 z-40 border-b border-line/80 bg-paper/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center gap-2.5 px-3 py-3 sm:gap-3 sm:px-6">
          <button
          type="button"
          aria-label="Open your profile menu"
          aria-expanded={drawerOpen}
          title="Your profile menu"
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue focus-visible:outline-offset-2"
          onClick={openDrawer}
        >
            <MemberAvatar
              name={identity.name}
              avatarUrl={identity.avatarUrl}
              size={40}
            />
          </button>
          <GlobalSearch />
          <NotificationBell unread={unread ?? 0} />
        </div>
      </header>
      <ProfileDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        personalIdentity={drawerIdentity}
        managedPages={drawerPages}
        verificationBadges={drawerBadges}
        loadingDetails={drawerLoading}
      />
    </>
  );
}

export function SupportLine() {
  return (
    <div className="mx-auto mt-10 max-w-3xl px-6 pb-4 text-center">
      <p className="text-xs leading-relaxed text-charcoal-soft">
        Phapano is a companion for your psychology journey, not a counselling or
        crisis service.
        <br />
        If you&apos;re struggling,{" "}
        <Link href="/support" className="font-bold text-blue-action hover:underline">
          find someone to talk to
        </Link>
        .
      </p>
    </div>
  );
}
