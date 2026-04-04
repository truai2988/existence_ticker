import { useState } from "react";
import { Wish, CreateWishInput } from "../../types";
import { useAuth } from "../useAuthHook";
import { useWishesContext } from "../../contexts/WishesContext";
import { db } from "../../lib/firebase";
import { doc, runTransaction, serverTimestamp } from "firebase/firestore";
import { MESSAGES } from "../../constants/messages";

export const useCreateWish = () => {
  const { user } = useAuth();
  const { addOptimisticWish, updateOptimisticWish, removeOptimisticWish } = useWishesContext();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const costMap: Record<string, number> = { light: 0, medium: 500, heavy: 1000 };

  const castWish = async (input: CreateWishInput): Promise<{success: boolean, error?: string}> => {
    if (!db) {
      return { success: false, error: MESSAGES.WISH_ACTIONS.ALERT_DB_ERROR };
    }
    if (!user) {
      return { success: false, error: MESSAGES.WISH_ACTIONS.ALERT_NOT_LOGGED_IN };
    }

    setIsSubmitting(true);

    const userRef = doc(db, "users", user.uid);
    const wishId = `wish_${user.uid}_${Date.now()}`;
    const wishRef = doc(db, "wishes", wishId); 
    const bounty = costMap[input.tier];

    // Optimistic Update
    const optimisticWish: Wish = {
      id: wishId,
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

    try {
      await runTransaction(db, async (transaction) => {
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists()) throw "User not found";

        const userData = userDoc.data();
        const currentCommitted = userData.committed_balance || 0;
        
        // Balance and commitments are handled at fulfillment.
        // Client-side 'exceedsAvailable' prevents users from spamming overdrafts.
        
        // "Heavy" and "Medium" can be cast if user has 0 balance (they go into negative)
        // But "Light" (bounty 0) can ALWAYS be cast, even if negative.
        // Wait, rule: CANNOT cast if balance is deeply negative UNLESS it's Light.
        // Let's refine: If it's Medium or Heavy, check if they can afford it? 
        // Actually, existence_ticker allows going negative if you don't have enough to pay upfront. The debt is settled later.
        // BUT to prevent infinite spam, we might enforce: you can't cast >0 cost wishes IF you are already in debt.
        // For now, let's keep the existing logic which does not block negative balances explicitly here.

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { isOptimistic: _isOptimistic, ...newWishData } = {
          ...optimisticWish,
          requester_name: userData.name || "名称未設定",
          created_at: serverTimestamp(),
        };

        transaction.set(wishRef, newWishData);
        // Reserve the balance
        transaction.update(userRef, {
          committed_balance: currentCommitted + bounty,
        });
      });
      return { success: true };
    } catch (e) {
      console.error("Failed to cast wish:", e);
      removeOptimisticWish(wishId);
      return { success: false, error: e instanceof Error ? e.message : String(e) };
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateWish = async (wishId: string, updates: Partial<Wish>): Promise<boolean> => {
    if (!db || !user) return false;
    setIsSubmitting(true);

    try {
      // Optimistic update
      updateOptimisticWish(wishId, updates);

      const wishRef = doc(db, "wishes", wishId);
      await runTransaction(db, async (transaction) => {
        const wishDoc = await transaction.get(wishRef);
        if (!wishDoc.exists()) throw "Wish not found";
        
        // 権限チェック：作成者本人しか更新できない
        if (wishDoc.data().requester_id !== user.uid) {
            throw new Error("You don't have permission to edit this wish");
        }

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id: _id, ...dataToUpdate } = updates;
        
        transaction.update(wishRef, {
            ...dataToUpdate,
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

  return { castWish, updateWish, isSubmitting };
};
