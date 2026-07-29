"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  normaliseOrganisationList,
  normaliseOrganisationUrl,
  validPublicEmail,
} from "@/lib/organisations";
import { isUuid } from "@/lib/community-connections";

export type OrganisationActionResult = { ok: true } | { error: string };

export async function updateOrganisationPage(
  pageId: string,
  formData: FormData
): Promise<OrganisationActionResult> {
  if (!isUuid(pageId)) return { error: "This page is not available." };

  const name = String(formData.get("name") ?? "").trim();
  const tagline = String(formData.get("tagline") ?? "").trim();
  const about = String(formData.get("about") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim();
  const contactEmail = String(formData.get("contact_email") ?? "")
    .trim()
    .toLocaleLowerCase("en-ZA");
  const websiteInput = String(formData.get("website_url") ?? "").trim();
  const websiteUrl = normaliseOrganisationUrl(websiteInput);

  if (name.length < 2 || name.length > 100)
    return { error: "The page name must be between 2 and 100 characters." };
  if (tagline.length > 180)
    return { error: "The tagline can be up to 180 characters." };
  if (about.length > 2_000)
    return { error: "The About section can be up to 2,000 characters." };
  if (location.length > 120)
    return { error: "The location can be up to 120 characters." };
  if (!validPublicEmail(contactEmail))
    return { error: "Enter a valid public contact email address." };
  if (websiteInput && !websiteUrl)
    return { error: "Enter a valid website address." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please log in again to manage this page." };

  const { data: admin } = await supabase
    .from("organisation_page_admins")
    .select("role")
    .eq("page_id", pageId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!admin)
    return { error: "You do not have permission to manage this page." };

  const { error } = await supabase
    .from("organisation_pages")
    .update({
      name,
      tagline: tagline || null,
      about: about || null,
      focus_areas: normaliseOrganisationList(formData.get("focus_areas")),
      services: normaliseOrganisationList(formData.get("services")),
      location: location || null,
      contact_email: contactEmail || null,
      website_url: websiteUrl,
      updated_at: new Date().toISOString(),
    })
    .eq("id", pageId);

  if (error)
    return {
      error: "We could not save this page. Please try again in a moment.",
    };

  revalidatePath(`/app/organisations/${pageId}/edit`);
  revalidatePath(`/app/community/member/${pageId}`);
  revalidatePath("/app/community/people");
  revalidatePath("/app/profile");
  return { ok: true };
}

export async function saveOrganisationMediaUrl(
  pageId: string,
  kind: "avatar" | "banner",
  url: string
): Promise<OrganisationActionResult> {
  if (!isUuid(pageId)) return { error: "This page is not available." };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please log in again to manage this page." };
  const expectedOrigin = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!expectedOrigin || !url.startsWith(`${expectedOrigin}/storage/v1/object/public/avatars/`))
    return { error: "That page image address is not valid." };
  const { data: admin } = await supabase
    .from("organisation_page_admins")
    .select("role")
    .eq("page_id", pageId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!admin) return { error: "You do not have permission to manage this page." };
  const mediaValue =
    kind === "avatar" ? { avatar_url: url } : { banner_url: url };
  const { error } = await supabase
    .from("organisation_pages")
    .update({ ...mediaValue, updated_at: new Date().toISOString() })
    .eq("id", pageId);
  if (error) return { error: "We could not save this page image." };
  revalidatePath(`/app/organisations/${pageId}/edit`);
  revalidatePath(`/app/community/member/${pageId}`);
  revalidatePath("/app/community", "layout");
  return { ok: true };
}
