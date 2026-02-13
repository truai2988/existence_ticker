import { useState } from "react";
import { Wish, CreateWishInput, UserProfile } from "../types";
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

// タイムスタンプと初期値から現在価値を計算

export const useWishActions = () => {
  const { user } = useAuth();
  const { addOptimisticWish, updateOptimisticWish } = useWishesContext();
  const { setOptimisticBalanceOffset, setOptimisticCommittedOffset } = useWallet();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculate costs matches logic in UI/Types
  const costMap = { light: 100, medium: 500, heavy: 1000 };

  const castWish = async (input: CreateWishInput): Promise<boolean> => {
    if (!db) {
      alert("データベースエラー: 接続されていません。");
      return false;
    }
    if (!user) {
      alert("エラー: ログインしていません。");
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
      requester_name: "伝搬中...", 
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
      await runTransaction(db, async (transaction: Transaction) => {
        // 1. Get User Data
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists()) throw "User profile not found";

        const data = userDoc.data();
        const currentBalance = data.balance || 0;
        const lastUpdated = getMillis(data.last_updated);

        const elapsedSec = ((Date.now() - lastUpdated) / 1000) | 0;
        const currentBalanceMilli = toMilli(currentBalance);
        const decayedBalanceMilli = calculateDecayedValue(currentBalanceMilli, elapsedSec);

        // === Phase 2: Read & Decay committed_lm ===
        const currentCommittedMilli = toMilli(data.committed_lm || 0);
        const decayedCommittedMilli = calculateDecayedValue(currentCommittedMilli, elapsedSec);
        
        const availableMilli = decayedBalanceMilli - decayedCommittedMilli;

        // Gravity Stats: Sum up lost Lm
        const totalDecayMilli = Math.max(0, (currentBalanceMilli - decayedBalanceMilli) + (currentCommittedMilli - decayedCommittedMilli));

        if (availableMilli < toMilli(bounty)) {
          throw new Error(
            `手持ちが不足しています (Available: ${Math.floor(fromMilli(availableMilli))}, Required: ${bounty}) - 約束中の光を考慮済み`,
          );
        }

        // === ATOMIC UPDATE: Balance + Committed ===
        transaction.update(userRef, {
          balance: fromMilli(decayedBalanceMilli),
          committed_lm: fromMilli(decayedCommittedMilli + toMilli(bounty)),
          created_contracts: increment(1),
          last_updated: serverTimestamp(),
        });

        // Log Global Stats
        if (totalDecayMilli > 0) {
            const globalStatsRef = doc(db!, WORLD_CONSTANTS.GLOBAL_METABOLISM_PATH);
            transaction.set(globalStatsRef, {
                total_decayed_stats: increment(fromMilli(totalDecayMilli)),
                updated_at: serverTimestamp()
            }, { merge: true });
        }

        // 3. Create Wish
        transaction.set(wishRef, {
          requester_id: user.uid,
          requester_name: userDoc.data().name || "Anonymous Soul",
          content: input.content,
          gratitude_preset: input.tier,
          status: "open",
          cost: bounty,
          requester_trust_score: data.completed_contracts || 0,
          requester_completed_requests: data.completed_requests || 0,
          created_at: serverTimestamp(),
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
      
      alert(`願いを届けることができませんでした: ${errorMessage}`);
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
          name: userData?.name || "Anonymous",
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
      return true;
    } catch (e) {
      console.error(e);
      alert("応募に失敗しました");
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
      const wishRef = doc(db, "wishes", wishId);
      await runTransaction(db, async (transaction: Transaction) => {
        const wishDoc = await transaction.get(wishRef);
        if (!wishDoc.exists()) throw "Wish does not exist";
        const wishData = wishDoc.data();

        if (wishData.status === "in_progress") {
          // === 補償キャンセル (Compensation Logic) ===
          
          // Determine who is canceling
          const isRequesterCanceling = wishData.requester_id === user.uid;
          const isHelperCanceling = wishData.helper_id === user.uid;
          
          if (!isRequesterCanceling && !isHelperCanceling) {
            throw "You are not authorized to cancel this wish";
          }
          
          // 1. Fetch Requester Data FIRST to check solvency
          const requesterRef = doc(db!, "users", wishData.requester_id);
          const requesterDoc = await transaction.get(requesterRef);
          if (!requesterDoc.exists()) throw "Requester not found";
          
          const rData = requesterDoc.data();
          const rBalance = rData?.balance || 0;
          const rLastUpdated = getMillis(rData?.last_updated);
          const rName = rData?.name || "Requester";
          const rCommittedLm = rData?.committed_lm || 0;

          // 2. Fetch Helper Data
          const helperRef = doc(db!, "users", wishData.helper_id);
          const helperDoc = await transaction.get(helperRef);
          if (!helperDoc.exists()) throw "Helper not found";
          
          const hName = helperDoc.data()?.name || "Helper";

          // 3. Calculate PHYSICAL TRUTHS (All Decayed)
          const now = Date.now();
          const wishElapsedSec = ((now - getMillis(wishData.created_at)) / 1000) | 0;
          const wishDecayedMilli = calculateDecayedValue(toMilli(wishData.cost || 0), wishElapsedSec);
          
          // Requester's Real Holding (Now)
          const rElapsedSec = ((now - rLastUpdated) / 1000) | 0;
          const rDecayedMilli = calculateDecayedValue(toMilli(rBalance), rElapsedSec);
          const rCommittedMilli = calculateDecayedValue(toMilli(rCommittedLm), rElapsedSec);

          // 4. PRE-FETCH Transaction Log (Idempotency Check) - MUST BE BEFORE ANY WRITES
          const txId = isRequesterCanceling 
              ? `compensate_${wishId}_TO_${wishData.helper_id}`
              : `compensate_${wishId}_TO_${wishData.requester_id}`;
          const txRef = doc(collection(db!, "transactions"), txId);
          const txCheck = await transaction.get(txRef);

          if (isRequesterCanceling) {
            const actualPaymentMilli = Math.min(Math.max(0, rDecayedMilli - rCommittedMilli + wishDecayedMilli), wishDecayedMilli);
            
            // Gravity Calculation (Naturally decayed Lm)
            const rDecayMilli = toMilli(rBalance) - rDecayedMilli;
            const cDecayMilli = toMilli(rCommittedLm) - rCommittedMilli;
            
            // === ATOMIC UPDATE: Balance - Payment, Committed - Reservation ===
            transaction.update(requesterRef, {
              balance: fromMilli(rDecayedMilli - actualPaymentMilli),
              committed_lm: fromMilli(Math.max(0, rCommittedMilli - wishDecayedMilli)), 
              consecutive_completions: 0, 
              has_cancellation_history: true, 
              last_updated: serverTimestamp(),
            });

            // Helper Update (with Overflow/Solar Return logic)
            const hData = helperDoc.data();
            const hBalanceLm = hData?.balance || 0;
            const hLastUpdated = getMillis(hData?.last_updated);
            const hElapsedSec = ((now - hLastUpdated) / 1000) | 0;
            const hCurrentDecayedMilli = calculateDecayedValue(toMilli(hBalanceLm), hElapsedSec);
            const hRawNewMilli = hCurrentDecayedMilli + actualPaymentMilli;

            const hCappedMilli = Math.min(hRawNewMilli, WORLD_CONSTANTS.MAX_VESSEL_CAPACITY_MILLI);
            const hOverflowMilli = Math.max(0, hRawNewMilli - WORLD_CONSTANTS.MAX_VESSEL_CAPACITY_MILLI);
            const hDecayMilli = toMilli(hBalanceLm) - hCurrentDecayedMilli;

            transaction.update(helperRef, {
              balance: fromMilli(hCappedMilli),
              last_updated: serverTimestamp(),
            });

            // Log Global Stats: Naturally decayed Lm + Overflow to global metabolism
            const totalDecayMilli = Math.max(0, rDecayMilli + cDecayMilli + hDecayMilli + hOverflowMilli);
            const globalStatsRef = doc(db!, WORLD_CONSTANTS.GLOBAL_METABOLISM_PATH);
            transaction.set(globalStatsRef, {
                total_decayed_stats: increment(fromMilli(totalDecayMilli)),
                updated_at: serverTimestamp()
            }, { merge: true });

            // 6. Care for the Left-Behind: Set Notification
            const partnerRef = helperRef;
            const notificationMsg = "依頼主様のご都合により願いが中断されました。しるしとしてLmが補償されています。";
            
            transaction.update(partnerRef, {
                pending_interruption_notification: notificationMsg,
                last_updated: serverTimestamp()
            });

            // 7. Log Global Transaction (Crystallization)
            if (!txCheck.exists()) {
                transaction.set(txRef, {
                  type: "COMPENSATION",
                  amount: fromMilli(actualPaymentMilli), 
                  created_at: serverTimestamp(),
                  sender_name: rName, 
                  recipient_name: hName,
                  wish_title: wishData.content,
                  wish_id: wishId,
                  description: "依頼主が中断したため、誠実のしるしをお渡ししました"
                });
            }

            // 8. CRYSTALLIZE Wish (Physical Deletion)
            transaction.delete(wishRef);
          } else {
            // === HELPER CANCELS: Purification (No Penalty, Just Recast) ===
            const hData = helperDoc.data();
            const hBalance = hData?.balance || 0;
            const hLastUpdated = getMillis(hData?.last_updated);
            const hElapsedSec = ((now - hLastUpdated) / 1000) | 0;
            const hCurrentDecayedMilli = calculateDecayedValue(toMilli(hBalance), hElapsedSec);
            
            // 1. Maintain Helper (No Lateral Penalty)
            transaction.update(helperRef, {
              balance: fromMilli(hCurrentDecayedMilli),
              consecutive_completions: 0, // Reputation penalty only
              has_cancellation_history: true,
              last_updated: serverTimestamp(),
            });

            // 2. Maintain Requester (Reservations stay for Re-broadcast)
            // Here we use rDecayedMilli and rCommittedMilli calculated earlier
            transaction.update(requesterRef, {
              balance: fromMilli(rDecayedMilli),
              committed_lm: fromMilli(rCommittedMilli),
              last_updated: serverTimestamp(),
            });

            // 3. Log Gravity (Naturally decayed Lm)
            const rDecayMilli = toMilli(rBalance) - rDecayedMilli;
            const cDecayMilli = toMilli(rCommittedLm) - rCommittedMilli;
            const hDecayMilli = toMilli(hBalance) - hCurrentDecayedMilli;
            const totalDecayMilli = Math.max(0, rDecayMilli + cDecayMilli + hDecayMilli);

            const globalStatsRef = doc(db!, WORLD_CONSTANTS.GLOBAL_METABOLISM_PATH);
            transaction.set(globalStatsRef, {
                total_decayed_stats: increment(fromMilli(totalDecayMilli)),
                updated_at: serverTimestamp()
            }, { merge: true });

            // 4. Care for the Left-Behind: Set Notification
            transaction.update(requesterRef, {
                pending_interruption_notification: "助け手様が辞退されたため、願いが再び募集に戻りました。Lmは安全に守られています。",
                last_updated: serverTimestamp()
            });
            
            // === HELPER CANCELS: RECAST Wish (Re-broadcast) ===
            transaction.update(wishRef, {
              status: "open",
              cancel_reason: "helper_interruption",
              cancelled_at: serverTimestamp(),
              helper_id: deleteField(),
              helper_name: deleteField(),
              helper_contact_email: deleteField(),
              accepted_at: deleteField(),
              system_note: "事情により、願いが再度募集されています。"
            });
          }
        } else {
          // === 通常キャンセル (Open Status) ===
          const requesterRef = doc(db!, "users", user.uid);
          const requesterDoc = await transaction.get(requesterRef);
          
          if (requesterDoc.exists()) {
            const rData = requesterDoc.data();
            const rBalance = rData?.balance || 0;
            const rLastUpdated = getMillis(rData?.last_updated);
            const rCommittedLm = rData?.committed_lm || 0;
            
            const now = Date.now();
            const rElapsedSec = ((now - rLastUpdated) / 1000) | 0;
            const rDecayedMilli = calculateDecayedValue(toMilli(rBalance), rElapsedSec);
            const rCommittedMilli = calculateDecayedValue(toMilli(rCommittedLm), rElapsedSec);

            const wishElapsedSec = ((now - getMillis(wishData.created_at)) / 1000) | 0;
            const wishDecayedMilli = calculateDecayedValue(toMilli(wishData.cost || 0), wishElapsedSec);

            transaction.update(requesterRef, {
              balance: fromMilli(rDecayedMilli), 
              committed_lm: fromMilli(Math.max(0, rCommittedMilli - wishDecayedMilli)), 
              last_updated: serverTimestamp(),
            });
          }

          transaction.delete(wishRef);

          const txId = `cancel_${wishId}`;
          const txRef = doc(collection(db!, "transactions"), txId);
          transaction.set(txRef, {
            type: "WISH_CANCELLED",
            amount: 0,
            created_at: serverTimestamp(),
            sender_id: user.uid,
            sender_name: wishData.requester_name || "Anonymous",
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
            pending_interruption_notification: "助け手様が辞退されたため、願いが再び募集に戻りました。Lmは安全に守られています。",
            last_updated: serverTimestamp()
        });

        // 3. Reset Wish Status
        transaction.update(wishRef, {
            status: "open",
            applicants: updatedApplicants,
            applicant_ids: updatedApplicantIds,
            helper_id: deleteField(),
            accepted_at: deleteField(),
            system_note: "事情により、願いが再度募集されています。"
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
      alert(`更新に失敗しました: ${e instanceof Error ? e.message : String(e)}`);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const fulfillWish = async (
    wishId: string,
    fulfillerId: string,
  ): Promise<boolean> => {
    if (!db) return false;
    setIsSubmitting(true);

    const database = db;

    const wishRef = doc(database, "wishes", wishId);
    const fulfillerRef = doc(database, "users", fulfillerId);

    // Optimistic Logic for Fulfillment
    let estimatedPayment = 0;

    try {
      // Pre-read for optimism (approximate)
      const wishSnap = await getDocs(query(collection(db!, "wishes"), where("__name__", "==", wishId)));
      if (!wishSnap.empty) {
          const wData = wishSnap.docs[0].data();
          const wElapsedSec = ((Date.now() - getMillis(wData.created_at)) / 1000) | 0;
          const wishDecayedMilli = calculateDecayedValue(toMilli(wData.cost || 0), wElapsedSec);
          estimatedPayment = fromMilli(wishDecayedMilli);
      }

      setOptimisticBalanceOffset((prev: number) => prev - estimatedPayment);

      await runTransaction(db, async (transaction) => {
        // --- 1. ALL READS MUST COME FIRST ---
        const wishDoc = await transaction.get(wishRef);
        if (!wishDoc.exists()) throw "Wish does not exist";

        const wishData = wishDoc.data();
        if (
          wishData.status === "fulfilled" ||
          wishData.status === "completed"
        ) {
          throw "Wish is already fulfilled";
        }

        // Issuer Ref
        const issuerRef = doc(database, "users", wishData.requester_id);
        const issuerDoc = await transaction.get(issuerRef);

        // Fulfiller Ref
        const fulfillerDoc = await transaction.get(fulfillerRef);

        // Transaction Log (Idempotency Check)
        const txId = `wish_${wishId}_PAY_${fulfillerId}`;
        const txRef = doc(collection(database, "transactions"), txId);
        const txDoc = await transaction.get(txRef);
        if (txDoc.exists()) {
             throw "Transaction already processed (Idempotency Check)";
        }

        // --- 2. CALCULATION & WRITES ---
        const wishElapsedSecForFulfill = ((Date.now() - getMillis(wishData.created_at)) / 1000) | 0;
        const wishDecayedMilliForFulfill = calculateDecayedValue(toMilli(wishData.cost || 0), wishElapsedSecForFulfill);

        // Check Issuer Solvency
        let paymentMilli = wishDecayedMilliForFulfill;
        if (issuerDoc.exists()) {
             const iData = issuerDoc.data() as UserProfile;
             const iLastUpdated = getMillis(iData.last_updated);
             const iElapsedSec = ((Date.now() - iLastUpdated) / 1000) | 0;
             const iCurrentRealMilli = calculateDecayedValue(toMilli(iData.balance || 0), iElapsedSec);
             const iCommittedMilli = calculateDecayedValue(toMilli(iData.committed_lm || 0), iElapsedSec);
             const availableForThisPaymentMilli = Math.max(0, iCurrentRealMilli - iCommittedMilli + wishDecayedMilliForFulfill);
             paymentMilli = Math.min(wishDecayedMilliForFulfill, availableForThisPaymentMilli);
        } else {
             paymentMilli = 0;
        }
        
        const isBankruptcy = paymentMilli < wishDecayedMilliForFulfill;
        const paymentAmount = fromMilli(paymentMilli);

        // Initialize metabolic sink for this transaction
        let totalDecayMilli = 0;

        // Reward Fulfiller
        if (fulfillerDoc.exists()) {
          const fData = fulfillerDoc.data();
          const fLastUpdated = getMillis(fData.last_updated);
          const fElapsedSec = ((Date.now() - fLastUpdated) / 1000) | 0;
          const fCurrentDecayedMilli = calculateDecayedValue(toMilli(fData.balance || 0), fElapsedSec);
          
          const rawNewMilli = fCurrentDecayedMilli + paymentMilli;
          
          const cappedMilli = Math.min(rawNewMilli, WORLD_CONSTANTS.MAX_VESSEL_CAPACITY_MILLI);
          const overflowMilli = Math.max(0, rawNewMilli - WORLD_CONSTANTS.MAX_VESSEL_CAPACITY_MILLI);

          // Gravity Calculation for Fulfiller
          const fDecayMilli = toMilli(fData.balance || 0) - fCurrentDecayedMilli;
          totalDecayMilli += fDecayMilli + overflowMilli;

          transaction.update(fulfillerRef, {
            balance: fromMilli(cappedMilli),
            completed_contracts: increment(1),
            last_updated: serverTimestamp(),
          });
        }

        // Salvation for Issuer
        if (issuerDoc.exists()) {
          const iData = issuerDoc.data() as UserProfile;
          const iLastUpdated = getMillis(iData.last_updated) || Date.now();
          const iElapsedSec = ((Date.now() - iLastUpdated) / 1000) | 0;
          const iCurrentRealMilli = calculateDecayedValue(toMilli(iData.balance || 0), iElapsedSec);
          const iCommittedMilli = calculateDecayedValue(toMilli(iData.committed_lm || 0), iElapsedSec);
          const wishDecayedMilli = wishDecayedMilliForFulfill;

          // Gravity Calculation for Issuer & Wish
          const iBalanceDecayMilli = toMilli(iData.balance || 0) - iCurrentRealMilli;
          const iCommittedDecayMilli = toMilli(iData.committed_lm || 0) - iCommittedMilli;
          const wishDecayMilli = toMilli(wishData.cost || 0) - wishDecayedMilli;
          totalDecayMilli += iBalanceDecayMilli + iCommittedDecayMilli + wishDecayMilli;

          const iNewBalanceMilli = iCurrentRealMilli - paymentMilli;
          const iNewCommittedMilli = Math.max(0, iCommittedMilli - wishDecayedMilli);
          const newStreak = (iData.consecutive_completions || 0) + 1;

          transaction.update(issuerRef, {
            balance: fromMilli(iNewBalanceMilli),
            committed_lm: fromMilli(iNewCommittedMilli),
            completed_requests: increment(1),
            consecutive_completions: newStreak,
            last_updated: serverTimestamp(),
          });
        }

        // Log Global Metabolic Stats (The Sun)
        if (totalDecayMilli > 0) {
            const globalStatsRef = doc(database, WORLD_CONSTANTS.GLOBAL_METABOLISM_PATH);
            transaction.set(globalStatsRef, {
                total_decayed_stats: increment(fromMilli(totalDecayMilli)),
                updated_at: serverTimestamp()
            }, { merge: true });
        }

        // Mark Wish Fulfilled by CRYSTALLIZING it (Physical Deletion)
        // Before deleting, ensure we have everything for the log
        const tags = wishData.tags || [];

        transaction.delete(wishRef);

        // Log Transaction with FULL metadata
        let txType = "SPARK";
        if (paymentAmount >= 900) txType = "BONFIRE";
        else if (paymentAmount >= 400) txType = "CANDLE";

        transaction.set(txRef, {
          amount: paymentAmount,
          timestamp: serverTimestamp(),
          created_at: serverTimestamp(),
          type: "WISH_FULFILLMENT",
          sub_type: txType,
          wish_id: wishId,
          wish_title: wishData.content,
          
          // Crystallized Names
          sender_name: issuerDoc.data()?.name || wishData.requester_name || "Anonymous Soul",
          recipient_id: fulfillerId,
          recipient_name: fulfillerDoc.data()?.name || wishData.helper_name || "Anonymous Helper",
          
          tags: tags,
          description: isBankruptcy ? "wish_fulfilled (Bankruptcy Partial Payment) [Crystallized]" : "wish_fulfilled [Crystallized]"
        });

        const today = new Date().toISOString().split("T")[0];
        const dailyStatsRef = doc(database, "daily_stats", today);
        transaction.set(dailyStatsRef, {
          volume: increment(paymentAmount),
          updated_at: serverTimestamp(),
        }, { merge: true });
      });

      setOptimisticBalanceOffset(0); // Clear on success
      return true;
    } catch (e) {
      console.error("Fulfillment failed:", e);
      setOptimisticBalanceOffset(0); // Clear on failure
      const errorMessage = e instanceof Error ? e.message : String(e);
      alert(`感謝の巡りに失敗しました: ${errorMessage}`);
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

          // EXPIRE Wish (Keep in vessel or specific handling)
          // 今回の「勝手に消さない」方針に基づき、一旦 status のみに留めるか、
          // 削除制限に従い delete は行わない。
          transaction.update(wishRef, {
            status: "expired",
            updated_at: serverTimestamp(),
            system_note: "期限を迎えましたが、再募集されるのを待っています。"
          });

          // 2. Log to Journal (amount: 0)
          const txId = `expire_${wishId}`;
          const txRef = doc(collection(db!, "transactions"), txId);
          transaction.set(txRef, {
            type: "WISH_EXPIRED",
            amount: 0,
            created_at: serverTimestamp(),
            sender_id: wishData.requester_id,
            sender_name: wishData.requester_name || "Anonymous",
            recipient_id: wishData.helper_id || null,
            recipient_name: wishData.helper_name || null,
            wish_title: wishData.content,
            wish_id: wishId,
            description: "system_expiration"
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
