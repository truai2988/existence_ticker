import { useState, useEffect } from "react";
import { useAuth } from "./useAuthHook";
import { db } from "../lib/firebase";
import {
  doc,
  onSnapshot,
  updateDoc,
  serverTimestamp,
  runTransaction,
  Transaction,
  increment
} from "firebase/firestore";
import { calculateDecayedValue, getMillis } from "../logic/worldPhysics";
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
          const rawData = docSnap.data();
          
          // EDGE NORMALIZATION: Convert everything to millisecond numbers
          // No auto-writes, no judgements. Just read and normalize.
          const normalizedProfile: UserProfile = {
            id: user.uid,
            ...rawData,
            name: rawData.name || user.displayName || "Anonymous",
            last_updated: getMillis(rawData.last_updated),
            cycle_started_at: getMillis(rawData.cycle_started_at),
            created_at: getMillis(rawData.created_at),
          } as UserProfile;

          setProfile(normalizedProfile);
        } else {
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
      // Check if location is changing to manage stats
      const isLocationChanging = updates.location && 
        (updates.location.prefecture !== profile?.location?.prefecture || 
         updates.location.city !== profile?.location?.city);

      if (isLocationChanging) {
        await runTransaction(db, async (transaction) => {
          const userSnap = await transaction.get(userRef);
          if (!userSnap.exists()) throw new Error("User profile not found");
          const oldData = userSnap.data() as UserProfile;
          
          // 1. Decrement old location (Clamped to 0)
          if (oldData.location?.prefecture && oldData.location?.city) {
            const oldKey = `${oldData.location.prefecture}_${oldData.location.city}`;
            const oldStatRef = doc(db!, 'location_stats', oldKey);
            const oldStatSnap = await transaction.get(oldStatRef);
            if (oldStatSnap.exists()) {
              const currentCount = oldStatSnap.data().count || 0;
              transaction.update(oldStatRef, { count: Math.max(0, currentCount - 1) });
            }
          }

          // 2. Increment new location
          if (updates.location?.prefecture && updates.location?.city) {
            const newKey = `${updates.location.prefecture}_${updates.location.city}`;
            const newStatRef = doc(db!, 'location_stats', newKey);
            transaction.set(newStatRef, { count: increment(1) }, { merge: true });
          }

          // 3. Update Profile
          transaction.update(userRef, {
            ...updates,
            last_updated: serverTimestamp(),
          });
        });
      } else {
        // Standard update if location is same
        await updateDoc(userRef, {
          ...updates,
          last_updated: serverTimestamp(),
        });
      }
      
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
            const lastUpdated = getMillis(userData.last_updated);
            const currentBalance = userData.balance || 0;
            const decayedBalance = calculateDecayedValue(currentBalance, lastUpdated);
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
            const lastUpdated = getMillis(userData.last_updated);
            const currentBalance = userData.balance || 0;
            const decayedBalance = calculateDecayedValue(currentBalance, lastUpdated);

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