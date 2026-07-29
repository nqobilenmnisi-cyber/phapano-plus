import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { OrganisationPageForm } from "@/components/OrganisationPageForm";
import { createClient } from "@/lib/supabase/server";
import { isUuid } from "@/lib/community-connections";
import type { OrganisationPage } from "@/types/database";

export const metadata = { title: "Manage organisation page | Phapano+" };

export default async function EditOrganisationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!isUuid(id)) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?redirect=/app/organisations/${id}/edit`);

  const [{ data: page }, { data: admin }] = await Promise.all([
    supabase
      .from("organisation_pages")
      .select("*")
      .eq("id", id)
      .eq("status", "active")
      .maybeSingle(),
    supabase
      .from("organisation_page_admins")
      .select("role")
      .eq("page_id", id)
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);
  if (!page || !admin) notFound();

  return (
    <main className="mx-auto max-w-2xl px-6 pb-12">
      <section className="pt-7">
        <Link
          href={`/app/community/member/${id}`}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-charcoal-soft hover:text-charcoal"
        >
          ← View public page
        </Link>
        <h1 className="mt-3 font-sora text-3xl font-bold tracking-tight">
          Manage {page.name}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-charcoal-soft">
          Update the public details shown on this official Phapano page.
        </p>
      </section>
      <section className="card mt-5 p-5 sm:p-7">
        <OrganisationPageForm page={page as OrganisationPage} />
      </section>
    </main>
  );
}
