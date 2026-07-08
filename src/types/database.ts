/**
 * Database types for Phapano+.
 * Mirrors supabase/schema.sql. When you connect real Supabase you can
 * regenerate these with `supabase gen types typescript`, but these hand-written
 * types let the app be fully type-safe from day one.
 */

export type CareerStage =
  | "high_school"
  | "undergraduate"
  | "honours_applicant"
  | "honours"
  | "masters_applicant"
  | "masters_student"
  | "intern"
  | "community_service"
  | "professional"
  | "other";

export type UserRole = "student" | "professional" | "admin";

export type VerificationStatus =
  | "pending"
  | "verified"
  | "flagged_under_review"
  | "updated"
  | "expired"
  | "archived";

export type PsychologyStream =
  | "clinical"
  | "counselling"
  | "research"
  | "educational"
  | "industrial_organisational"
  | "neuropsychology"
  | "other";

export type ApplicationStage =
  | "considering"
  | "documents"
  | "submitted"
  | "interview"
  | "outcome"
  | "accepted"
  | "declined";

export type FundingType =
  | "scholarship"
  | "bursary"
  | "research_funding"
  | "conference_funding"
  | "travel_grant"
  | "other";

export type MoodLabel = "hopeful" | "calm" | "tired" | "anxious" | "low";

export interface NotificationPrefs {
  deadlines: boolean;
  funding: boolean;
  community: boolean;
  product: boolean;
}

export interface Profile {
  id: string;
  full_name: string | null;
  surname: string | null;
  email: string | null;
  role: UserRole;
  career_stage: CareerStage | null;
  career_stage_other: string | null;
  university: string | null;
  province: string | null;
  interests: PsychologyStream[];
  bio: string | null;
  research_interests: string | null;
  application_year: string | null;
  goals: string | null;
  linkedin_url: string | null;
  scholar_url: string | null;
  researchgate_url: string | null;
  orcid: string | null;
  website_url: string | null;
  skills: string | null;
  volunteering: string | null;
  workshops: string | null;
  avatar_url: string | null;
  onboarding_complete: boolean;
  founding_member: boolean;
  notification_prefs: NotificationPrefs;
  created_at: string;
  updated_at: string;
}

