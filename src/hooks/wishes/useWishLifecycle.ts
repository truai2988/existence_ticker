import { useState } from "react";
import { UserProfile } from "../../types";
import { useAuth } from "../useAuthHook";
import { useWallet } from "../useWallet";
import { db } from "../../lib/firebase";
import { collection, doc, runTransaction, serverTimestamp, Transaction, query, where, getDocs, increment, deleteField } from "firebase/firestore";
import { calculateDecayedValue, toMilli, fromMilli, WORLD_CONSTANTS, getMillis } from "../../logic/worldPhysics";
import { MESSAGES } from "../../constants/messages";
import { useWishNotice } from "./useWishNotice";
import { recordFulfillment, recordCompensation, recordCancellation, recordExpiration } from "../../logic/transactionService";

export const useWishLifecycle = () => {
  const { user } = useAuth();
  const { setOptimisticBalanceOffset } = useWallet();
  const { sendNoticeSilently } = useWishNotice();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fulfillWish = async (
    wishId: string,
    fulfillerId: string,
    message?: string,
  ): Promise<boolean> => {
    if (!db) return false;
    setIsSubmitting(true);

    const wishRef = doc(db, "wishes", wishId);
    const fulfillerRef = doc(db, "users", fulfillerId);

    try {
      const now = Date.now();
      
      const wishesRef = collection(db, 'wishes');
      const wDocInitial = await getDocs(query(collection(db, 'wishes'), where('__name__', '==', wishId)));
      if (wDocInitial.empty) throw "Wish not found (initial check)";
      const wDataInitial = wDocInitial.docs[0].data();
      const issuerId = wDataInitial.requester_id;

      const issuerActiveQ = query(
        wishesRef, 
        where('requester_id', '==', issuerId), 
        where('status', 'in', ['open', 'in_progress', 'review_pending'])
      );
      const issuerActiveSnap = await getDocs(issuerActiveQ);
      let issuerQueryCommittedMilli = 0;
      const costMap: Record<string, number> = { light: 0, medium: 500, heavy: 1000 };

      issuerActiveSnap.forEach(wishDoc => {
        const w = wishDoc.data();
        const initialCost = w.cost || costMap[w.gratitude_preset as string] || 0;
        const wElapsedSec = Math.max(0, ((now - getMillis(w.created_at)) / 1000) | 0);
        issuerQueryCommittedMilli += calculateDecayedValue(toMilli(initialCost), wElapsedSec);
      });

      await runTransaction(db, async (transaction: Transaction) => {
        const wishDoc = await transaction.get(wishRef);
        if (!wishDoc.exists()) throw "Wish does not exist";

        const wishData = wishDoc.data();
        if (wishData.status === "fulfilled" || wishData.status === "completed") throw "Already fulfilled";

        const issuerRef = doc(db!, "users", wishData.requester_id);
        const issuerDoc = await transaction.get(issuerRef);
        const fulfillerDoc = await transaction.get(fulfillerRef);

        const txId = `wish_${wishId}_PAY_${fulfillerId}`;
        const txRef = doc(collection(db!, "transactions"), txId);
        const txDoc = await transaction.get(txRef);
        if (txDoc.exists()) throw "Idempotency trigger";

        const wishElapsedSec = ((now - getMillis(wishData.created_at)) / 1000) | 0;
        const wishDecayedMilli = calculateDecayedValue(toMilli(wishData.cost || 0), wishElapsedSec);

        let paymentMilli = wishDecayedMilli;
        if (issuerDoc.exists()) {
             const issuerData = issuerDoc.data() as UserProfile;
             const iCycleStart = getMillis(issuerData.cycle_started_at, 0);
             const iSpent = issuerData.spent_lm || 0;
             const iElapsedSec = ((now - iCycleStart) / 1000) | 0;
             const iDecayedVesselMilli = calculateDecayedValue(toMilli(WORLD_CONSTANTS.REBIRTH_AMOUNT), iElapsedSec);
             const iCurrentRealMilli = Math.max(0, iDecayedVesselMilli - toMilli(iSpent));
             
             const activeCommittedExceptThisMilli = Math.max(0, issuerQueryCommittedMilli - wishDecayedMilli);
             const availableForThisPaymentMilli = Math.max(0, iCurrentRealMilli - activeCommittedExceptThisMilli);
             paymentMilli = Math.min(wishDecayedMilli, availableForThisPaymentMilli);
        } else {
             paymentMilli = 0;
        }
        
        const isBankruptcy = paymentMilli < wishDecayedMilli;
        const paymentAmount = fromMilli(paymentMilli);

        if (fulfillerDoc.exists()) {
          const fData = fulfillerDoc.data() as UserProfile;
          const fCycleStart = getMillis(fData.cycle_started_at, 0);
          const fDecayedVesselMilli = calculateDecayedValue(toMilli(WORLD_CONSTANTS.REBIRTH_AMOUNT), ((now - fCycleStart) / 1000) | 0);
          
          const minFSpentMilli = fDecayedVesselMilli - toMilli(WORLD_CONSTANTS.REBIRTH_AMOUNT);
          const fSpentMilli = toMilli(fData.spent_lm || 0);
          const newFSpentMilli = Math.max(minFSpentMilli, fSpentMilli - paymentMilli);

          transaction.update(fulfillerRef, {
            spent_lm: fromMilli(newFSpentMilli),
            completed_contracts: increment(1),
            consecutive_completions: (fData.consecutive_completions || 0) + 1,
          });
        }

        if (issuerDoc.exists()) {
          const issuerProfile = issuerDoc.data() as UserProfile;
          const currentSpent = issuerProfile.spent_lm || 0;
          transaction.update(issuerRef, {
            spent_lm: currentSpent + paymentAmount,
            completed_requests: increment(1),
          });
        }

        transaction.delete(wishRef);

        let txType = "SPARK";
        if (paymentAmount === 0) txType = "PRICELESS";
        else if (paymentAmount >= 900) txType = "BONFIRE";
        else if (paymentAmount >= 400) txType = "CANDLE";

        recordFulfillment(transaction, db!, {
          wishId,
          wishData,
          issuerId: wishData.requester_id,
          issuerName: issuerDoc.data()?.name || wishData.requester_name || MESSAGES.WISH_ACTIONS.FALLBACK_REQUESTER,
          fulfillerId,
          fulfillerName: fulfillerDoc.data()?.name || wishData.helper_name || MESSAGES.WISH_ACTIONS.FALLBACK_HELPER,
          paymentAmount,
          txType,
          isBankruptcy,
          message
        });

        const today = new Date().toISOString().split("T")[0];
        const dailyStatsRef = doc(db!, "daily_stats", today);
        transaction.set(dailyStatsRef, {
          volume: increment(paymentAmount),
          updated_at: serverTimestamp(),
        }, { merge: true });
      });

      setOptimisticBalanceOffset(0);

      sendNoticeSilently({
        userId: fulfillerId,
        // wishId: wishId, // 願い本体は削除されているため紐付けない（詳細モーダルを開かせない）
        message: MESSAGES.WISH_ACTIONS.NOTICE_FULFILLED.replace('%name', user?.displayName || MESSAGES.WISH_ACTIONS.FALLBACK_REQUESTER),
        messageKey: "NOTICE_FULFILLED",
        params: { 
          name: user?.displayName || MESSAGES.WISH_ACTIONS.FALLBACK_REQUESTER,
          note: message || ""
        },
        type: "wish_fulfilled",
      });

      return true;
    } catch (e) {
      console.error("Fulfillment failed:", e);
      setOptimisticBalanceOffset(0);
      alert(`${MESSAGES.WISH_ACTIONS.ALERT_FULFILL_FAILED} ${e instanceof Error ? e.message : String(e)}`);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const cancelWish = async (wishId: string): Promise<boolean> => {
    if (!db || !user) return false;
    setIsSubmitting(true);
    try {
      const now = Date.now();
      const wishRef = doc(db, "wishes", wishId);
      
      await runTransaction(db, async (transaction: Transaction) => {
        const wishDoc = await transaction.get(wishRef);
        if (!wishDoc.exists()) throw "Wish does not exist";
        const wishData = wishDoc.data();

        if (wishData.status === "in_progress") {
          const isRequesterCanceling = wishData.requester_id === user.uid;
          const isHelperCanceling = wishData.helper_id === user.uid;
          
          if (!isRequesterCanceling && !isHelperCanceling) throw "Unauthorized";
          
          const requesterRef = doc(db!, "users", wishData.requester_id);
          const requesterDoc = await transaction.get(requesterRef);
          if (!requesterDoc.exists()) throw "Requester not found";
          
          const rData = requesterDoc.data() as UserProfile;
          const rCycleStart = getMillis(rData.cycle_started_at, 0);
          const rSpent = rData.spent_lm || 0;
          const rName = rData.name || "Requester";

          const helperRef = doc(db!, "users", wishData.helper_id);
          const helperDoc = await transaction.get(helperRef);
          if (!helperDoc.exists()) throw "Helper not found";
          const hName = helperDoc.data()?.name || "Helper";

          const wishElapsedSec = ((now - getMillis(wishData.created_at)) / 1000) | 0;
          const wishDecayedMilli = calculateDecayedValue(toMilli(wishData.cost || 0), wishElapsedSec);
          
          const rElapsedSec = ((now - rCycleStart) / 1000) | 0;
          const rDecayedVesselMilli = calculateDecayedValue(toMilli(WORLD_CONSTANTS.REBIRTH_AMOUNT), rElapsedSec);
          const rCurrentRealMilli = Math.max(0, rDecayedVesselMilli - toMilli(rSpent));
          
          const txId = isRequesterCanceling 
              ? `compensate_${wishId}_TO_${wishData.helper_id}`
              : `compensate_${wishId}_TO_${wishData.requester_id}`;
          const txRef = doc(collection(db!, "transactions"), txId);
          const txCheck = await transaction.get(txRef);

          if (isRequesterCanceling) {
            const actualPaymentMilli = Math.min(rCurrentRealMilli, wishDecayedMilli);
            
            transaction.update(requesterRef, {
              spent_lm: rSpent + fromMilli(actualPaymentMilli),
              consecutive_completions: 0, 
              has_cancellation_history: true, 
            });

            const hData = helperDoc.data() as UserProfile;
            const hCycleStart = getMillis(hData.cycle_started_at, 0);
            const hDecayedVesselMilli = calculateDecayedValue(toMilli(WORLD_CONSTANTS.REBIRTH_AMOUNT), ((now - hCycleStart) / 1000) | 0);
            
            const minHSpentMilli = hDecayedVesselMilli - toMilli(WORLD_CONSTANTS.REBIRTH_AMOUNT);
            const hSpentMilli = toMilli(hData.spent_lm || 0);
            const newHSpentMilli = Math.max(minHSpentMilli, hSpentMilli - actualPaymentMilli);

            transaction.update(helperRef, {
              spent_lm: fromMilli(newHSpentMilli),
            });

            const partnerRef = helperRef;
            const notificationMsg = MESSAGES.WISH_ACTIONS.NOTICE_REQUESTER_CANCEL;
            transaction.update(partnerRef, {
                pending_interruption_notification: notificationMsg,
            });

            sendNoticeSilently({
              userId: wishData.helper_id,
              wishId,
              message: notificationMsg,
              messageKey: "NOTICE_REQUESTER_CANCEL",
              type: "wish_cancelled",
            });

            if (!txCheck.exists()) {
              recordCompensation(transaction, db!, {
                wishId,
                wishData,
                senderId: wishData.requester_id,
                senderName: rName,
                recipientId: wishData.helper_id,
                recipientName: hName,
                paymentAmount: fromMilli(actualPaymentMilli)
              });
            }
            transaction.delete(wishRef);
          } else {
            transaction.update(helperRef, {
              consecutive_completions: 0, 
              has_cancellation_history: true,
            });

            transaction.update(requesterRef, {
                pending_interruption_notification: MESSAGES.WISH_ACTIONS.NOTICE_HELPER_WAIT_RETURN,
            });

            sendNoticeSilently({
              userId: wishData.requester_id,
              wishId,
              message: MESSAGES.WISH_ACTIONS.NOTICE_HELPER_RESIGNED.replace('%name', user?.displayName || MESSAGES.WISH_ACTIONS.FALLBACK_HELPER),
              messageKey: "NOTICE_HELPER_RESIGNED",
              params: { name: user?.displayName || MESSAGES.WISH_ACTIONS.FALLBACK_HELPER },
              type: "helper_resigned",
            });
            
            transaction.update(wishRef, {
              status: "open",
              cancel_reason: "helper_interruption",
              cancelled_at: serverTimestamp(),
              helper_id: deleteField(),
              helper_name: deleteField(),
              helper_contact_email: deleteField(),
              accepted_at: deleteField(),
              system_note: MESSAGES.WISH_ACTIONS.SYS_NOTE_REOPEN
            });
          }
        } else {
          transaction.delete(wishRef);

          recordCancellation(transaction, db!, {
            wishId,
            wishData,
            ownerId: user.uid
          });
        }
      });

      return true;
    } catch (error) {
      console.error("Cancel failed:", error);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const resignWish = async (wishId: string): Promise<boolean> => {
    if (!db || !user) return false;
    setIsSubmitting(true);
    let requesterId: string | null = null;
    try {
      const wishRef = doc(db, "wishes", wishId);
      const userRef = doc(db, "users", user.uid);
      
      await runTransaction(db, async (transaction) => {
        const wishDoc = await transaction.get(wishRef);
        if (!wishDoc.exists()) throw new Error("Wish not found");

        const wishData = wishDoc.data();
        requesterId = wishData.requester_id;
        
        await transaction.get(userRef);

        const currentApplicants = wishData.applicants || [];
        const updatedApplicants = currentApplicants.filter(
            (a: { id: string }) => a.id !== user.uid
        );
        const currentApplicantIds = wishData.applicant_ids || [];
        const updatedApplicantIds = currentApplicantIds.filter(
            (id: string) => id !== user.uid
        );

        transaction.update(userRef, {
            consecutive_completions: 0,
            has_cancellation_history: true,
            last_updated: serverTimestamp()
        });

        transaction.update(wishRef, {
            status: "open",
            applicants: updatedApplicants,
            applicant_ids: updatedApplicantIds,
            helper_id: deleteField(),
            accepted_at: deleteField(),
            system_note: MESSAGES.WISH_ACTIONS.SYS_NOTE_REOPEN2 || "事情により、再度募集されています。"
        });
      });

      // トランザクション完了後に通知を送信
      if (requesterId) {
        sendNoticeSilently({
          userId: requesterId,
          message: MESSAGES.WISH_ACTIONS.NOTICE_HELPER_RESIGNED.replace('%name', user?.displayName || MESSAGES.WISH_ACTIONS.FALLBACK_HELPER),
          messageKey: "NOTICE_HELPER_RESIGNED",
          params: { name: user?.displayName || MESSAGES.WISH_ACTIONS.FALLBACK_HELPER },
          type: "helper_resigned",
        });
      }

      return true;
    } catch (e) {
      console.error("Failed to resign wish:", e);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const acceptWish = async (wishId: string) => {
    if (!user) return false;
    return fulfillWish(wishId, user.uid);
  };

  const expireWish = async (wishId: string): Promise<boolean> => {
    if (!db || !user) return false;
    setIsSubmitting(true);
    try {
      const wishRef = doc(db, "wishes", wishId);
      
      await runTransaction(db, async (transaction: Transaction) => {
        const wishDoc = await transaction.get(wishRef);
        if (!wishDoc.exists()) throw "Wish not found";
        const wishData = wishDoc.data();

        transaction.delete(wishRef);

        recordExpiration(transaction, db!, {
          wishId,
          wishData
        });
      });

      return true;
    } catch (e) {
      console.error("Failed to expire wish:", e);
      alert("整理に失敗しました");
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const reactivateWish = async (wishId: string, status?: 'open' | 'in_progress', helperId?: string): Promise<boolean> => {
    if (!db || !user) return false;
    setIsSubmitting(true);
    try {
      const wishRef = doc(db, "wishes", wishId);
      
      await runTransaction(db, async (transaction: Transaction) => {
          const wishDoc = await transaction.get(wishRef);
          if (!wishDoc.exists()) throw "Wish not found";
          
          const wishData = wishDoc.data();
          const targetStatus = status || ((helperId || wishData.helper_id) ? 'in_progress' : 'open');
          const targetHelperId = helperId || wishData.helper_id;

          transaction.update(wishRef, {
            status: targetStatus,
            updated_at: serverTimestamp() as unknown as number, 
            ...(targetHelperId ? { helper_id: targetHelperId } : {})
          });
      });
      return true;
    } catch (e) {
      console.error("Failed to reactivate wish:", e);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return { fulfillWish, cancelWish, resignWish, acceptWish, expireWish, reactivateWish, isSubmitting };
};
