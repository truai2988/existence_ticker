
export type GratitudeTier = 'light' | 'medium' | 'heavy';

export interface UserProfile {
  id: string;
  name: string;
  bio?: string;
  balance: number;
  xp: number;
  warmth: number;
  last_updated?: unknown; // Timestamp or Date for Universal Decay
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
  content: string;
  gratitude_preset: GratitudeTier;
  status: 'open' | 'in_progress' | 'fulfilled' | 'completed';
  created_at: string;
  tags?: string[];
  helper_id?: string; // ID of the user who accepted the wish
  cost?: number; // Initial Cost / Bounty
  val_at_fulfillment?: number; // Value when it was fulfilled
  accepted_at?: string;
  fulfilled_at?: unknown;
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
