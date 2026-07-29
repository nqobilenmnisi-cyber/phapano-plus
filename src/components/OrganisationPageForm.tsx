"use client";

import { useState, useTransition } from "react";
import { updateOrganisationPage } from "@/app/(app)/app/organisations/actions";
import { ProfileMediaUploader } from "@/components/ProfileMediaUploader";
import type { OrganisationPage } from "@/types/database";

export function OrganisationPageForm({
  page,
  userId,
}: {
  page: OrganisationPage;
  userId: string;
}) {
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(formData: FormData) {
    setSaved(false);
    setError(null);
    startTransition(async () => {
      const result = await updateOrganisationPage(page.id, formData);
      if ("error" in result) setError(result.error);
      else setSaved(true);
    });
  }

  return (
    <form action={submit} className="space-y-5">
      <section className="space-y-5 rounded-card border border-line bg-soft/40 p-4">
        <div>
          <p className="label">Page banner</p>
          <ProfileMediaUploader
            userId={userId}
            pageId={page.id}
            kind="banner"
            initialUrl={page.banner_url ?? null}
          />
        </div>
        <div>
          <p className="label">Page profile picture</p>
          <ProfileMediaUploader
            userId={userId}
            pageId={page.id}
            kind="avatar"
            initialUrl={page.avatar_url}
          />
        </div>
      </section>
      <div>
        <label className="label" htmlFor="name">
          Page name
        </label>
        <input
          id="name"
          name="name"
          required
          maxLength={100}
          defaultValue={page.name}
          className="input"
        />
      </div>
      <div>
        <label className="label" htmlFor="tagline">
          Tagline
        </label>
        <input
          id="tagline"
          name="tagline"
          maxLength={180}
          defaultValue={page.tagline ?? ""}
          className="input"
          placeholder="A short description of this page"
        />
      </div>
      <div>
        <label className="label" htmlFor="about">
          About
        </label>
        <textarea
          id="about"
          name="about"
          rows={6}
          maxLength={2000}
          defaultValue={page.about ?? ""}
          className="input resize-y"
        />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="focus_areas">
            Focus areas
          </label>
          <textarea
            id="focus_areas"
            name="focus_areas"
            rows={5}
            defaultValue={page.focus_areas.join("\n")}
            className="input resize-y"
            placeholder={"Psychology pathways\nMentorship"}
          />
          <p className="mt-1 text-xs text-charcoal-soft">
            Add one item per line.
          </p>
        </div>
        <div>
          <label className="label" htmlFor="services">
            What we offer
          </label>
          <textarea
            id="services"
            name="services"
            rows={5}
            defaultValue={page.services.join("\n")}
            className="input resize-y"
            placeholder={"Workshops\nResources"}
          />
          <p className="mt-1 text-xs text-charcoal-soft">
            Add one item per line.
          </p>
        </div>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="location">
            Location
          </label>
          <input
            id="location"
            name="location"
            maxLength={120}
            defaultValue={page.location ?? ""}
            className="input"
          />
        </div>
        <div>
          <label className="label" htmlFor="contact_email">
            Public contact email
          </label>
          <input
            id="contact_email"
            name="contact_email"
            type="email"
            defaultValue={page.contact_email ?? ""}
            className="input"
          />
        </div>
      </div>
      <div>
        <label className="label" htmlFor="website_url">
          Website
        </label>
        <input
          id="website_url"
          name="website_url"
          inputMode="url"
          autoCapitalize="none"
          autoCorrect="off"
          defaultValue={page.website_url ?? ""}
          className="input"
          placeholder="phapano.com"
        />
      </div>

      {error && (
        <p className="text-sm font-semibold text-bronze-deep" role="alert">
          {error}
        </p>
      )}
      {saved && (
        <p className="text-sm font-semibold text-blue-deep" role="status">
          Page saved.
        </p>
      )}
      <button type="submit" className="btn-primary w-full" disabled={pending}>
        {pending ? "Saving…" : "Save page"}
      </button>
    </form>
  );
}
