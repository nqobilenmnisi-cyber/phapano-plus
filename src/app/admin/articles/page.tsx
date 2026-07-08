import {
  AdminManager,
  type FieldDef,
  type AdminRow,
} from "@/components/AdminManager";
import { adminGetArticles } from "@/lib/admin";
import { saveArticle, deleteArticle } from "@/app/admin/actions";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { verificationLabels } from "@/lib/utils";
import type { VerificationStatus } from "@/types/database";

export const metadata = { title: "Articles — Admin" };

const statusOptions = (
  Object.keys(verificationLabels) as VerificationStatus[]
).map((s) => ({ value: s, label: verificationLabels[s] }));

const fields: FieldDef[] = [
  { name: "title", label: "Title", type: "text", full: true },
  { name: "slug", label: "Slug (optional)", type: "text", placeholder: "auto-generated if blank" },
  { name: "category", label: "Category", type: "text", placeholder: "Applications" },
  { name: "reading_minutes", label: "Reading minutes", type: "number" },
  { name: "excerpt", label: "Excerpt", type: "textarea", full: true },
  { name: "body", label: "Body", type: "textarea", full: true },
  { name: "source", label: "Source", type: "text" },
  { name: "source_url", label: "Source URL", type: "text" },
  { name: "status", label: "Verification status", type: "select", options: statusOptions },
  { name: "owner", label: "Content owner", type: "text", placeholder: "Articles" },
  { name: "last_verified_at", label: "Last verified", type: "date" },
  { name: "next_review_due_at", label: "Next review due", type: "date" },
];

export default async function AdminArticles() {
  const articles = await adminGetArticles();

  const rows: AdminRow[] = articles.map((a) => ({
    id: a.id,
    title: a.title,
    subtitle: a.category ?? undefined,
    published: a.is_published,
    lastVerified: a.last_verified_at,
    values: {
      title: a.title,
      slug: a.slug ?? "",
      category: a.category ?? "",
      reading_minutes: a.reading_minutes?.toString() ?? "",
      excerpt: a.excerpt ?? "",
      body: a.body ?? "",
      source: a.source ?? "",
      source_url: a.source_url ?? "",
      status: a.status,
      owner: a.owner ?? "",
      last_verified_at: a.last_verified_at ?? "",
      next_review_due_at: a.next_review_due_at ?? "",
    },
  }));

  return (
    <AdminManager
      heading="Articles"
      description="Guides and resources. Written clearly, reviewed regularly."
      fields={fields}
      rows={rows}
      onSave={saveArticle}
      onDelete={deleteArticle}
      demo={!isSupabaseConfigured}
    />
  );
}
