import { useState, useEffect } from "react";
import { useAuth } from "./useAuthHook";
import { db } from "../lib/firebase";
import {
  doc,
  onSnapshot,
  serverTimestamp,
  runTransaction,
  Transaction
} from "firebase/firestore";
import { calculateDecayedValue, toMilli, fromMilli, WORLD_CONSTANTS, getMillis } from "../logic/worldPhysics";
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
            name: rawData.name || user.displayName || "奏者",
            last_updated: getMillis(rawData.last_updated),
            cycle_started_at: getMillis(rawData.cycle_started_at, 0),
            created_at: getMillis(rawData.created_at),
          } as UserProfile;

          setProfile(normalizedProfile);
        } else {
          setProfile(null);
        }
        setIsLoading(false);
      },
      () => {
        // console.warn("[useProfile] Profile sync error (likely permission/init):", error);
        setProfile(null);
        setIsLoading(false);
      },
    );

    return () => unsubscribe();
  }, [user]);

  // SELF-REPAIR: Sync email from Auth to Firestore if missing in Profile
  useEffect(() => {
    if (user && profile && !profile.email && user.email && !isLoading) {
      updateProfile({ email: user.email });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, profile, isLoading]);

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
        await runTransaction(db, async (transaction: Transaction) => {
          // Profile updates are handled here. 
          // location_stats are managed by the onWrite trigger in Cloud Functions.
          transaction.update(userRef, {
            ...updates,
          });
        });
      } else {
        // Standard update if location is same
        await runTransaction(db, async (transaction: Transaction) => {
          transaction.update(userRef, {
            ...updates,
          });
        });
      }
      
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
        await runTransaction(db, async (transaction: Transaction) => {
            const userSnap = await transaction.get(userRef);
            if (!userSnap.exists()) {
                throw new Error("User profile not found during transaction");
            }
            const userData = userSnap.data() as UserProfile;
            const cycleStartedAt = getMillis(userData.cycle_started_at, 0);
            if (cycleStartedAt === 0) throw "Vessel not initialized";

            const now = Date.now();
            const elapsedSec = ((now - cycleStartedAt) / 1000) | 0;
            const decayedVesselMilli = calculateDecayedValue(toMilli(WORLD_CONSTANTS.REBIRTH_AMOUNT), elapsedSec);
            
            // balance <= 2400 => decayedVessel - spent <= 2400 => spent >= decayedVessel - 2400
            const minSpentMilli = decayedVesselMilli - toMilli(WORLD_CONSTANTS.REBIRTH_AMOUNT);
            const currentSpentMilli = toMilli(userData.spent_lm || 0);
            const newSpentMilli = Math.max(minSpentMilli, currentSpentMilli - toMilli(amount));

            transaction.update(userRef, {
                spent_lm: fromMilli(newSpentMilli),
            });
        });
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
            const userData = userSnap.data() as UserProfile;
            const currentSpent = userData.spent_lm || 0;
            const newSpent = currentSpent + amount;

            transaction.update(userRef, {
                spent_lm: newSpent,
            });

            return { success: true, newSpent: newSpent };
        });

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
        return { success: true };
    } catch (error) {
        console.error("Record transaction error:", error);
        return { success: false, error };
    }
  };

  return { profile, isLoading, updateProfile, incrementBalance, deductBalance, recordTransaction };
};