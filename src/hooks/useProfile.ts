import { useState, useEffect } from "react";
import { useAuth } from "./useAuthHook";
import { db } from "../lib/firebase";
import {
  doc,
  onSnapshot,
  updateDoc,
  serverTimestamp,
  runTransaction,
  getDoc,
  Transaction,
  increment 
} from "firebase/firestore";
import { calculateDecayedValue } from "../logic/worldPhysics";
import { UserProfile } from "../types";

export const useProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user || !db) {
      setProfile(null);
      setIsLoading(false);
      return;
    }

    const userRef = doc(db, "users", user.uid);
    const unsubscribe = onSnapshot(
      userRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          let needsUpdate = false;
          const updates: Record<string, unknown> = {};

          // Self-heal: If legacy user (no last_updated), patch it to enable decay
          if (!data.last_updated) {
            console.log("Migrating legacy user: Adding last_updated");
            updates.last_updated = serverTimestamp();
            needsUpdate = true;
          }

          // Self-heal: Sync name from Auth if DB has default/missing name but Auth has real name
          if (
            (!data.name || data.name === "Anonymous") &&
            user.displayName &&
            user.displayName !== "Anonymous"
          ) {
            console.log("Syncing name from Auth to DB:", user.displayName);
            updates.name = user.displayName;
            needsUpdate = true;
          }

          // Guard against infinite loops: check if we already tried healing recently (in this session)
          // Note: Real robustness would check exact values, but we want to avoid main-thread blocking loops.
          // We can just rely on the fact that if 'updates' has keys, we trigger.

          if (needsUpdate) {
            // Basic protection: don't auto-heal if we already possess the correct data in the snapshot but just haven't rendered it?
            // No, the snapshot data is OLD.
            // Issue: If updateDoc fails or takes time, we might retry immediately in next render?
            // But onSnapshot only fires when DB changes. A failed write wouldn't trigger it?
            // A successful write triggers it with NEW data.
            // If NEW data still satisfies conditions, we loop.

            // Check if we are really changing anything from what is currently in 'data'
            const isNameDifferent = updates.name && updates.name !== data.name;
            const isTimeDifferent = updates.last_updated && !data.last_updated;

            if (isNameDifferent || isTimeDifferent) {
              console.log("Applying self-heal updates:", updates);
              updateDoc(userRef, updates);
            }
          }

          // Use the auth name immediately for UI responsiveness if we just decided to update it
          const finalName =
            updates.name || data.name || user.displayName || "Anonymous";

          setProfile({ id: user.uid, ...data, name: finalName } as UserProfile);
        } else {
          // Profile not found - report null (sensor does not judge)
          setProfile(null);
        }
        setIsLoading(false);
      },
      (error) => {
        console.error("[useProfile] Profile sync error:", error);
        setProfile(null);
        setIsLoading(false);
      },
    );

    return () => unsubscribe();
  }, [user]);

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user || !db) {
        console.error("Profile update failed: No user or db");
        return { success: false, error: "No user or db" };
    }
    const userRef = doc(db, "users", user.uid);

    try {
      await updateDoc(userRef, {
        ...updates,
        last_updated: serverTimestamp(),
      });
      console.log("Profile updated:", updates);
      return { success: true };
    } catch (error) {
      console.error("Profile update error:", error);
      return { success: false, error };
    }
  };

  const incrementBalance = async (amount: number) => {
    if (!user || !db) {
        console.error("Increment balance failed: No user or db");
        return { success: false, error: "No user or db" };
    }
    const userRef = doc(db, "users", user.uid);

    try {
        await runTransaction(db, async (transaction) => {
            const userSnap = await transaction.get(userRef);
            if (!userSnap.exists()) {
                throw new Error("User profile not found during transaction");
            }
            const userData = userSnap.data();
            const currentBalance = userData.balance || 0;
            const decayedBalance = calculateDecayedValue(currentBalance, userData.last_updated);
            const newBalance = decayedBalance + amount;
            const cappedBalance = Math.min(newBalance, 100); // Example cap at 100

            transaction.update(userRef, {
                balance: cappedBalance,
                last_updated: serverTimestamp(),
            });
        });
        console.log("Balance incremented by", amount);
        return { success: true };
    } catch (error) {
        console.error("Increment balance error:", error);
        return { success: false, error };
    }
  };

  const deductBalance = async (amount: number) => {
    if (!user || !db) {
        console.error("Deduct balance failed: No user or db");
        return { success: false, error: "No user or db" };
    }
    const userRef = doc(db, "users", user.uid);

    try {
        const result = await runTransaction(db, async (transaction: Transaction) => {
            const userSnap = await transaction.get(userRef);
            if (!userSnap.exists()) {
                throw new Error("User profile not found during transaction");
            }
            const userData = userSnap.data();
            const currentBalance = userData.balance || 0;
            const decayedBalance = calculateDecayedValue(currentBalance, userData.last_updated);

            if (decayedBalance < amount) {
                console.warn("Insufficient balance for deduction:", decayedBalance, "needed:", amount);
                return { success: false, error: "Insufficient balance" };
            }

            const newBalance = decayedBalance - amount;

            transaction.update(userRef, {
                balance: newBalance,
                last_updated: serverTimestamp(),
            });

            return { success: true, newBalance };
        });

        console.log("Balance deducted by", amount);
        return result;
    } catch (error) {
        console.error("Deduct balance error:", error);
        return { success: false, error };
    }
  };

  const recordTransaction = async (type: string, amount: number, description: string) => {
    if (!user || !db) {
        console.error("Record transaction failed: No user or db");
        return { success: false, error: "No user or db" };
    }

    try {
        const historyRef = doc(db, "users", user.uid, "history", Date.now().toString());
        await runTransaction(db, async (transaction) => {
            transaction.set(historyRef, {
                type,
                amount,
                description,
                timestamp: serverTimestamp(),
            });
        });
        console.log("Transaction recorded:", type, amount, description);
        return { success: true };
    } catch (error) {
        console.error("Record transaction error:", error);
        return { success: false, error };
    }
  };

  return { profile, isLoading, updateProfile, incrementBalance, deductBalance, recordTransaction };
};