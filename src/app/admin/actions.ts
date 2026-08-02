"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { requireAdmin } from "@/lib/admin";
import type {
  VerificationStatus,
  FundingType,
  PsychologyStream,
} from "@/types/database";

function str(fd: FormData, k: string) {
  const v = String(fd.get(k) ?? "").trim();
  return v.length ? v : null;
}

// ---------------- Universities ----------------
export async function saveUniversity(formData: FormData) {
  const ctx = await requireAdmin();
  if (ctx.demo) return { ok: false, demo: true };
  const { supabase } = ctx;

  const id = str(formData, "id");
  const payload = {
    name: String(formData.get("name") ?? "").trim(),
    short_name: str(formData, "short_name"),
    province: str(formData, "province"),
    website_url: str(formData, "website_url"),
    about: str(formData, "about"),
    source: str(formData, "source"),
    source_url: str(formData, "source_url"),
    status: (str(formData, "status") ?? "pending") as VerificationStatus,
    last_verified_at: str(formData, "last_verified_at"),
    next_review_due_at: str(formData, "next_review_due_at"),
    owner: str(formData, "owner"),
    is_published: formData.get("is_published") === "on",
  };

  if (!payload.name) return { ok: false, error: "Name is required." };

  if (id) {
    await supabase.from("universities").update(payload).eq("id", id);
  } else {
    await supabase.from("universities").insert(payload);
  }
  revalidatePath("/admin/universities");
  revalidatePath("/app/apply");
  return { ok: true };
}

export async function deleteUniversity(id: string) {
  const ctx = await requireAdmin();
  if (ctx.demo) return { ok: false };
  await ctx.supabase.from("universities").delete().eq("id", id);
  revalidatePath("/admin/universities");
  return { ok: true };
}

// ---------------- Funding ----------------
export async function saveFunding(formData: FormData) {
  const ctx = await requireAdmin();
  if (ctx.demo) return { ok: false, demo: true };
  const { supabase, user } = ctx;

  const id = str(formData, "id");
  const streams = formData.getAll("relevant_streams").map(String) as PsychologyStream[];

  const payload = {
    title: String(formData.get("title") ?? "").trim(),
    provider: str(formData, "provider"),
    type: (str(formData, "type") ?? "bursary") as FundingType,
    amount_description: str(formData, "amount_description"),
    eligibility: str(formData, "eligibility"),
    description: str(formData, "description"),
    closing_date: str(formData, "closing_date"),
    link: str(formData, "link"),
    relevant_streams: streams,
    source: str(formData, "source"),
    source_url: str(formData, "source_url"),
    status: (str(formData, "status") ?? "pending") as VerificationStatus,
    last_verified_at: str(formData, "last_verified_at"),
    next_review_due_at: str(formData, "next_review_due_at"),
    owner: str(formData, "owner"),
    is_published: formData.get("is_published") === "on",
    needs_review: false,
    source_check_status: "ok" as const,
  };

  if (!payload.title) return { ok: false, error: "Title is required." };

  if (id) {
    const { error } = await supabase.from("funding_opportunities").update(payload).eq("id", id);
    if (error) return { ok: false, error: "We couldn't update this funding opportunity. Please try again." };
    await supabase
      .from("funding_updates")
      .update({
        review_status: "approved",
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        applied: true,
      })
      .eq("funding_id", id)
      .eq("review_status", "pending");
  } else {
    const { error } = await supabase.from("funding_opportunities").insert(payload);
    if (error) return { ok: false, error: "We couldn't add this funding opportunity. Please try again." };
  }
  revalidatePath("/admin/funding");
  revalidatePath("/app/funding");
  revalidateTag("funding-directory");
  return { ok: true };
}

export async function deleteFunding(id: string) {
  const ctx = await requireAdmin();
  if (ctx.demo) return { ok: false };
  await ctx.supabase.from("funding_opportunities").delete().eq("id", id);
  revalidatePath("/admin/funding");
  revalidateTag("funding-directory");
  return { ok: true };
}

// ---------------- Articles ----------------
export async function saveArticle(formData: FormData) {
  const ctx = await requireAdmin();
  if (ctx.demo) return { ok: false, demo: true };
  const { supabase } = ctx;

  const id = str(formData, "id");
  const title = String(formData.get("title") ?? "").trim();
  const payload = {
    title,
    slug:
      str(formData, "slug") ??
      title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
    excerpt: str(formData, "excerpt"),
    body: str(formData, "body"),
    category: str(formData, "category"),
    reading_minutes: formData.get("reading_minutes")
      ? Number(formData.get("reading_minutes"))
      : null,
    source: str(formData, "source"),
    source_url: str(formData, "source_url"),
    status: (str(formData, "status") ?? "pending") as VerificationStatus,
    last_verified_at: str(formData, "last_verified_at"),
    next_review_due_at: str(formData, "next_review_due_at"),
    owner: str(formData, "owner"),
    is_published: formData.get("is_published") === "on",
  };

  if (!title) return { ok: false, error: "Title is required." };

  if (id) {
    await supabase.from("articles").update(payload).eq("id", id);
  } else {
    await supabase.from("articles").insert(payload);
  }
  revalidatePath("/admin/articles");
  return { ok: true };
}

export async function deleteArticle(id: string) {
  const ctx = await requireAdmin();
  if (ctx.demo) return { ok: false };
  await ctx.supabase.from("articles").delete().eq("id", id);
  revalidatePath("/admin/articles");
  return { ok: true };
}

/**
 * Quick "mark verified today" used across content types — sets status to
 * verified, stamps last_verified_at to today, and pushes next review out.
 */
export async function markVerifiedToday(
  table: "universities" | "funding_opportunities" | "articles",
  id: string,
  reviewInDays = 7
) {
  const ctx = await requireAdmin();
  if (ctx.demo) return { ok: false };
  const today = new Date();
  const next = new Date();
  next.setDate(today.getDate() + reviewInDays);

  await ctx.supabase
    .from(table)
    .update({
      status: "verified",
      last_verified_at: today.toISOString().slice(0, 10),
      next_review_due_at: next.toISOString().slice(0, 10),
    })
    .eq("id", id);

  revalidatePath("/admin");
  return { ok: true };
}