export interface University {
  id: string;
  name: string;
  short_name: string | null;
  province: string | null;
  logo_url: string | null;
  website_url: string | null;
  about: string | null;
  source: string | null;
  source_url: string | null;
  status: VerificationStatus;
  last_verified_at: string | null;
  next_review_due_at: string | null;
  owner: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface Programme {
  id: string;
  university_id: string;
  stream: PsychologyStream;
  title: string;
  qualification: string | null;
  duration: string | null;
  overview: string | null;
  opening_date: string | null;
  closing_date: string | null;
  selection_week: string | null;
  interview_process: string | null;
  required_documents: string | null;
  minimum_requirements: string | null;
  referee_requirements: string | null;
  application_link: string | null;
  programme_link: string | null;
  source: string | null;
  source_url: string | null;
  status: VerificationStatus;
  last_verified_at: string | null;
  next_review_due_at: string | null;
  owner: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface FundingOpportunity {
  id: string;
  title: string;
  provider: string | null;
  type: FundingType;
  amount_description: string | null;
  eligibility: string | null;
  description: string | null;
  closing_date: string | null;
  link: string | null;
  relevant_streams: PsychologyStream[];
  relevant_stages: CareerStage[];
  source: string | null;
  source_url: string | null;
  level?: string | null;
  field_relevance?: string | null;
  categories?: string[];
  is_open?: boolean;
  featured?: boolean;
  status: VerificationStatus;
  last_verified_at: string | null;
  next_review_due_at: string | null;
  owner: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface Article {
  id: string;
  title: string;
  slug: string | null;
  excerpt: string | null;
  body: string | null;
  category: string | null;
  reading_minutes: number | null;
  cover_url: string | null;
  source: string | null;
  source_url: string | null;
  status: VerificationStatus;
  last_verified_at: string | null;
  next_review_due_at: string | null;
  owner: string | null;
  is_published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChecklistItem {
  label: string;
  done: boolean;
}

export interface Application {
  id: string;
  user_id: string;
  programme_id: string | null;
  university_id: string | null;
  university_label: string | null;
  programme_label: string | null;
  stage: ApplicationStage;
  checklist: ChecklistItem[];
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface SavedUniversity {
  id: string;
  user_id: string;
  university_id: string;
  created_at: string;
}

export interface SavedFunding {
  id: string;
  user_id: string;
  funding_id: string;
  created_at: string;
}

export interface JournalEntry {
  id: string;
  user_id: string;
  content: string;
  prompt: string | null;
  approach: string | null;
  priority: string | null;
  due_date: string | null;
  mood: MoodLabel | null;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  created_at: string;
}

/**
 * Minimal Database generic shape so the Supabase client is typed.
 * Each table exposes Row/Insert/Update. Insert/Update use Partial where natural.
 */
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Partial<Profile> & { id: string };
        Update: Partial<Profile>;
      };
      universities: {
        Row: University;
        Insert: Partial<University> & { name: string };
        Update: Partial<University>;
      };
      programmes: {
        Row: ApplyProgramme;
        Insert: Partial<ApplyProgramme>;
        Update: Partial<ApplyProgramme>;
      };
      funding_opportunities: {
        Row: FundingOpportunity;
        Insert: Partial<FundingOpportunity> & { title: string };
        Update: Partial<FundingOpportunity>;
      };
      articles: {
        Row: Article;
        Insert: Partial<Article> & { title: string };
        Update: Partial<Article>;
      };
      saved_programmes: {
        Row: Omit<SavedProgrammeWithPlan, "programme"> &
          Pick<
            ApplicationPlan,
            | "personal_statement_done"
            | "cv_done"
            | "transcript_uploaded"
            | "fee_paid"
            | "custom_steps"
            | "notes"
          >;
        Insert: { user_id: string; programme_id: string } & Partial<ApplicationPlan> & {
          updated_at?: string;
        };
        Update: Partial<ApplicationPlan> & { updated_at?: string };
      };
      programme_sources: {
        Row: ProgrammeSource;
        Insert: Partial<ProgrammeSource> & { programme_id: string; url: string };
        Update: Partial<ProgrammeSource>;
      };
      saved_funding: {
        Row: SavedFunding;
        Insert: { user_id: string; funding_id: string };
        Update: Partial<SavedFunding>;
      };
      journal_entries: {
        Row: JournalEntry;
        Insert: Partial<JournalEntry> & { user_id: string; content: string };
        Update: Partial<JournalEntry>;
      };
      notifications: {
        Row: Notification;
        Insert: Partial<Notification> & { user_id: string; type: string; title: string };
        Update: Partial<Notification>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      career_stage: CareerStage;
      user_role: UserRole;
      verification_status: VerificationStatus;
      psychology_stream: PsychologyStream;
      application_stage: ApplicationStage;
      funding_type: FundingType;
      mood_label: MoodLabel;
    };
  };
}

// ---- Apply directory (programmes + saved_programmes) --------------------
export type ProgrammeQualification = "honours" | "masters";
export type ProgrammeStatus =
  | "open"
  | "closed"
  | "opening_soon"
  | "dates_not_confirmed";

export interface ApplyProgramme {
  id: string;
  slug: string | null;
  institution: string;
  institution_url: string | null;
  logo_url: string | null;
  qualification: ProgrammeQualification;
  stream: string | null;
  province: string | null;
  status: ProgrammeStatus;
  opening_date: string | null;
  closing_date: string | null;
  application_fee: string | null;
  min_requirements: string | null;
  supporting_documents: string[] | null;
  application_process: string | null;
  places: string | null;
  selection_dates: string | null;
  interview_required: boolean | null;
  references_required: boolean | null;
  cv_required: boolean | null;
  personal_statement_required: boolean | null;
  transcript_required: boolean | null;
  application_link: string | null;
  contact_details: string | null;
  department_url: string | null;
  programme_url: string | null;
  requirements_url: string | null;
  last_verified: string | null;
  last_checked: string | null;
  needs_review: boolean | null;
  primary_source_url: string | null;
  created_at: string;
  updated_at: string;
}

/** A saved programme plus the user's personal application tracker. */
export interface SavedProgrammeWithPlan {
  id: string;
  user_id: string;
  programme_id: string;
  my_deadline: string | null;
  my_fee: string | null;
  status: string | null;
  next_action: string | null;
  submitted: boolean;
  referees_requested: boolean;
  documents_uploaded: boolean;
  interview_received: boolean;
  selection_completed: boolean;
  outcome_received: boolean;
  created_at: string;
  updated_at: string;
  programme: ApplyProgramme;
}

export interface CustomStep {
  id: string;
  title: string;
  done: boolean;
}

/** The personal tracker fields on their own (no joined programme). */
export interface ApplicationPlan {
  status: string | null;
  next_action: string | null;
  my_deadline: string | null;
  my_fee: string | null;
  documents_uploaded: boolean;
  referees_requested: boolean;
  personal_statement_done: boolean;
  cv_done: boolean;
  transcript_uploaded: boolean;
  fee_paid: boolean;
  submitted: boolean;
  interview_received: boolean;
  selection_completed: boolean;
  outcome_received: boolean;
  custom_steps: CustomStep[];
  notes: string | null;
}

export interface ProgrammeSource {
  id: string;
  programme_id: string;
  source_type: string; // institution | department | postgraduate | application | other
  url: string;
  is_primary: boolean;
  http_status: number | null;
  content_hash: string | null;
  last_checked: string | null;
  last_changed: string | null;
  status: string; // unverified | ok | changed | error | needs_review
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProgrammeUpdate {
  id: string;
  programme_id: string;
  source_id: string | null;
  checked_at: string;
  extracted_text: string | null;
  extracted_opening: string | null;
  extracted_deadline: string | null;
  extracted_fee: string | null;
  extracted_requirements: string | null;
  extracted_documents: string | null;
  confidence: number | null;
  needs_review: boolean;
  review_status: "pending" | "approved" | "rejected";
  reviewed_by: string | null;
  reviewed_at: string | null;
  applied: boolean;
  created_at: string;
}
