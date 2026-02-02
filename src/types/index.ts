
export type GratitudeTier = 'light' | 'medium' | 'heavy';

export interface FirestoreTimestamp {
  seconds: number;
  nanoseconds: number;
  toDate: () => Date;
  toMillis: () => number;
}

export interface UserProfile {
  id: string;
  name: string;
  avatarUrl?: string;
  headline?: string;
  location?: {
    prefecture: string;
    city: string;
  };
  links?: {
    x?: string;
    instagram?: string;
    website?: string;
  };
  bio?: string;
  balance: number;
  xp: number;
  warmth: number;
  // Role for Governance
  role?: 'user' | 'admin';

  // Computed / Virtual
  is_deleted?: boolean;
  last_updated?: unknown;
  completed_contracts?: number; // How many times they helped
  created_contracts?: number;   // How many times they requested
  completed_requests?: number;  // How many times their requests were fulfilled & paid
  
  // Trust Metrics (Impurity & Purification)
  consecutive_completions?: number; // Streak of honest fulfillments
  has_cancellation_history?: boolean; // Flag if they ever canceled in-progress
  
  // Seasonal Cycle
  scheduled_cycle_days?: number; // The duration of the current cycle (Non-Retroactive)
  cycle_started_at?: FirestoreTimestamp; // Firestore Timestamp
  created_at?: FirestoreTimestamp; // Firestore Timestamp (Fallback)
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
  requester_trust_score?: number; // Snapshot of their reliability (completed contracts as helper) at creation
  requester_completed_requests?: number; // Snapshot of their reliability (completed requests as requester) at creation
  content: string;
  applicants?: { id: string; name: string; trust_score?: number }[]; // Handshake candidates
  gratitude_preset: GratitudeTier;
  status: 'open' | 'in_progress' | 'review_pending' | 'fulfilled' | 'completed' | 'cancelled' | 'expired';
  created_at: string;
  tags?: string[];
  helper_id?: string; // ID of the user who accepted the wish
  cost?: number; // Initial Cost / Bounty
  val_at_fulfillment?: number; // Value when it was fulfilled (or compensated)
  accepted_at?: string;
  fulfilled_at?: unknown;
  cancelled_at?: unknown; // Firestore Timestamp
  cancel_reason?: string;
}

// UI Input Type
export interface CreateWishInput {
  content: string;
  tier: GratitudeTier;
}

export interface ScannedUser {
  id: string;
  name: string;
}

export interface PendingWish {
  id: string;
  title: string;
  cost: number;
  preset: GratitudeTier;
}

export type AppViewMode = 'home' | 'history' | 'profile' | 'profile_edit' | 'flow' | 'give' | 'gift' | 'admin';
