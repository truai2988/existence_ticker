import { collection, doc, serverTimestamp, Transaction, Firestore } from "firebase/firestore";
import { MESSAGES } from "../constants/messages";
import { Wish } from "./../types/index";
import { TransactionRecord } from "../types/transaction";

type BaseParams = {
  wishId: string;
  wishData: Partial<Wish>;
};

interface FulfillmentParams extends BaseParams {
  issuerId: string;
  issuerName: string;
  fulfillerId: string;
  fulfillerName: string;
  paymentAmount: number;
  txType: string;
  isBankruptcy: boolean;
  message?: string | null;
}

export const recordFulfillment = (transaction: Transaction, db: Firestore, params: FulfillmentParams) => {
  const { wishId, wishData, issuerId, issuerName, fulfillerId, fulfillerName, paymentAmount, txType, isBankruptcy, message } = params;
  
  const txId = `wish_${wishId}_PAY_${fulfillerId}`;
  const txRef = doc(collection(db, "transactions"), txId);
  const rxRef = doc(collection(db, "transactions"), `${txId}_RX`);
  const tags = wishData.tags || [];

  const baseRecord: Partial<TransactionRecord> = {
    amount: paymentAmount,
    timestamp: serverTimestamp(),
    created_at: serverTimestamp(),
    type: "WISH_FULFILLMENT",
    sub_type: txType,
    wish_id: wishId,
    wish_title: wishData.content,
    sender_id: issuerId,
    sender_name: issuerName,
    recipient_id: fulfillerId,
    recipient_name: fulfillerName,
    tags,
    message: message || null 
  };

  // Sender Record
  transaction.set(txRef, {
    ...baseRecord,
    owner_id: issuerId,
    description: isBankruptcy ? "wish_bankrupt_sender" : (paymentAmount === 0 ? "wish_priceless" : "wish_fulfill_sender"),
  });

  // Receiver Record
  transaction.set(rxRef, {
    ...baseRecord,
    owner_id: fulfillerId,
    description: isBankruptcy ? "wish_bankrupt_recv" : (paymentAmount === 0 ? "wish_priceless" : "wish_fulfill_recv"),
  });
};

interface CompensationParams extends BaseParams {
  senderId: string;
  senderName: string;
  recipientId: string;
  recipientName: string;
  paymentAmount: number;
}

export const recordCompensation = (transaction: Transaction, db: Firestore, params: CompensationParams) => {
  const { wishId, wishData, senderId, senderName, recipientId, recipientName, paymentAmount } = params;

  const txId = `compensate_${wishId}_TO_${recipientId}`;
  const txRef = doc(collection(db, "transactions"), txId);
  const rxRef = doc(collection(db, "transactions"), `${txId}_RX`);

  const baseRecord: Partial<TransactionRecord> = {
    type: "COMPENSATION",
    amount: paymentAmount, 
    created_at: serverTimestamp(),
    sender_id: senderId,
    sender_name: senderName, 
    recipient_id: recipientId,
    recipient_name: recipientName,
    wish_title: wishData.content,
    wish_id: wishId,
  };

  // Sender Record
  transaction.set(txRef, {
    ...baseRecord,
    owner_id: senderId,
    description: "compensation_sender"
  });

  // Receiver Record
  transaction.set(rxRef, {
    ...baseRecord,
    owner_id: recipientId,
    description: "compensation_recv"
  });
};

interface SimpleCancelParams extends BaseParams {
  ownerId: string;
}

export const recordCancellation = (transaction: Transaction, db: Firestore, params: SimpleCancelParams) => {
  const { wishId, wishData, ownerId } = params;
  const txId = `cancel_${wishId}`;
  const txRef = doc(collection(db, "transactions"), txId);

  const record: Partial<TransactionRecord> = {
    type: "WISH_CANCELLED",
    owner_id: ownerId,
    amount: 0,
    created_at: serverTimestamp(),
    sender_id: ownerId,
    sender_name: wishData.requester_name || MESSAGES.WISH_ACTIONS.FALLBACK_REQUESTER,
    recipient_id: wishData.helper_id || null,
    recipient_name: wishData.helper_name || null,
    wish_title: wishData.content,
    wish_id: wishId,
    description: "user_cancellation"
  };

  transaction.set(txRef, record);
};

interface ExpirationParams extends BaseParams {}

export const recordExpiration = (transaction: Transaction, db: Firestore, params: ExpirationParams) => {
  const { wishId, wishData } = params;
  const txId = `expire_${wishId}`;
  const txRef = doc(collection(db, "transactions"), txId);
  
  const record: Partial<TransactionRecord> = {
    type: "WISH_EXPIRED",
    owner_id: wishData.requester_id,
    amount: 0,
    created_at: serverTimestamp(),
    sender_id: wishData.requester_id,
    sender_name: wishData.requester_name || "依頼主",
    recipient_id: wishData.helper_id || null,
    recipient_name: wishData.helper_name || null,
    wish_title: wishData.content,
    wish_id: wishId,
    description: "system_expiration"
  };

  transaction.set(txRef, record);
};

