import { Timestamp, FieldValue } from "firebase/firestore";

/**
 * Transaction Type Literals
 */
export type TransactionType = 
  | "GIFT" 
  | "WISH_FULFILLMENT" 
  | "WISH_CANCELLED" 
  | "WISH_EXPIRED" 
  | "COMPENSATION" 
  | "BIRTH" 
  | "REBIRTH";

/**
 * Transaction Description Literals
 * Used for dynamic localization mapping in the UI.
 */
export type TransactionDescription =
  // Fulfillment
  | "wish_fulfill_sender"
  | "wish_fulfill_recv"
  | "wish_priceless"
  | "wish_bankrupt_sender"
  | "wish_bankrupt_recv"
  // Compensation
  | "compensation_sender"
  | "compensation_recv"
  // System / Others
  | "user_cancellation"
  | "system_expiration"
  | "system_birth"
  | "system_rebirth"
  // Legacy support or fallback
  | string;

/**
 * Unified Transaction Record Interface
 * Represents the structure saved in Firestore 'transactions' collection.
 */
export interface TransactionRecord {
  id: string;
  owner_id: string;
  type: TransactionType;
  amount: number;
  created_at: Timestamp | FieldValue | Date | number | string;
  
  sender_id?: string;
  sender_name?: string;
  recipient_id?: string | null;
  recipient_name?: string | null;
  
  wish_id?: string | null;
  wish_title?: string | null;
  
  description?: TransactionDescription;
  message?: string | null;
  tags?: string[];
  
  // Metadata for legacy data processing
  timestamp?: Timestamp | FieldValue;
  sub_type?: string;
}
