import { collection, doc, serverTimestamp, Transaction, Firestore } from "firebase/firestore";
import { MESSAGES } from "../constants/messages";
import { Wish } from "../types";

interface FulfillmentParams {
  wishId: string;
  wishData: Partial<Wish>;
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

  // Sender Record
  transaction.set(txRef, {
    owner_id: issuerId,
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
    description: isBankruptcy ? "wish_bankrupt_sender" : (paymentAmount === 0 ? "wish_priceless" : "wish_fulfill_sender"),
    message: message || null 
  });

  // Receiver Record
  transaction.set(rxRef, {
    owner_id: fulfillerId,
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
    description: isBankruptcy ? "wish_bankrupt_recv" : (paymentAmount === 0 ? "wish_priceless" : "wish_fulfill_recv"),
    message: message || null 
  });
};

interface CompensationParams {
  wishId: string;
  wishData: Partial<Wish>;
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

  // Sender Record
  transaction.set(txRef, {
    owner_id: senderId,
    type: "COMPENSATION",
    amount: paymentAmount, 
    created_at: serverTimestamp(),
    sender_id: senderId,
    sender_name: senderName, 
    recipient_id: recipientId,
    recipient_name: recipientName,
    wish_title: wishData.content,
    wish_id: wishId,
    description: "compensation_sender"
  });

  // Receiver Record
  transaction.set(rxRef, {
    owner_id: recipientId,
    type: "COMPENSATION",
    amount: paymentAmount, 
    created_at: serverTimestamp(),
    sender_id: senderId,
    sender_name: senderName, 
    recipient_id: recipientId,
    recipient_name: recipientName,
    wish_title: wishData.content,
    wish_id: wishId,
    description: "compensation_recv"
  });
};

interface SimpleCancelParams {
  wishId: string;
  wishData: Partial<Wish>;
  ownerId: string;
}

export const recordCancellation = (transaction: Transaction, db: Firestore, params: SimpleCancelParams) => {
  const { wishId, wishData, ownerId } = params;
  const txId = `cancel_${wishId}`;
  const txRef = doc(collection(db, "transactions"), txId);

  transaction.set(txRef, {
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
  });
};

interface ExpirationParams {
  wishId: string;
  wishData: Partial<Wish>;
}

export const recordExpiration = (transaction: Transaction, db: Firestore, params: ExpirationParams) => {
  const { wishId, wishData } = params;
  const txId = `expire_${wishId}`;
  const txRef = doc(collection(db, "transactions"), txId);
  
  transaction.set(txRef, {
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
    description: "期限を過ぎたため、自動的に整理されました"
  });
};
