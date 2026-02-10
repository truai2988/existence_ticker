import { useState, useEffect } from "react";
import { useAuth } from "./useAuthHook";
import { db, auth } from "../lib/firebase";
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

// Extend Window interface for ghost profile alert flag
declare global {
  interface Window {
    ghostProfileAlertShown?: boolean;
  }
}

export const useProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user && isLoading) {
      const timer = setTimeout(() => {
        if (isLoading) {
          console.warn("[useProfile] Profile loading timed out after 10s");
          setIsLoading(false);
        }
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [user, isLoading]);

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
          // GHOST PROFILE PURGE DISABLED (2026-02-11)
          // The previous logic aggressively deleted the Auth user if the Firestore profile wasn't found immediately.
          // This caused a Race Condition during registration where the Auth was deleted before the Profile creation transaction propagated.
          // We now rely on the 'useAuthHook' atomic rollback for failure handling.
          
          /* 
          if (!window.__isRegistering) {
            console.warn("Ghost Profile detected (not currently registering). Purging Auth account...");
            (async () => {
              try {
                await user.delete();
                console.log("Ghost Profile purged successfully.");
                if (auth) { await auth.signOut(); }
              } catch (error) {
                console.error("Failed to purge Ghost Profile:", error);
                if (auth) { await auth.signOut(); }
              }
            })();
          } else {
            console.log("Profile not found but registration is in progress - waiting for sync...");
          }
          */

          console.warn("[useProfile] Profile document not found. Waiting for creation or manual recovery.");
          setProfile(null);
        }
        setIsLoading(false);
      },
      (error) => {
        console.error("Profile sync error:", error);
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
    
    // Strategy 1: Recovery / Initialization (If profile is missing)
    const docSnap = await getDoc(userRef);
    
    if (!docSnap.exists()) {
        console.log("Profile missing. Executing Recovery (Create Mode).");
        
        // Ensure we have the absolute minimums for the Strict Create Rule
        const loc = updates.location as UserProfile['location'] | undefined;
        
        if (!updates.name && (!user.displayName || user.displayName === 'Anonymous')) {
             throw new Error("Recovery Failed: Name is required");
        }
        if (!loc || !loc.prefecture) {
             throw new Error("Recovery Failed: Location is required");
        }

        const initialProfile: UserProfile = {
          id: user.uid,
          name: updates.name || user.displayName || "Anonymous",
          balance: 2400, // Grant Initial Vessel
          committed_lm: 0,
          xp: 0,
          warmth: 0,
          completed_contracts: 0,
          created_contracts: 0,
          location: (updates.location as UserProfile['location']), 
          ...updates as Partial<UserProfile>
        };

        try {
            await runTransaction(db!, async (transaction) => {
                // Double check existence
                const doubleCheck = await transaction.get(userRef);
                if (doubleCheck.exists()) throw "Profile appeared during recovery";

                // 1. Create Profile
                transaction.set(userRef, {
                    ...initialProfile,
                    last_updated: serverTimestamp()
                    // cycle_started_at OMITTED to trigger First Birth
                });

                // 2. Increment Stats for the NEW location (if valid)
                if (initialProfile.location && initialProfile.location.prefecture && initialProfile.location.city) {
                    const cityKey = `${initialProfile.location.prefecture}_${initialProfile.location.city}`;
                    const statRef = doc(db!, 'location_stats', cityKey);
                    transaction.set(statRef, { count: increment(1) }, { merge: true });
                }
            });

            return { success: true };
        } catch (createError) {
            console.error("Recovery Create Failed:", createError);
            return { success: false, error: createError };
        }
    }

    // Strategy 2: Normal Update (Transaction)
    try {
        await runTransaction(db, async (transaction: Transaction) => { 
            const freshSnap = await transaction.get(userRef);
            if (!freshSnap.exists()) throw "User disappeared during transaction";
            
            const currentData = freshSnap.data();
            const currentRealBalance = calculateDecayedValue(
                currentData.balance || 0,
                currentData.last_updated
            );
            
            const safeBalance = isNaN(currentRealBalance) ? 0 : currentRealBalance;

            transaction.update(userRef, {
                ...updates,
                balance: safeBalance, // Checkpoint
                last_updated: serverTimestamp()
            });

            // --- CENSUS LOGIC (Neighborly Presence) ---
            const oldLoc = currentData.location;
            const newLoc = updates.location ? (updates.location as UserProfile['location']) : oldLoc;

            // Check if location actually changed effectively
            const oldKey = oldLoc ? `${oldLoc.prefecture}_${oldLoc.city}` : null;
            const newKey = newLoc ? `${newLoc.prefecture}_${newLoc.city}` : null;

            if (oldKey !== newKey) {
                // Decrement old
                if (oldKey && oldLoc?.prefecture && oldLoc?.city) {
                     const oldStatRef = doc(db!, 'location_stats', oldKey);
                     transaction.set(oldStatRef, { count: increment(-1) }, { merge: true });
                }
                // Increment new
                if (newKey && newLoc?.prefecture && newLoc?.city) {
                     const newStatRef = doc(db!, 'location_stats', newKey);
                     transaction.set(newStatRef, { count: increment(1) }, { merge: true });
                }
            }
        });
        return { success: true };
    } catch (e) {
        console.error("Profile Transaction Failed:", e);
        return { success: false, error: e };
    }
  };

  return {
    profile,
    // Derived for backward compatibility or direct access
    name: profile?.name || "Anonymous",
    xp: profile?.xp || 0,
    warmth: profile?.warmth || 0,
    completed_contracts: profile?.completed_contracts || 0,
    created_contracts: profile?.created_contracts || 0,
    updateProfile,
    isLoading,
  };
};
