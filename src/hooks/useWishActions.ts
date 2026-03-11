import { useState } from "react";
import { Wish, CreateWishInput, UserProfile } from "../types";
import { Notice } from "../types/notice";
import { useAuth } from "./useAuthHook";
import { useWishesContext } from "../contexts/WishesContext";
import { useWallet } from "./useWallet";
import { db } from "../lib/firebase";
import {
  collection,
  doc,
  runTransaction,
  Transaction,
  serverTimestamp,
  increment,
  deleteField,
  query,
  where,
  getDocs,
} from "firebase/firestore";

import { calculateDecayedValue, toMilli, fromMilli, WORLD_CONSTANTS, getMillis } from "../logic/worldPhysics";
import { addNotice } from "../utils/addNotice";
import { MESSAGES } from "../constants/messages";

// NOTE: This hook uses MESSAGES for UI strings so they are language-agnostic at the source.
// Notices written to Firestore use Japanese (JA) as canonical language keys; the UI layer
// localizes them when rendering (via JournalView / NoticePanel).

// タイムスタンプと初期値から現在価値を計算

export const useWishActions = () => {
  const { user } = useAuth();
  const { addOptimisticWish, updateOptimisticWish } = useWishesContext();
  const { setOptimisticBalanceOffset, setOptimisticCommittedOffset } = useWallet();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 通知を静かに送るユーティリティ
  const sendNoticeSilently = async (noticeData: { 
    userId: string; 
    message: string; 
    messageKey?: string;
    params?: Record<string, string>;
    type: Notice["type"]; 
    fromId?: string;
  }) => {
    try {
      await addNotice({
        userId: noticeData.userId,
        fromId: noticeData.fromId || user?.uid || "system",
        message: noticeData.message,
        messageKey: noticeData.messageKey,
        params: noticeData.params,
        type: noticeData.type,
        createdAt: Date.now(),
      });
    } catch (error) {
      console.error("Notice failed to send, but action proceeded:", error);
    }
  };

  // Calculate costs matches logic in UI/Types
  // Calculate costs matches logic in UI/Types
  const costMap: Record<string, number> = { light: 0, medium: 500, heavy: 1000 };



  const castWish = async (input: CreateWishInput): Promise<boolean> => {
    if (!db) {
      alert(MESSAGES.WISH_ACTIONS.ALERT_DB_ERROR);
      return false;
    }
    if (!user) {
      alert(MESSAGES.WISH_ACTIONS.ALERT_NOT_LOGGED_IN);
      return false;
    }

    setIsSubmitting(true);

    const userRef = doc(db, "users", user.uid);
    const wishId = `wish_${user.uid}_${Date.now()}`;
    const wishRef = doc(db, "wishes", wishId); 
    const bounty = costMap[input.tier];

    // Optimistic Update
    const tempId = wishRef.id;
    const optimisticWish: Wish = {
      id: tempId,
      requester_id: user.uid,
      requester_name: MESSAGES.WISH_ACTIONS.PENDING_PROPAGATION, 
      content: input.content,
      gratitude_preset: input.tier,
      status: "open",
      cost: bounty,
      created_at: Date.now(),
      isAnonymous: input.isAnonymous || false,
      isOptimistic: true
    };

    addOptimisticWish(optimisticWish);
    setOptimisticCommittedOffset((prev: number) => prev + bounty);

    try {
      const now = Date.now();
      const wishesRef = collection(db, 'wishes');
      
      // Simple Physics Solvency Check: Query all active wishes to sum their current values
      const activeQ = query(
        wishesRef, 
        where('requester_id', '==', user.uid), 
        where('status', 'in', ['open', 'in_progress', 'review_pending'])
      );
      const activeSnap = await getDocs(activeQ);
      let queryCommittedMilli = 0;
      activeSnap.forEach(wishDoc => {
        const w = wishDoc.data();
        const initialCost = w.cost || costMap[w.gratitude_preset as string] || 0;
        const wElapsedSec = Math.max(0, ((now - getMillis(w.created_at)) / 1000) | 0);
        queryCommittedMilli += calculateDecayedValue(toMilli(initialCost), wElapsedSec);
      });

      await runTransaction(db, async (transaction: Transaction) => {
        // 1. Get User Data
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists()) throw "User profile not found";

        const data = userDoc.data() as UserProfile;
        const cycleStartedAt = getMillis(data.cycle_started_at, 0);
        if (cycleStartedAt === 0) throw "Vessel not initialized (cycle_started_at missing)";

        const elapsedSec = ((now - cycleStartedAt) / 1000) | 0;
        
        // 【世界の理】器の現在の価値（2400からの減価）
        const initialVesselMilli = toMilli(WORLD_CONSTANTS.REBIRTH_AMOUNT);
        const decayedVesselMilli = calculateDecayedValue(initialVesselMilli, elapsedSec);
        
        // 【世界の理】現在の有効残高 = 器の価値 - 確定済み移動額 - 予約中の願いの価値
        const totalSpentMilli = toMilli(data.spent_lm || 0);
        const availableMilli = decayedVesselMilli - totalSpentMilli - queryCommittedMilli;

        if (availableMilli < toMilli(bounty)) {
          throw new Error(
            `手持ちが不足しています (Available: ${Math.floor(fromMilli(availableMilli))}, Required: ${bounty})`
          );
        }

        // === ATOMIC UPDATE: Fixed Anchor Model ===
        // Lm does NOT move yet. Only stats and wish creation.
        transaction.update(userRef, {
          created_contracts: increment(1),
        });

        // 3. Create Wish
        transaction.set(wishRef, {
          requester_id: user.uid,
          requester_name: userDoc.data().name || user.displayName || MESSAGES.WISH_ACTIONS.FALLBACK_PLAYER, // 初期値として入れておくが、UI側でNameResolverが追跡する
          content: input.content,
          gratitude_preset: input.tier,
          status: "open",
          cost: bounty,
          requester_trust_score: data.completed_contracts || 0,
          requester_completed_requests: data.completed_requests || 0,
          created_at: new Date(now),
          isAnonymous: input.isAnonymous || false,
        });
      });

      console.log("Wish Cast:", input, { bounty });
      // Clear offset (Real update will take over)
      setOptimisticCommittedOffset((prev: number) => Math.max(0, prev - bounty));
      return true;
    } catch (e) {
      console.error("Failed to cast wish:", e);
      const errorMessage = e instanceof Error ? e.message : String(e);
      
      // 【慈悲】: 失敗時はデータを消さずにエラーをマークする
      updateOptimisticWish(tempId, { error: errorMessage });
      setOptimisticCommittedOffset((prev: number) => Math.max(0, prev - bounty));
      
      alert(`${MESSAGES.WISH_ACTIONS.ALERT_CAST_FAILED} ${errorMessage}`);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const applyForWish = async (wishId: string): Promise<boolean> => {
    if (!db || !user) return false;
    setIsSubmitting(true);

    try {
      const wishRef = doc(db, "wishes", wishId);
      const userRef = doc(db, "users", user.uid);

      await runTransaction(db, async (transaction: Transaction) => {
        const wishDoc = await transaction.get(wishRef);
        if (!wishDoc.exists()) throw "Wish not found";

        const userData = (await transaction.get(userRef)).data();
        const applicantInfo = {
          id: user.uid,
          name: userData?.name || user.displayName || MESSAGES.WISH_ACTIONS.FALLBACK_APPLICANT, 
          trust_score: userData?.completed_contracts || 0,
          contact_email: user.email || undefined,
        };

        // Add to applicants array (Union)
        // Note: Firestore arrayUnion is simpler but transaction is safer for reading state first
        const currentApplicants = wishDoc.data().applicants || [];
        const currentApplicantIds = wishDoc.data().applicant_ids || [];
        if (currentApplicants.some((a: { id: string }) => a.id === user.uid)) {
          throw "Already applied";
        }

        transaction.update(wishRef, {
          applicants: [...currentApplicants, applicantInfo],
          applicant_ids: [...currentApplicantIds, user.uid],
        });
      });

      // 通知: 願い主に「応募がありました」を送る
      const wishDocSnap = await getDocs(query(collection(db, 'wishes'), where('__name__', '==', wishId)));
      if (!wishDocSnap.empty) {
        const wishData = wishDocSnap.docs[0].data();
        const applicantName = user.displayName || MESSAGES.WISH_ACTIONS.FALLBACK_APPLICANT;
        sendNoticeSilently({
          userId: wishData.requester_id,
          message: MESSAGES.WISH_ACTIONS.NOTICE_APPLICATION.replace('%name', applicantName),
          messageKey: "NOTICE_APPLICATION",
          params: { name: applicantName },
          type: "application_received",
        });
      }

      return true;
    } catch (e) {
      console.error(e);
      alert(MESSAGES.WISH_ACTIONS.ALERT_APPLY_FAILED);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const approveWish = async (
    wishId: string,
    applicantId: string,
    contactNote?: string,
  ): Promise<boolean> => {
    if (!db || !user) return false;
    setIsSubmitting(true);
    try {
      const wishRef = doc(db, "wishes", wishId);
      
      await runTransaction(db, async (transaction: Transaction) => {
          const wishDoc = await transaction.get(wishRef);
          if (!wishDoc.exists()) throw "Wish not found";
          
          const data = wishDoc.data();
          const applicants = data.applicants || [];
          const selectedApplicant = applicants.find((a: { id: string }) => a.id === applicantId);
          
          if (!selectedApplicant) throw "Applicant not found";

          transaction.update(wishRef, {
            status: "in_progress",
            helper_id: applicantId,
            helper_name: selectedApplicant.name || "",
            accepted_at: serverTimestamp(),
            contact_note: contactNote || "",
            requester_contact_email: user.email || "",
            helper_contact_email: selectedApplicant.contact_email || "",
          });
      });

      // 通知: 助け手に「承諾されました」を送る
      sendNoticeSilently({
        userId: applicantId,
        message: MESSAGES.WISH_ACTIONS.NOTICE_APPROVED,
        messageKey: "NOTICE_APPROVED",
        type: "wish_approved",
      });

      return true;
    } catch (e) {
      console.error(e);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const reportCompletion = async (wishId: string): Promise<boolean> => {
    if (!db || !user) return false;
    setIsSubmitting(true);
    try {
      const wishRef = doc(db, "wishes", wishId);
      await runTransaction(db, async (transaction: Transaction) => {
          const wishDoc = await transaction.get(wishRef);
          if (!wishDoc.exists()) throw "Wish not found";
          
          if (wishDoc.data().helper_id !== user.uid) throw "Not authorized to report completion";
          
          transaction.update(wishRef, {
            status: "review_pending",
            updated_at: serverTimestamp()
          });
      });

      // 通知: 依頼主に「完了報告」を送る
      const wishSnap = await getDocs(query(collection(db, 'wishes'), where('__name__', '==', wishId)));
      if (!wishSnap.empty) {
        sendNoticeSilently({
          userId: wishSnap.docs[0].data().requester_id,
          message: MESSAGES.WISH_ACTIONS.NOTICE_COMPLETION_PENDING,
          messageKey: "NOTICE_COMPLETION_PENDING",
          type: "wish_fulfilled", // Review pending通知として流用
        });
      }

      return true;
    } catch (e) {
      console.error(e);
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
          // === 補償キャンセル (Compensation Logic) ===
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

          // Calculate Value of Wish being cancelled (for compensation)
          const wishElapsedSec = ((now - getMillis(wishData.created_at)) / 1000) | 0;
          const wishDecayedMilli = calculateDecayedValue(toMilli(wishData.cost || 0), wishElapsedSec);
          
          // Calculate Requester's State (Fixed Anchor Model)
          const rElapsedSec = ((now - rCycleStart) / 1000) | 0;
          const rDecayedVesselMilli = calculateDecayedValue(toMilli(WORLD_CONSTANTS.REBIRTH_AMOUNT), rElapsedSec);
          const rCurrentRealMilli = Math.max(0, rDecayedVesselMilli - toMilli(rSpent));
          
          const txId = isRequesterCanceling 
              ? `compensate_${wishId}_TO_${wishData.helper_id}`
              : `compensate_${wishId}_TO_${wishData.requester_id}`;
          const txRef = doc(collection(db!, "transactions"), txId);
          const txCheck = await transaction.get(txRef);

          if (isRequesterCanceling) {
            // Compensation is capped by current available pool
            const actualPaymentMilli = Math.min(rCurrentRealMilli, wishDecayedMilli);
            
            // Requester pays
            transaction.update(requesterRef, {
              spent_lm: rSpent + fromMilli(actualPaymentMilli),
              consecutive_completions: 0, 
              has_cancellation_history: true, 
            });

            // Helper receives
            const hData = helperDoc.data() as UserProfile;
            const hCycleStart = getMillis(hData.cycle_started_at, 0);
            const hDecayedVesselMilli = calculateDecayedValue(toMilli(WORLD_CONSTANTS.REBIRTH_AMOUNT), ((now - hCycleStart) / 1000) | 0);
            
            // Wall check: spent >= decayedVessel - 2400
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

            // 永続通知: ヘルパーへ
            sendNoticeSilently({
              userId: wishData.helper_id,
              message: notificationMsg,
              messageKey: "NOTICE_REQUESTER_CANCEL",
              type: "wish_cancelled",
            });

            if (!txCheck.exists()) {
                // 1. Sender (Requester) Record
                transaction.set(txRef, {
                  owner_id: wishData.requester_id,
                  type: "COMPENSATION",
                  amount: fromMilli(actualPaymentMilli), 
                  created_at: serverTimestamp(),
                  sender_id: wishData.requester_id,
                  sender_name: rName, 
                  recipient_id: wishData.helper_id,
                  recipient_name: hName,
                  wish_title: wishData.content,
                  wish_id: wishId,
                  description: "compensation_sender"
                });

                // 2. Recipient (Helper) Record
                const rxRef = doc(collection(db!, "transactions"), `${txId}_RX`);
                transaction.set(rxRef, {
                  owner_id: wishData.helper_id,
                  type: "COMPENSATION",
                  amount: fromMilli(actualPaymentMilli), 
                  created_at: serverTimestamp(),
                  sender_id: wishData.requester_id,
                  sender_name: rName, 
                  recipient_id: wishData.helper_id,
                  recipient_name: hName,
                  wish_title: wishData.content,
                  wish_id: wishId,
                  description: "compensation_recv"
                });
            }
            transaction.delete(wishRef);
          } else {
            // HELPER CANCELS (No payment)
            transaction.update(helperRef, {
              consecutive_completions: 0, 
              has_cancellation_history: true,
            });

            transaction.update(requesterRef, {
                pending_interruption_notification: MESSAGES.WISH_ACTIONS.NOTICE_HELPER_WAIT_RETURN,
            });

            // 永続通知: リクエスターへ
            sendNoticeSilently({
              userId: wishData.requester_id,
              message: MESSAGES.WISH_ACTIONS.NOTICE_HELPER_RESIGNED,
              messageKey: "NOTICE_HELPER_RESIGNED",
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
          // Open Status Cancel - No Lm moves, just delete wish
          transaction.delete(wishRef);

          const txId = `cancel_${wishId}`;
          const txRef = doc(collection(db!, "transactions"), txId);
          transaction.set(txRef, {
            type: "WISH_CANCELLED",
            owner_id: user.uid,
            amount: 0,
            created_at: serverTimestamp(),
            sender_id: user.uid,
            sender_name: wishData.requester_name || MESSAGES.WISH_ACTIONS.FALLBACK_REQUESTER,
            recipient_id: wishData.helper_id || null,
            recipient_name: wishData.helper_name || null,
            wish_title: wishData.content,
            wish_id: wishId,
            description: "user_cancellation"
          });
        }
      });

      return true;
    } catch (error) {
      console.error("Cancel failed:", error);
      // alert("キャンセルに失敗しました"); // Removed to let WishCard handle with Toast
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const resignWish = async (wishId: string): Promise<boolean> => {
    if (!db || !user) return false;
    setIsSubmitting(true);
    try {
      const wishRef = doc(db, "wishes", wishId);
      const userRef = doc(db, "users", user.uid);

      await runTransaction(db, async (transaction) => {
        const wishDoc = await transaction.get(wishRef);
        if (!wishDoc.exists()) throw "Wish not found";

        const wishData = wishDoc.data();
        const rRef = doc(db!, 'users', wishData.requester_id);
        
        // --- READS FIRST ---
        await transaction.get(userRef);
        await transaction.get(rRef);

        // --- WRITES ---
        // 1. Remove from Applicants (Clean Slate)
        const currentApplicants = wishData.applicants || [];
        const updatedApplicants = currentApplicants.filter(
            (a: { id: string }) => a.id !== user.uid
        );
        const currentApplicantIds = wishData.applicant_ids || [];
        const updatedApplicantIds = currentApplicantIds.filter(
            (id: string) => id !== user.uid
        );

        // 2. Reset Helper Stats (Social Constraint / The Crack)
        transaction.update(userRef, {
            consecutive_completions: 0,
            has_cancellation_history: true,
            last_updated: serverTimestamp()
        });

        // Notify Requester
        transaction.update(rRef, {
            pending_interruption_notification: MESSAGES.WISH_ACTIONS.NOTICE_HELPER_WAIT_RETURN,
            last_updated: serverTimestamp()
        });

        // 永続通知: リクエスターへ
        sendNoticeSilently({
          userId: wishData.requester_id,
          message: MESSAGES.WISH_ACTIONS.NOTICE_HELPER_RESIGNED,
          messageKey: "NOTICE_HELPER_RESIGNED",
          type: "helper_resigned",
        });

        // 3. Reset Wish Status
        transaction.update(wishRef, {
            status: "open",
            applicants: updatedApplicants,
            applicant_ids: updatedApplicantIds,
            helper_id: deleteField(),
            accepted_at: deleteField(),
            system_note: MESSAGES.WISH_ACTIONS.SYS_NOTE_REOPEN2
        });
      });

      return true;
    } catch (e) {
      console.error("Failed to resign wish:", e);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateWish = async (
    wishId: string,
    newContent: string,
  ): Promise<boolean> => {
    if (!db || !user) return false;
    if (!newContent.trim()) return false;

    setIsSubmitting(true);
    try {
      const wishRef = doc(db, "wishes", wishId);
      await runTransaction(db, async (transaction) => {
          const wishDoc = await transaction.get(wishRef);
          if (!wishDoc.exists()) throw "Wish not found";
          
          const data = wishDoc.data();
          if (data.requester_id !== user.uid) throw "Not authorized to update this wish";
          if (data.status !== 'open') throw "Wish is already in progress and cannot be edited";

          transaction.update(wishRef, {
            content: newContent,
            updated_at: serverTimestamp(),
          });
      });
      return true;
    } catch (e) {
      console.error("Failed to update wish:", e);
      alert(`${MESSAGES.WISH_ACTIONS.ALERT_UPDATE_FAILED} ${e instanceof Error ? e.message : String(e)}`);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const fulfillWish = async (
    wishId: string,
    fulfillerId: string,
    message?: string, // Added message parameter
  ): Promise<boolean> => {
    if (!db) return false;
    setIsSubmitting(true);

    const wishRef = doc(db, "wishes", wishId);
    const fulfillerRef = doc(db, "users", fulfillerId);

    try {
      const now = Date.now();
      
      // Pre-Transaction Reads: Need issuer ID to query their active wishes for solvency
      const wishesRef = collection(db, 'wishes');
      const wDocInitial = await getDocs(query(collection(db, 'wishes'), where('__name__', '==', wishId)));
      if (wDocInitial.empty) throw "Wish not found (initial check)";
      const wDataInitial = wDocInitial.docs[0].data();
      const issuerId = wDataInitial.requester_id;

      // Simple Physics Solvency Check: Query all active wishes of the ISSUER
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
        // --- 1. ALL READS MUST COME FIRST ---
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

        // --- 2. CALCULATION & WRITES ---
        const wishElapsedSec = ((now - getMillis(wishData.created_at)) / 1000) | 0;
        const wishDecayedMilli = calculateDecayedValue(toMilli(wishData.cost || 0), wishElapsedSec);

        // Check Issuer Solvency (Using query-based sum)
        let paymentMilli = wishDecayedMilli;
        if (issuerDoc.exists()) {
             const issuerData = issuerDoc.data() as UserProfile;
             const iCycleStart = getMillis(issuerData.cycle_started_at, 0);
             const iSpent = issuerData.spent_lm || 0;
             const iElapsedSec = ((now - iCycleStart) / 1000) | 0;
             const iDecayedVesselMilli = calculateDecayedValue(toMilli(WORLD_CONSTANTS.REBIRTH_AMOUNT), iElapsedSec);
             const iCurrentRealMilli = Math.max(0, iDecayedVesselMilli - toMilli(iSpent));
             
             // Solvency check: Balance must cover all commissions
             const activeCommittedExceptThisMilli = Math.max(0, issuerQueryCommittedMilli - wishDecayedMilli);
             const availableForThisPaymentMilli = Math.max(0, iCurrentRealMilli - activeCommittedExceptThisMilli);
             paymentMilli = Math.min(wishDecayedMilli, availableForThisPaymentMilli);
        } else {
             paymentMilli = 0;
        }
        
        const isBankruptcy = paymentMilli < wishDecayedMilli;
        const paymentAmount = fromMilli(paymentMilli);

        // Reward Fulfiller
        if (fulfillerDoc.exists()) {
          const fData = fulfillerDoc.data() as UserProfile;
          const fCycleStart = getMillis(fData.cycle_started_at, 0);
          const fDecayedVesselMilli = calculateDecayedValue(toMilli(WORLD_CONSTANTS.REBIRTH_AMOUNT), ((now - fCycleStart) / 1000) | 0);
          
          // Wall check
          const minFSpentMilli = fDecayedVesselMilli - toMilli(WORLD_CONSTANTS.REBIRTH_AMOUNT);
          const fSpentMilli = toMilli(fData.spent_lm || 0);
          const newFSpentMilli = Math.max(minFSpentMilli, fSpentMilli - paymentMilli);

          transaction.update(fulfillerRef, {
            spent_lm: fromMilli(newFSpentMilli),
            completed_contracts: increment(1),
            consecutive_completions: (fData.consecutive_completions || 0) + 1,
          });
        }

        // Salvation for Issuer
        if (issuerDoc.exists()) {
          const issuerProfile = issuerDoc.data() as UserProfile;
          const currentSpent = issuerProfile.spent_lm || 0;
          transaction.update(issuerRef, {
            spent_lm: currentSpent + paymentAmount,
            completed_requests: increment(1),
          });
        }

        transaction.delete(wishRef);

        const tags = wishData.tags || [];
        let txType = "SPARK";
        if (paymentAmount === 0) txType = "PRICELESS";
        else if (paymentAmount >= 900) txType = "BONFIRE";
        else if (paymentAmount >= 400) txType = "CANDLE";

        // 1. Sender (Issuer) Record
        transaction.set(txRef, {
          owner_id: wishData.requester_id,
          amount: paymentAmount,
          timestamp: serverTimestamp(),
          created_at: serverTimestamp(),
          type: "WISH_FULFILLMENT",
          sub_type: txType,
          wish_id: wishId,
          wish_title: wishData.content,
          sender_id: wishData.requester_id,
          sender_name: issuerDoc.data()?.name || wishData.requester_name || MESSAGES.WISH_ACTIONS.FALLBACK_REQUESTER,
          recipient_id: fulfillerId,
          recipient_name: fulfillerDoc.data()?.name || wishData.helper_name || MESSAGES.WISH_ACTIONS.FALLBACK_HELPER,
          tags: tags,
          description: isBankruptcy 
            ? "wish_bankrupt_sender"
            : paymentAmount === 0
              ? "wish_priceless"
              : "wish_fulfill_sender",
          message: message || null 
        });

        // 2. Recipient (Fulfiller) Record
        const rxRef = doc(collection(db!, "transactions"), `${txId}_RX`);
        transaction.set(rxRef, {
          owner_id: fulfillerId,
          amount: paymentAmount,
          timestamp: serverTimestamp(),
          created_at: serverTimestamp(),
          type: "WISH_FULFILLMENT",
          sub_type: txType,
          wish_id: wishId,
          wish_title: wishData.content,
          sender_id: wishData.requester_id,
          sender_name: issuerDoc.data()?.name || wishData.requester_name || MESSAGES.WISH_ACTIONS.FALLBACK_REQUESTER,
          recipient_id: fulfillerId,
          recipient_name: fulfillerDoc.data()?.name || wishData.helper_name || MESSAGES.WISH_ACTIONS.FALLBACK_HELPER,
          tags: tags,
          description: isBankruptcy 
            ? "wish_bankrupt_recv"
            : paymentAmount === 0
              ? "wish_priceless"
              : "wish_fulfill_recv",
          message: message || null 
        });

        const today = new Date().toISOString().split("T")[0];
        const dailyStatsRef = doc(db!, "daily_stats", today);
        transaction.set(dailyStatsRef, {
          volume: increment(paymentAmount),
          updated_at: serverTimestamp(),
        }, { merge: true });
      });

      setOptimisticBalanceOffset(0);

      // 通知: 助け手に「源気が届けられました」を送る
      sendNoticeSilently({
        userId: fulfillerId,
        message: MESSAGES.WISH_ACTIONS.NOTICE_FULFILLED,
        messageKey: "NOTICE_FULFILLED",
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


  const withdrawApplication = async (wishId: string): Promise<boolean> => {
    if (!db || !user) return false;
    setIsSubmitting(true);
    try {
      const wishRef = doc(db, "wishes", wishId);
      await runTransaction(db, async (transaction) => {
        const wishDoc = await transaction.get(wishRef);
        if (!wishDoc.exists()) throw "Wish not found";

        const currentApplicants = wishDoc.data().applicants || [];
        const updatedApplicants = currentApplicants.filter(
          (a: { id: string }) => a.id !== user.uid,
        );
        const currentApplicantIds = wishDoc.data().applicant_ids || [];
        const updatedApplicantIds = currentApplicantIds.filter(
          (id: string) => id !== user.uid,
        );

        transaction.update(wishRef, {
          applicants: updatedApplicants,
          applicant_ids: updatedApplicantIds,
        });
      });
      return true;
    } catch (e) {
      console.error("Failed to withdraw application:", e);
      alert("取り消しに失敗しました");
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Wrapper for backward compatibility
  const acceptWish = async (wishId: string) => {
    if (!user) return false;
    return fulfillWish(wishId, user.uid);
  };

  return {
    castWish,
    fulfillWish,
    applyForWish,
    approveWish,
    reportCompletion,
    acceptWish,
    cancelWish,
    resignWish,
    updateWish,
    withdrawApplication,
    expireWish: async (wishId: string): Promise<boolean> => {
      if (!db || !user) return false;
      setIsSubmitting(true);
      try {
        const wishRef = doc(db, "wishes", wishId);
        
        await runTransaction(db, async (transaction: Transaction) => {
          const wishDoc = await transaction.get(wishRef);
          if (!wishDoc.exists()) throw "Wish not found";
          const wishData = wishDoc.data();

          // EXPIRE Wish (Disappearing Card Specification)
          // Cards are deleted after being captured in the journal (transactions).
          transaction.delete(wishRef);

          // 2. Log to Journal (amount: 0)
          const txId = `expire_${wishId}`;
          const txRef = doc(collection(db!, "transactions"), txId);
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
        });

        return true;
      } catch (e) {
        console.error("Failed to expire wish:", e);
        alert("整理に失敗しました");
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    reactivateWish: async (wishId: string, status?: 'open' | 'in_progress', helperId?: string): Promise<boolean> => {
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
              updated_at: serverTimestamp() as unknown as number, // Cast FieldValue to number for type compliance
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
    },
    isSubmitting,
  };
};
