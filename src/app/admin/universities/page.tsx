import {
  AdminManager,
  type FieldDef,
  type AdminRow,
} from "@/components/AdminManager";
import { adminGetUniversities } from "@/lib/admin";
import { saveUniversity, deleteUniversity } from "@/app/admin/actions";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { SA_PROVINCES, verificationLabels } from "@/lib/utils";
import type { VerificationStatus } from "@/types/database";

export const metadata = { title: "Universities — Admin" };

const statusOptions = (
  Object.keys(verificationLabels) as VerificationStatus[]
).map((s) => ({ value: s, label: verificationLabels[s] }));

const fields: FieldDef[] = [
  { name: "name", label: "Name", type: "text", placeholder: "University of Cape Town", full: true },
  { name: "short_name", label: "Short name", type: "text", placeholder: "UCT" },
  { name: "province", label: "Province", type: "select", options: [{ value: "", label: "Select…" }, ...SA_PROVINCES.map((p) => ({ value: p, label: p }))] },
  { name: "website_url", label: "Website URL", type: "text", placeholder: "https://uct.ac.za", full: true },
  { name: "about", label: "About", type: "textarea", full: true },
  { name: "source", label: "Source", type: "text", placeholder: "Official postgraduate page" },
  { name: "source_url", label: "Source URL", type: "text" },
  { name: "status", label: "Verification status", type: "select", options: statusOptions },
  { name: "owner", label: "Content owner", type: "text", placeholder: "Applications" },
  { name: "last_verified_at", label: "Last verified", type: "date" },
  { name: "next_review_due_at", label: "Next review due", type: "date" },
];

export default async function AdminUniversities() {
  const unis = await adminGetUniversities();

  const rows: AdminRow[] = unis.map((u) => ({
    id: u.id,
    title: u.name,
    subtitle: u.province ?? undefined,
    published: u.is_published,
    lastVerified: u.last_verified_at,
    values: {
      name: u.name,
      short_name: u.short_name ?? "",
      province: u.province ?? "",
      website_url: u.website_url ?? "",
      about: u.about ?? "",
      source: u.source ?? "",
      source_url: u.source_url ?? "",
      status: u.status,
      owner: u.owner ?? "",
      last_verified_at: u.last_verified_at ?? "",
      next_review_due_at: u.next_review_due_at ?? "",
    },
  }));

  return (
    <AdminManager
      heading="Universities"
      description="Verified institutions and their postgraduate psychology offerings."
      fields={fields}
      rows={rows}
      onSave={saveUniversity}
      onDelete={deleteUniversity}
      demo={!isSupabaseConfigured}
    />
  );
}
