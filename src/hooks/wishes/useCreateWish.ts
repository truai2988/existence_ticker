import { useState } from "react";
import { Wish, CreateWishInput } from "../../types";
import { useAuth } from "../useAuthHook";
import { useProfile } from "../useProfile";
import { useWishesContext } from "../../contexts/WishesContext";
import { db } from "../../lib/firebase";
import { doc, runTransaction, serverTimestamp } from "firebase/firestore";
import { MESSAGES } from "../../constants/messages";
import { FIXED_WISH_COST } from "../../constants";

export const useCreateWish = () => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { addOptimisticWish, updateOptimisticWish, removeOptimisticWish } = useWishesContext();
  const [isSubmitting, setIsSubmitting] = useState(false);

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

    // Optimistic Update
    const optimisticWish: Wish = {
      id: wishId,
      requester_id: user.uid,
      requester_name: MESSAGES.WISH_ACTIONS.PENDING_PROPAGATION,
      content: input.content,
      gratitude_preset: "heavy",
      status: "open",
      cost: FIXED_WISH_COST,
      created_at: Date.now(),
      isAnonymous: input.isAnonymous || false,
      requester_prefecture: profile?.location?.prefecture || "",
      requester_city: profile?.location?.city || "",
      isOptimistic: true
    };

    addOptimisticWish(optimisticWish);

    try {
      await runTransaction(db, async (transaction) => {
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists()) throw "User not found";

        const userData = userDoc.data();
        const currentCommitted = userData.committed_balance || 0;

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { isOptimistic: _isOptimistic, ...newWishData } = {
          ...optimisticWish,
          requester_name: userData.name || "名称未設定",
          requester_prefecture: userData.location?.prefecture || "",
          requester_city: userData.location?.city || "",
          created_at: serverTimestamp(),
        };

        transaction.set(wishRef, newWishData);
        // Reserve the balance
        transaction.update(userRef, {
          committed_balance: currentCommitted + FIXED_WISH_COST,
        });
      });
      removeOptimisticWish(wishId);
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
