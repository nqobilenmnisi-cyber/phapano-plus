import {
  AdminManager,
  type FieldDef,
  type AdminRow,
} from "@/components/AdminManager";
import { adminGetFunding } from "@/lib/admin";
import { saveFunding, deleteFunding } from "@/app/admin/actions";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { verificationLabels, formatDate } from "@/lib/utils";
import type { VerificationStatus } from "@/types/database";

export const metadata = { title: "Funding — Admin" };

const statusOptions = (
  Object.keys(verificationLabels) as VerificationStatus[]
).map((s) => ({ value: s, label: verificationLabels[s] }));

const typeOptions = [
  { value: "scholarship", label: "Scholarship" },
  { value: "bursary", label: "Bursary" },
  { value: "research_funding", label: "Research funding" },
  { value: "conference_funding", label: "Conference funding" },
  { value: "travel_grant", label: "Travel grant" },
  { value: "other", label: "Other" },
];

const fields: FieldDef[] = [
  { name: "title", label: "Title", type: "text", full: true },
  { name: "provider", label: "Provider", type: "text", placeholder: "National Research Foundation" },
  { name: "type", label: "Type", type: "select", options: typeOptions },
  { name: "amount_description", label: "Amount", type: "text", placeholder: "Full cost of study" },
  { name: "closing_date", label: "Closing date", type: "date" },
  { name: "eligibility", label: "Eligibility", type: "textarea", full: true },
  { name: "description", label: "Description", type: "textarea", full: true },
  { name: "link", label: "Application link", type: "text", full: true },
  { name: "source", label: "Source", type: "text" },
  { name: "source_url", label: "Source URL", type: "text" },
  { name: "status", label: "Verification status", type: "select", options: statusOptions },
  { name: "owner", label: "Content owner", type: "text", placeholder: "Funding" },
  { name: "last_verified_at", label: "Last verified", type: "date" },
  { name: "next_review_due_at", label: "Next review due", type: "date" },
];

export default async function AdminFunding() {
  const funding = await adminGetFunding();

  const rows: AdminRow[] = funding.map((f) => ({
    id: f.id,
    title: f.title,
    subtitle: [f.provider, f.closing_date ? `closes ${formatDate(f.closing_date)}` : null]
      .filter(Boolean)
      .join(" · "),
    published: f.is_published,
    lastVerified: f.last_verified_at,
    values: {
      title: f.title,
      provider: f.provider ?? "",
      type: f.type,
      amount_description: f.amount_description ?? "",
      closing_date: f.closing_date ?? "",
      eligibility: f.eligibility ?? "",
      description: f.description ?? "",
      link: f.link ?? "",
      source: f.source ?? "",
      source_url: f.source_url ?? "",
      status: f.status,
      owner: f.owner ?? "",
      last_verified_at: f.last_verified_at ?? "",
      next_review_due_at: f.next_review_due_at ?? "",
    },
  }));

  return (
    <AdminManager
      heading="Funding"
      description="Scholarships, bursaries and grants, verified and current."
      fields={fields}
      rows={rows}
      onSave={saveFunding}
      onDelete={deleteFunding}
      demo={!isSupabaseConfigured}
    />
  );
}
