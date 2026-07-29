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

export type NotificationPrefs = {
  deadlines: boolean;
  funding: boolean;
  community: boolean;
  product: boolean;
};

export type Profile = {
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
  share_bio: boolean;
  share_career_stage: boolean;
  share_university: boolean;
  share_province: boolean;
  share_psychology_interests: boolean;
  share_skills: boolean;
  share_volunteering: boolean;
  share_workshops: boolean;
  share_linkedin: boolean;
  share_website: boolean;
  share_scholar: boolean;
  share_researchgate: boolean;
  share_orcid: boolean;
  onboarding_complete: boolean;
  founding_member: boolean;
  notification_prefs: NotificationPrefs;
  created_at: string;
  updated_at: string;
};

export type University = {
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
};

export type Programme = {
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
};

export type FundingOpportunity = {
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
};

export type Article = {
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
};

export type ChecklistItem = {
  label: string;
  done: boolean;
};

export type Application = {
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
};

export type SavedUniversity = {
  id: string;
  user_id: string;
  university_id: string;
  created_at: string;
};

export type SavedFunding = {
  id: string;
  user_id: string;
  funding_id: string;
  created_at: string;
};

export type JournalEntry = {
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
};

export type Notification = {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  created_at: string;
};

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
        Relationships: [];
      };
      universities: {
        Row: University;
        Insert: Partial<University> & { name: string };
        Update: Partial<University>;
        Relationships: [];
      };
      programmes: {
        Row: ApplyProgramme;
        Insert: Partial<ApplyProgramme>;
        Update: Partial<ApplyProgramme>;
        Relationships: [];
      };
      funding_opportunities: {
        Row: FundingOpportunity;
        Insert: Partial<FundingOpportunity> & { title: string };
        Update: Partial<FundingOpportunity>;
        Relationships: [];
      };
      articles: {
        Row: Article;
        Insert: Partial<Article> & { title: string };
        Update: Partial<Article>;
        Relationships: [];
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
          is_saved?: boolean;
          updated_at?: string;
        };
        Update: Partial<ApplicationPlan> & {
          is_saved?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      programme_sources: {
        Row: ProgrammeSource;
        Insert: Partial<ProgrammeSource> & { programme_id: string; url: string };
        Update: Partial<ProgrammeSource>;
        Relationships: [];
      };
      saved_funding: {
        Row: SavedFunding;
        Insert: { user_id: string; funding_id: string };
        Update: Partial<SavedFunding>;
        Relationships: [];
      };
      journal_entries: {
        Row: JournalEntry;
        Insert: Partial<JournalEntry> & { user_id: string; content: string };
        Update: Partial<JournalEntry>;
        Relationships: [];
      };
      notifications: {
        Row: Notification;
        Insert: Partial<Notification> & { user_id: string; type: string; title: string };
        Update: Partial<Notification>;
        Relationships: [];
      };
      community_profiles: {
        Row: CommunityProfile;
        Insert: Partial<CommunityProfile> & { user_id: string; display_name: string };
        Update: Partial<CommunityProfile>;
        Relationships: [];
      };
      community_moderation_state: {
        Row: CommunityModerationState;
        Insert: Partial<CommunityModerationState> & { user_id: string };
        Update: Partial<CommunityModerationState>;
        Relationships: [];
      };
      community_follows: {
        Row: CommunityFollow;
        Insert: { follower_id: string; followee_id: string };
        Update: Partial<CommunityFollow>;
        Relationships: [];
      };
      community_connections: {
        Row: CommunityConnection;
        Insert: Partial<CommunityConnection> & {
          requester_id: string;
          recipient_id: string;
        };
        Update: Partial<CommunityConnection>;
        Relationships: [];
      };
      community_posts: {
        Row: CommunityPost;
        Insert: Partial<CommunityPost> & { author_id: string; body: string };
        Update: Partial<CommunityPost>;
        Relationships: [];
      };
      community_comments: {
        Row: CommunityComment;
        Insert: Partial<CommunityComment> & {
          post_id: string;
          author_id: string;
          body: string;
        };
        Update: Partial<CommunityComment>;
        Relationships: [];
      };
      community_reactions: {
        Row: CommunityReaction;
        Insert: { post_id: string; user_id: string };
        Update: Partial<CommunityReaction>;
        Relationships: [];
      };
      community_blocks: {
        Row: CommunityBlock;
        Insert: { blocker_id: string; blocked_id: string };
        Update: Partial<CommunityBlock>;
        Relationships: [];
      };
      community_reports: {
        Row: CommunityReport;
        Insert: Partial<CommunityReport> & {
          reporter_id: string;
          target_type: CommunityReportTargetType;
          target_user_id: string;
          category: CommunityReportCategory;
        };
        Update: Partial<CommunityReport>;
        Relationships: [];
      };
      community_moderation_actions: {
        Row: CommunityModerationAction;
        Insert: Partial<CommunityModerationAction> & {
          admin_id: string;
          action: CommunityModerationActionType;
        };
        Update: Partial<CommunityModerationAction>;
        Relationships: [];
      };
      community_terms_acceptances: {
        Row: CommunityTermsAcceptance;
        Insert: Partial<CommunityTermsAcceptance> & {
          user_id: string;
          document_type: string;
          document_version: string;
        };
        Update: Partial<CommunityTermsAcceptance>;
        Relationships: [];
      };
      contact_messages: {
        Row: ContactMessage;
        Insert: Partial<ContactMessage> & {
          name: string;
          email: string;
          category: string;
          message: string;
        };
        Update: Partial<ContactMessage>;
        Relationships: [];
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

export type ApplyProgramme = {
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
};

/** A saved programme plus the user's personal application tracker. */
export type SavedProgrammeWithPlan = {
  id: string;
  user_id: string;
  programme_id: string;
  is_saved: boolean;
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
};

export type CustomStep = {
  id: string;
  title: string;
  done: boolean;
};

/** The personal tracker fields on their own (no joined programme). */
export type ApplicationPlan = {
  is_saved: boolean;
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
};

export type ProgrammeSource = {
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
};

export type ProgrammeUpdate = {
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
};

/* ─── Community Lite ─────────────────────────────────────────────────── */

export type CommunityVisibility = "visible" | "limited" | "hidden";
export type CommunityConnectionPermission =
  | "everyone"
  | "following"
  | "nobody";
export type CommunityConnectionStatus =
  | "pending"
  | "accepted"
  | "declined"
  | "cancelled"
  | "removed";
export type CommunityConnectionState =
  | "none"
  | "outgoing_pending"
  | "incoming_pending"
  | "connected";
export type CommunityContentStatus = "published" | "removed";
export type CommunityReportTargetType = "post" | "comment" | "profile";
export type CommunityReportStatus = "open" | "resolved" | "dismissed";

export type CommunityReportCategory =
  | "harassment"
  | "misinformation"
  | "scam"
  | "hate"
  | "sexual_content"
  | "privacy"
  | "impersonation"
  | "spam"
  | "professional_misconduct"
  | "other";

export type CommunityModerationActionType =
  | "dismiss"
  | "remove_content"
  | "restore_content"
  | "warn"
  | "restrict_posting"
  | "unrestrict_posting"
  | "suspend_community"
  | "unsuspend_community"
  | "note"
  | "resolve";

export type CommunityProfile = {
  user_id: string;
  display_name: string;
  headline: string | null;
  stage: CareerStage | null;
  stage_other: string | null;
  stream: PsychologyStream | null;
  stream_other: string | null;
  institution: string | null;
  province: string | null;
  bio: string | null;
  interests: string[];
  skills: string | null;
  volunteering: string | null;
  workshops: string | null;
  linkedin_url: string | null;
  website_url: string | null;
  scholar_url: string | null;
  researchgate_url: string | null;
  orcid: string | null;
  visibility: CommunityVisibility;
  connection_permission: CommunityConnectionPermission;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

export type CommunityModerationState = {
  user_id: string;
  posting_restricted: boolean;
  community_suspended: boolean;
  updated_at: string;
};

export type CommunityFollow = {
  follower_id: string;
  followee_id: string;
  created_at: string;
};

export type CommunityConnection = {
  id: string;
  requester_id: string;
  recipient_id: string;
  status: CommunityConnectionStatus;
  note: string | null;
  accepted_at: string | null;
  created_at: string;
  updated_at: string;
};

export type CommunityPost = {
  id: string;
  author_id: string;
  body: string;
  is_official: boolean;
  status: CommunityContentStatus;
  created_at: string;
  updated_at: string;
  edited_at: string | null;
};

export type CommunityComment = {
  id: string;
  post_id: string;
  author_id: string;
  body: string;
  status: CommunityContentStatus;
  created_at: string;
  updated_at: string;
  edited_at: string | null;
};

export type CommunityReaction = {
  post_id: string;
  user_id: string;
  created_at: string;
};

export type CommunityBlock = {
  blocker_id: string;
  blocked_id: string;
  created_at: string;
};

export type CommunityReport = {
  id: string;
  /** Null when the reporter's account has been deleted (report retained anonymised). */
  reporter_id: string | null;
  target_type: CommunityReportTargetType;
  target_post_id: string | null;
  target_comment_id: string | null;
  /** Null when the reported account has been deleted (report retained anonymised). */
  target_user_id: string | null;
  category: CommunityReportCategory;
  details: string | null;
  content_excerpt: string | null;
  status: CommunityReportStatus;
  moderator_notes: string | null;
  action_taken: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
};

export type CommunityModerationAction = {
  id: string;
  report_id: string | null;
  /** Null if the acting admin account was later deleted; the log survives. */
  admin_id: string | null;
  target_user_id: string | null;
  action: CommunityModerationActionType;
  notes: string | null;
  created_at: string;
};

export type CommunityTermsAcceptance = {
  id: string;
  user_id: string;
  document_type: string;
  document_version: string;
  accepted_at: string;
};

/** A post joined with its author card and viewer-relative state, for feeds. */
export type CommunityPostView = CommunityPost & {
  author: Pick<
    CommunityProfile,
    "user_id" | "display_name" | "headline" | "stage" | "avatar_url"
  > | null;
  like_count: number;
  comment_count: number;
  liked_by_me: boolean;
};

export type CommunityCommentView = CommunityComment & {
  author: Pick<
    CommunityProfile,
    "user_id" | "display_name" | "stage" | "avatar_url"
  > | null;
};

export type CommunityMemberCard = Pick<
  CommunityProfile,
  | "user_id"
  | "display_name"
  | "headline"
  | "stage"
  | "stream"
  | "institution"
  | "bio"
  | "avatar_url"
> & { followed_by_me: boolean };

export type CommunityConnectionItem = {
  connection_id: string;
  status: "pending" | "accepted";
  direction: "incoming" | "outgoing" | "connected";
  note: string | null;
  created_at: string;
  member: CommunityMemberCard;
};


export type ContactMessage = {
  id: string;
  name: string;
  email: string;
  category: string;
  message: string;
  user_id: string | null;
  status: "new" | "handled";
  handled_by: string | null;
  handled_at: string | null;
  created_at: string;
};
