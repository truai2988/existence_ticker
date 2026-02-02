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
  ): Promise<boolean> => {
    if (!db || !user) return false;
    setIsSubmitting(true);
    try {
      const wishRef = doc(db, "wishes", wishId);
      await updateDoc(wishRef, {
        status: "in_progress",
        helper_id: applicantId,
        accepted_at: serverTimestamp(),
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
          // 1. Calculate decayed value (Compensation Amount)
          const currentValue = calculateDecayedValue(
            wishData.cost || 0,
            wishData.created_at,
          );

          // 2. Transfer from Requester to Helper
          const requesterRef = doc(db!, "users", user.uid);
          const helperRef = doc(db!, "users", wishData.helper_id);

          // Requester Balance Update (Payment)
          const requesterDoc = await transaction.get(requesterRef);
          const requesterBalance = requesterDoc.data()?.balance || 0;

          // Requester Penalty (Impurity / 穢れ)
          transaction.update(requesterRef, {
            balance: requesterBalance - currentValue,
            consecutive_completions: 0, // Reset Streak
            has_cancellation_history: true, // Mark of Impurity (Crack)
            last_updated: serverTimestamp(),
          });

          // Helper Balance Update (Compensation Receive)
          transaction.update(helperRef, {
            balance: increment(currentValue),
            last_updated: serverTimestamp(),
          });

          // Log for Helper
          const helperLogRef = doc(
            collection(db!, "users", wishData.helper_id, "history"),
          );
          transaction.set(helperLogRef, {
            type: "compensation_received",
            amount: currentValue,
            related_wish_id: wishId,
            reason: "request_cancelled_by_owner",
            timestamp: serverTimestamp(),
          });

          // 3. Update Wish Status
          transaction.update(wishRef, {
            status: "cancelled",
            cancel_reason: "compensatory_cancellation",
            cancelled_at: serverTimestamp(),
            val_at_fulfillment: currentValue, // Store for records (Compensation Amount)
          });
        } else {
          // === 通常キャンセル (Open Status) ===
          const requesterRef = doc(db!, "users", user.uid);
          transaction.update(requesterRef, {
            last_updated: serverTimestamp(),
          });

          transaction.update(wishRef, {
            status: "cancelled",
            cancelled_at: serverTimestamp(),
          });
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

        // === Anti-Gravity Logic ===

        // 1. Calculate Decayed Value (Universal Decay)
        const createdAt = wishData.created_at as Timestamp;
        const actualValue = calculateDecayedValue(
          wishData.cost || 0,
          createdAt,
        );

        if (actualValue <= 0) {
          // Value is dust.
        }

        // 2. Reward Fulfiller
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

          const fBalance = fulfillerDoc.data().balance || 0;
          const rawNewBalance = fBalance + actualValue;
          const cappedBalance = Math.min(rawNewBalance, cap);

          transaction.update(fulfillerRef, {
            balance: cappedBalance,
            completed_contracts: increment(1), // Track helps
            last_updated: serverTimestamp(),
          });
        }

        // 3. Salvation for Issuer (Physics C) & Purification (禊)
        if (issuerDoc.exists()) {
          const iBalance = issuerDoc.data().balance || 0;
          const iData = issuerDoc.data() as UserProfile;

          // Purification Logic: Increment Streak
          const newStreak = (iData.consecutive_completions || 0) + 1;

          const updateData = {
            completed_requests: increment(1), // Properly Paid Count
            consecutive_completions: newStreak, // Increment Streak
            last_updated: serverTimestamp(),
            ...(iBalance < 0 ? { balance: 0 } : {}),
          };

          transaction.update(issuerRef, updateData);
        }

        // 4. Mark Wish Fulfilled
        transaction.update(wishRef, {
          status: "fulfilled",
          helper_id: fulfillerId,
          val_at_fulfillment: actualValue,
          fulfilled_at: serverTimestamp(),
        });

        // 5. Log Transaction for Metabolism Tracking
        const txRef = doc(collection(database, "transactions"));
        let txType = "SPARK";
        if (actualValue >= 900) txType = "BONFIRE";
        else if (actualValue >= 400) txType = "CANDLE";

        transaction.set(txRef, {
          amount: actualValue,
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
        });

        // 6. Incremental Counter for Scalability
        const today = new Date().toISOString().split("T")[0];
        const dailyStatsRef = doc(database, "daily_stats", today);

        transaction.set(
          dailyStatsRef,
          {
            volume: increment(actualValue),
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
