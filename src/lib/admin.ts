import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type {
  University,
  FundingOpportunity,
  Article,
} from "@/types/database";

/**
 * Ensures the current user is an admin. In placeholder mode we allow access so
 * the portal is previewable; with real Supabase, non-admins are redirected.
 */
export async function requireAdmin() {
  if (!isSupabaseConfigured) return { demo: true as const };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/admin");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") redirect("/dashboard");
  return { demo: false as const, supabase, user };
}

export interface AdminStats {
  universities: number;
  programmes: number;
  funding: number;
  articles: number;
  users: number;
  reviewDue: number;
}

export async function getAdminStats(): Promise<AdminStats> {
  if (!isSupabaseConfigured) {
    return {
      universities: 8,
      programmes: 16,
      funding: 5,
      articles: 4,
      users: 42,
      reviewDue: 3,
    };
  }
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);

  const [u, p, f, a, usr, due] = await Promise.all([
    supabase.from("universities").select("id", { count: "exact", head: true }),
    supabase.from("programmes").select("id", { count: "exact", head: true }),
    supabase.from("funding_opportunities").select("id", { count: "exact", head: true }),
    supabase.from("articles").select("id", { count: "exact", head: true }),
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase
      .from("programmes")
      .select("id", { count: "exact", head: true })
      .lte("next_review_due_at", today),
  ]);

  return {
    universities: u.count ?? 0,
    programmes: p.count ?? 0,
    funding: f.count ?? 0,
    articles: a.count ?? 0,
    users: usr.count ?? 0,
    reviewDue: due.count ?? 0,
  };
}

export async function adminGetUniversities(): Promise<University[]> {
  if (!isSupabaseConfigured) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("universities")
    .select("*")
    .order("name");
  return data ?? [];
}

export async function adminGetFunding(): Promise<FundingOpportunity[]> {
  if (!isSupabaseConfigured) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("funding_opportunities")
    .select("*")
    .order("closing_date", { ascending: true });
  return data ?? [];
}

export async function adminGetArticles(): Promise<Article[]> {
  if (!isSupabaseConfigured) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("articles")
    .select("*")
    .order("updated_at", { ascending: false });
  return data ?? [];
}
