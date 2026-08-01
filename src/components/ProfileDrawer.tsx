"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { signOut } from "@/app/(auth)/actions";
import { MemberAvatar } from "@/components/CommunityShared";
import { VerificationBadges } from "@/components/VerificationBadges";
import type { ProfileVerificationBadge } from "@/types/database";

export type DrawerIdentity = {
  id: string;
  name: string;
  avatarUrl: string | null;
  headline: string | null;
  institution: string | null;
  href: string;
  manageHref?: string;
  organisationType?: "organisation" | "initiative";
  official?: boolean;
};

export function ProfileDrawer({
  open,
  onClose,
  personalIdentity,
  managedPages,
  verificationBadges,
  loadingDetails = false,
}: {
  open: boolean;
  onClose: () => void;
  personalIdentity: DrawerIdentity;
  managedPages: DrawerIdentity[];
  verificationBadges: ProfileVerificationBadge[];
  loadingDetails?: boolean;
}) {
  const [mounted, setMounted] = useState(false);
  const dialogRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key !== "Tab") return;
      const controls = Array.from(
        dialogRef.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled])'
        ) ?? []
      );
      if (!controls.length) return;
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [onClose, open]);

  if (!mounted) return null;

  return createPortal(
    <div
      className={`fixed inset-0 z-[70] transition ${
        open ? "pointer-events-auto" : "pointer-events-none"
      }`}
      aria-hidden={!open}
    >
      <button
        type="button"
        aria-label="Close profile menu"
        className={`absolute inset-0 bg-charcoal/35 backdrop-blur-[2px] transition-opacity ${
          open ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
        tabIndex={open ? 0 : -1}
      />
      <aside
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Your profile menu"
        className={`absolute inset-y-0 left-0 flex h-[100dvh] w-[min(92vw,23rem)] min-w-0 flex-col overflow-x-hidden overflow-y-auto overscroll-contain border-r border-line bg-paper pb-[env(safe-area-inset-bottom)] shadow-2xl transition-transform duration-200 ease-out ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <p className="font-sora text-base font-bold tracking-tight">Your profile</p>
          <button
            ref={closeRef}
            type="button"
            aria-label="Close menu"
            className="grid h-11 w-11 place-items-center rounded-full text-xl text-charcoal-soft transition hover:bg-soft hover:text-charcoal"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <div className="p-5">
          <Link
            href={personalIdentity.href}
            onClick={onClose}
            className="block rounded-card border border-line bg-white p-4 shadow-sm transition hover:border-blue/40"
          >
            <div className="flex items-start gap-3">
              <MemberAvatar
                name={personalIdentity.name}
                avatarUrl={personalIdentity.avatarUrl}
                size={58}
              />
              <div className="min-w-0 pt-0.5">
                <p className="flex items-center gap-1.5 font-sora text-base font-bold text-charcoal">
                  <span className="min-w-0 break-words">{personalIdentity.name}</span>
                  <VerificationBadges badges={verificationBadges} />
                </p>
                {personalIdentity.headline && (
                  <p className="mt-1 line-clamp-2 text-sm font-semibold leading-snug text-charcoal">
                    {personalIdentity.headline}
                  </p>
                )}
                {personalIdentity.institution && (
                  <p className="mt-1 truncate text-xs text-charcoal-soft">
                    {personalIdentity.institution}
                  </p>
                )}
              </div>
            </div>
            <span className="mt-3 block text-sm font-bold text-blue-action">
              View profile
            </span>
          </Link>

          <nav aria-label="Profile shortcuts" className="mt-4 grid gap-1">
            <DrawerLink href="/app/profile" onClick={onClose}>
              Edit Passport
            </DrawerLink>
            <DrawerLink href="/app/apply" onClick={onClose}>
              Saved programmes
            </DrawerLink>
            <DrawerLink href="/app/funding" onClick={onClose}>
              Saved funding
            </DrawerLink>
            <DrawerLink href="/app/community/connections" onClick={onClose}>
              Connections
            </DrawerLink>
          </nav>

          {managedPages.length > 0 && (
            <section className="mt-6 border-t border-line pt-5">
              <h2 className="text-xs font-extrabold uppercase tracking-[0.14em] text-charcoal-soft">
                Pages you manage
              </h2>
              <div className="mt-3 space-y-3">
                {managedPages.map((page) => (
                  <div key={page.id} className="rounded-card border border-line bg-white p-3">
                    <div className="flex items-center gap-3">
                      <MemberAvatar
                        name={page.name}
                        avatarUrl={page.avatarUrl}
                        size={42}
                      />
                      <div className="min-w-0">
                        <p className="flex items-center gap-1.5 text-sm font-bold">
                          <span className="min-w-0 break-words">{page.name}</span>
                          <VerificationBadges
                            organisationType={page.organisationType}
                            officialOrganisation={page.official}
                          />
                        </p>
                        {page.headline && (
                          <p className="line-clamp-2 break-words text-xs text-charcoal-soft">
                            {page.headline}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-center text-[0.7rem] font-bold sm:text-xs">
                      <Link
                        href={page.href}
                        onClick={onClose}
                        className="inline-flex min-h-10 items-center justify-center whitespace-nowrap rounded-chip border border-line px-2.5 py-2 text-blue-deep"
                      >
                        View as member
                      </Link>
                      <Link
                        href={page.manageHref ?? page.href}
                        onClick={onClose}
                        className="inline-flex min-h-10 items-center justify-center whitespace-nowrap rounded-chip bg-blue-action px-2.5 py-2 text-white"
                      >
                        Manage page
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
          {loadingDetails && managedPages.length === 0 && (
            <p className="mt-6 border-t border-line pt-5 text-xs font-semibold text-charcoal-soft" role="status">
              Loading your page details…
            </p>
          )}
        </div>

        <div className="mt-auto border-t border-line p-5">
          <nav className="grid gap-1">
            <DrawerLink href="/app/settings" onClick={onClose}>
              Settings &amp; privacy
            </DrawerLink>
            <DrawerLink href="/contact" onClick={onClose}>
              Help &amp; feedback
            </DrawerLink>
          </nav>
          <form action={signOut} className="mt-2">
            <button
              type="submit"
              className="w-full rounded-chip px-3 py-2.5 text-left text-sm font-bold text-bronze-deep transition hover:bg-bronze-soft/40"
            >
              Sign out
            </button>
          </form>
        </div>
      </aside>
    </div>,
    document.body
  );
}

function DrawerLink({
  href,
  onClick,
  children,
}: {
  href: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="rounded-chip px-3 py-2.5 text-sm font-bold text-charcoal transition hover:bg-soft hover:text-blue-deep"
    >
      {children}
    </Link>
  );
}
