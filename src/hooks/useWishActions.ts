import { useState } from "react";
import { CreateWishInput, UserProfile } from "../types";
import { useAuth } from "./useAuthHook";
import { db } from "../lib/firebase";
import {
  collection,
  doc,
  runTransaction,
  serverTimestamp,
  Timestamp,
  increment,
  updateDoc,
  deleteField,
  query,
  where,
  getDocs,
  FieldValue,
} from "firebase/firestore";

import { calculateDecayedValue } from "../logic/worldPhysics";

// タイムスタンプと初期値から現在価値を計算

export const useWishActions = () => {
  const { user } = useAuth();
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
    const wishRef = doc(collection(db, "wishes")); // Generates new ID
    const bounty = costMap[input.tier];

    try {
      await runTransaction(db, async (transaction) => {
        // 1. Get User Data
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists()) throw "User profile not found";

        const data = userDoc.data();
        const currentBalance = data.balance || 0;
        const lastUpdated = data.last_updated;

        // 2. Strict Check (Phase 1: No Void/Negative)
        const decayedBalance = calculateDecayedValue(
          currentBalance,
          lastUpdated,
        );

        // === 厳密な予約チェック (Strict Constraint) ===
        // トランザクション内で現在のアクティブな依頼を全て取得し、committedLmを計算する
        // これにより、クライアント側の計算ミスや悪意あるリクエストによる「約束超過」を完全に防ぐ
        const wishesRef = collection(db!, "wishes");
        const activeWishesQuery = query(
          wishesRef,
          where("requester_id", "==", user.uid),
          where("status", "in", ["open", "in_progress"]),
        );
        // Transactional Read (via getDocs)
        const activeWishesSnapshot = await getDocs(activeWishesQuery);

        let currentCommittedLm = 0;
        activeWishesSnapshot.forEach((doc) => {
          const w = doc.data();
          currentCommittedLm += calculateDecayedValue(
            w.cost || 0,
            w.created_at,
          );
        });

        const availableLm = decayedBalance - currentCommittedLm;

        if (availableLm < bounty) {
          throw new Error(
            `手持ちが不足しています (Available: ${Math.floor(availableLm)}, Required: ${bounty}) - 約束中の光を考慮済み`,
          );
        }

        // Update user: 減価適用後のbalanceに更新し、last_updatedをリセット
        // balance自体は減算しない（予約ロジックで管理）
        transaction.update(userRef, {
          balance: decayedBalance, // 減価適用後の値に更新（減算なし）
          created_contracts: increment(1), // Track Requests (Created)
          last_updated: serverTimestamp(),
        });

        // 3. Create Wish
        transaction.set(wishRef, {
          requester_id: user.uid,
          requester_name: userDoc.data().name || "Anonymous Soul",
          content: input.content,
          gratitude_preset: input.tier,
          status: "open",
          cost: bounty, // Initial Value

          requester_trust_score: data.completed_contracts || 0, // Stamp Trust (Helped Count)
          requester_completed_requests: data.completed_requests || 0, // Stamp Reliability (Paid/Completed Requests)
          created_at: serverTimestamp(), // Firestore Timestamp
        });
      });

      console.log("Wish Cast:", input, { bounty });
      return true;
    } catch (e) {
      console.error("Failed to cast wish:", e);
      const errorMessage = e instanceof Error ? e.message : String(e);
      alert(`${errorMessage}`);
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

      await runTransaction(db, async (transaction) => {
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
        if (currentApplicants.some((a: { id: string }) => a.id === user.uid)) {
          throw "Already applied";
        }

        transaction.update(wishRef, {
          applicants: [...currentApplicants, applicantInfo],
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
      
      await runTransaction(db, async (transaction) => {
          const wishDoc = await transaction.get(wishRef);
          if (!wishDoc.exists()) throw "Wish not found";
          
          const data = wishDoc.data();
          const applicants = data.applicants || [];
          const selectedApplicant = applicants.find((a: { id: string }) => a.id === applicantId);
          
          if (!selectedApplicant) throw "Applicant not found";

          transaction.update(wishRef, {
            status: "in_progress",
            helper_id: applicantId,
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
      await updateDoc(wishRef, {
        status: "review_pending",
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
      await runTransaction(db, async (transaction) => {
        const wishDoc = await transaction.get(wishRef);
        if (!wishDoc.exists()) throw "Wish does not exist";
        const wishData = wishDoc.data();

        if (wishData.status === "in_progress") {
          // === 補償キャンセル (Compensation Logic) ===
          
          // 1. Fetch Requester Data FIRST to check solvency
          const requesterRef = doc(db!, "users", user.uid);
          const requesterDoc = await transaction.get(requesterRef);
          if (!requesterDoc.exists()) throw "Requester not found";
          
          const rData = requesterDoc.data();
          const rBalance = rData?.balance || 0;
          const rLastUpdated = rData?.last_updated;
          const rName = rData?.name || "Requester";

          // 2. Fetch Helper Data
          const helperRef = doc(db!, "users", wishData.helper_id);
          const helperDoc = await transaction.get(helperRef);
          if (!helperDoc.exists()) throw "Helper not found";
          
          const hName = helperDoc.data()?.name || "Helper";

          // 3. Calculate PHYSICAL TRUTHS (All Decayed)
          const wishDecayedValue = calculateDecayedValue(
            wishData.cost || 0,
            wishData.created_at,
          );
          
          // Requester's Real Holding (Now)
          const requesterCurrentReal = calculateDecayedValue(rBalance, rLastUpdated);

          // 4. Determine Actual Payment (NO INFLATION RULE)
          // "You cannot give what you do not have."
          const actualPayment = Math.min(requesterCurrentReal, wishDecayedValue);
          const isBankruptcy = actualPayment < wishDecayedValue;

          // Requester Update
          // New Balance = CurrentReal - ActualPayment (Always >= 0)
          transaction.update(requesterRef, {
            balance: requesterCurrentReal - actualPayment,
            consecutive_completions: 0, // Reset Streak
            has_cancellation_history: true, // Mark of Impurity
            last_updated: serverTimestamp(),
          });

          // Helper Update
          const hData = helperDoc.data();
          const hBalance = hData?.balance || 0;
          const hLastUpdated = hData?.last_updated;
          const hCurrentDecayed = calculateDecayedValue(hBalance, hLastUpdated);

          transaction.update(helperRef, {
            balance: hCurrentDecayed + actualPayment,
            last_updated: serverTimestamp(),
          });

          // 5. Log Global Transaction
          const txId = `compensate_${wishId}_TO_${wishData.helper_id}`;
          const txRef = doc(collection(db!, "transactions"), txId);
          
          const txCheck = await transaction.get(txRef);
          if (!txCheck.exists()) {
              transaction.set(txRef, {
                type: "COMPENSATION",
                amount: actualPayment, // Log actual transfer
                created_at: serverTimestamp(),
                
                // Context
                sender_id: user.uid,
                sender_name: rName,
                recipient_id: wishData.helper_id,
                recipient_name: hName,
                wish_title: wishData.content,
                wish_id: wishId,
                description: isBankruptcy 
                    ? "request_cancelled_by_owner (Bankruptcy Partial Payment)" 
                    : "request_cancelled_by_owner"
              });
          }

          // 6. Update Wish Status
          transaction.update(wishRef, {
            status: "cancelled",
            cancel_reason: "compensatory_cancellation",
            cancelled_at: serverTimestamp(),
            val_at_fulfillment: actualPayment, // Record what was ACTUALLY paid
          });
        } else {
          // === 通常キャンセル (Open Status) ===
          // 依頼取り消し：跡形もなく消滅させる (Delete)
          const requesterRef = doc(db!, "users", user.uid);
          transaction.update(requesterRef, {
            last_updated: serverTimestamp(),
          });

          transaction.delete(wishRef);
        }
      });

      return true;
    } catch (error) {
      console.error("Cancel failed:", error);
      alert("キャンセルに失敗しました");
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
        
        // 1. Remove from Applicants (Clean Slate)
        const currentApplicants = wishData.applicants || [];
        const updatedApplicants = currentApplicants.filter(
            (a: { id: string }) => a.id !== user.uid
        );

        // 2. Reset Helper Stats (Purification/Penalty)
        // consecutive_completions = 0 -> Rank Deprivation
        transaction.update(userRef, {
            consecutive_completions: 0,
            last_updated: serverTimestamp()
        });

        // 3. Reset Wish Status
        transaction.update(wishRef, {
            status: "open",
            applicants: updatedApplicants,
            helper_id: deleteField(),
            accepted_at: deleteField(),
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
      await updateDoc(wishRef, {
        content: newContent,
        updated_at: serverTimestamp(),
      });
      return true;
    } catch (e) {
      console.error("Failed to update wish:", e);
      alert("更新に失敗しました");
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

    try {
      await runTransaction(db, async (transaction) => {
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

        // === Anti-Gravity Logic & STRICT PHYSICS ===

        // 1. Calculate Decayed Value (Universal Decay)
        const createdAt = wishData.created_at as Timestamp;
        const promisedValue = calculateDecayedValue(
          wishData.cost || 0,
          createdAt,
        );

        if (promisedValue <= 0) {
          // Value is dust.
        }

        // 1.5 Check Issuer Solvency (The Truth)
        let paymentAmount = promisedValue;
        if (issuerDoc.exists()) {
             const iData = issuerDoc.data() as UserProfile;
             const iCurrentReal = calculateDecayedValue(iData.balance || 0, iData.last_updated);
             // "You cannot give what you do not have."
             paymentAmount = Math.min(promisedValue, iCurrentReal);
        } else {
             // Issuer vanished? No payment can be collected.
             paymentAmount = 0;
        }
        
        const isBankruptcy = paymentAmount < promisedValue;

        // 2. Reward Fulfiller (With Actual Payment)
        const fulfillerDoc = await transaction.get(fulfillerRef);
        if (fulfillerDoc.exists()) {
          let cap = 2400;
          try {
            const settingsRef = doc(database, "system_settings", "stats");
            const settingsDoc = await transaction.get(settingsRef);
            if (settingsDoc.exists()) {
              const val = settingsDoc.data().global_capacity;
              if (typeof val === "number") cap = val;
            }
          } catch (e) {
            console.warn("Using default cap", e);
          }

          const fData = fulfillerDoc.data();
          const fBalance = fData.balance || 0;
          const fLastUpdated = fData.last_updated;
          
          // === FIX GRAVITY LEAK ===
          // Must decay the stored balance to NOW before adding reward.
          const currentDecayed = calculateDecayedValue(fBalance, fLastUpdated);
          
          const rawNewBalance = currentDecayed + paymentAmount;
          const cappedBalance = Math.min(rawNewBalance, cap);

          transaction.update(fulfillerRef, {
            balance: cappedBalance,
            completed_contracts: increment(1), // Track helps
            last_updated: serverTimestamp(), // Reset gravity anchor
          });
        }

          // 3. Salvation for Issuer (Physics C) & Purification (禊)
          if (issuerDoc.exists()) {
            const iData = issuerDoc.data() as UserProfile;
            const iBalance = iData.balance || 0;
            const iLastUpdated = iData.last_updated;

            // Strict Recalculation of User's Current Balance (Decayed)
            const iCurrentReal = calculateDecayedValue(iBalance, iLastUpdated);
            
            // Deduct the Lm (Consumption)
            // Balance = CurrentReal - Payment. Since payment <= CurrentReal, this is safe.
            const iNewBalance = iCurrentReal - paymentAmount;

            // Purification Logic: Increment Streak
            const newStreak = (iData.consecutive_completions || 0) + 1;

            const updateData = {
              balance: iNewBalance, // CRITICAL FIX: Update Balance
              completed_requests: increment(1), // Properly Paid Count
              consecutive_completions: newStreak, // Increment Streak
              last_updated: serverTimestamp(),
            };

            transaction.update(issuerRef, updateData);
          }

        // 4. Mark Wish Fulfilled
        transaction.update(wishRef, {
          status: "fulfilled",
          helper_id: fulfillerId,
          val_at_fulfillment: paymentAmount, // Record actual payment
          fulfilled_at: serverTimestamp(),
        });

        // 5. Log Transaction for Metabolism Tracking (Deterministic ID)
        // ID Rule: "wish_<WishID>_PAY_<FulfillerID>"
        const txId = `wish_${wishId}_PAY_${fulfillerId}`;
        const txRef = doc(collection(database, "transactions"), txId);
        
        const txDoc = await transaction.get(txRef);
        if (txDoc.exists()) {
             throw "Transaction already processed (Idempotency Check)";
        }

        let txType = "SPARK";
        if (paymentAmount >= 900) txType = "BONFIRE";
        else if (paymentAmount >= 400) txType = "CANDLE";

        transaction.set(txRef, {
          amount: paymentAmount,
          timestamp: serverTimestamp(),
          created_at: serverTimestamp(), // Unify timestamp naming
          type: "WISH_FULFILLMENT", // More explicit than SPARK/BONFIRE for history
          sub_type: txType, // Keep SPARK/BONFIRE as sub-type for visual flair if needed
          wish_id: wishId,
          wish_title: wishData.content,
          sender_id: wishData.requester_id,
          sender_name: wishData.requester_name || "Anonymous",
          recipient_id: fulfillerId,
          recipient_name: fulfillerDoc.data()?.name || "Anonymous",
          description: isBankruptcy 
              ? "wish_fulfilled (Bankruptcy Partial Payment)" 
              : "wish_fulfilled"
        });

        // 6. Incremental Counter for Scalability
        const today = new Date().toISOString().split("T")[0];
        const dailyStatsRef = doc(database, "daily_stats", today);

        transaction.set(
          dailyStatsRef,
          {
            volume: increment(paymentAmount),
            updated_at: serverTimestamp(),
          },
          { merge: true },
        );
      });

      console.log("Wish Fulfilled & Salvation Granted");
      return true;
    } catch (e) {
      console.error("Fulfillment failed:", e);
      const errorMessage = e instanceof Error ? e.message : String(e);
      alert(`成就に失敗しました: ${errorMessage}`);
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

        transaction.update(wishRef, {
          applicants: updatedApplicants,
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
        await updateDoc(wishRef, {
          status: "expired",
          updated_at: serverTimestamp(),
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
        
        let targetStatus = status;
        let targetHelperId = helperId;

        if (!targetStatus) {
            const wishDoc = await getDocs(query(collection(db, "wishes"), where("__name__", "==", wishId)));
            const wishData = wishDoc.docs[0]?.data();
            targetStatus = (helperId || wishData?.helper_id) ? 'in_progress' : 'open';
            if (!targetHelperId) targetHelperId = wishData?.helper_id;
        }

        const updateData: { status: string; updated_at: FieldValue; helper_id?: string } = {
          status: targetStatus,
          updated_at: serverTimestamp(),
        };

        if (targetHelperId) {
            updateData.helper_id = targetHelperId;
        }

        await updateDoc(wishRef, updateData);
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
