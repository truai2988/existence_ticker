export type GratitudeTier = "light" | "medium" | "heavy";

export interface FirestoreTimestamp {
  seconds: number;
  nanoseconds: number;
  toDate: () => Date;
  toMillis: () => number;
}

export interface UserProfile {
  id: string;
  name: string;
  avatarUrl?: string | null;
  headline?: string;
  location?: {
    prefecture: string;
    city: string;
  };
  is_cycle_observed?: boolean;
  links?: {
    x?: string;
    instagram?: string;
    website?: string;
  } | null;
  bio?: string | null;
  balance: number;
  committed_lm: number;
  xp: number;
  warmth: number;
  role?: "user" | "admin";
  age_group?: string;

  is_deleted?: boolean;
  last_updated?: unknown;
  completed_contracts?: number;
  created_contracts?: number;
  completed_requests?: number;

  consecutive_completions?: number;
  has_cancellation_history?: boolean;

  scheduled_cycle_days?: number;
  cycle_started_at?: FirestoreTimestamp;
  created_at?: FirestoreTimestamp;
}

export interface Point {
  id: string;
  value: number;
  reason: string;
  timestamp: number;
}

export interface Wish {
  id: string;
  requester_id: string;
  requester_name?: string;
  requester_trust_score?: number;
  requester_completed_requests?: number;
  content: string;
  applicants?: {
    id: string;
    name: string;
    trust_score?: number;
    contact_email?: string;
  }[];
  gratitude_preset: GratitudeTier;
  status:
    | "open"
    | "in_progress"
    | "review_pending"
    | "fulfilled"
    | "completed"
    | "cancelled"
    | "expired";
  created_at: string;
  tags?: string[];
  helper_id?: string;
  helper_name?: string;
  helper_contact_email?: string;
  requester_contact_email?: string;
  contact_note?: string;
  cost?: number;
  val_at_fulfillment?: number;
  accepted_at?: string;
  fulfilled_at?: unknown;
  cancelled_at?: unknown;
  cancel_reason?: string;
  isAnonymous?: boolean;
  applicant_ids?: string[]; // For querying involved wishes
}

export interface CreateWishInput {
  content: string;
  tier: GratitudeTier;
  isAnonymous?: boolean;
}

export type AppViewMode =
  | "home"
  | "history"
  | "profile"
  | "profile_edit"
  | "flow"
  | "give"
  | "admin";
