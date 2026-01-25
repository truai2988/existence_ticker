import { useState, useEffect } from "react";
import { useAuth } from "./useAuthHook";
import { db } from "../lib/firebase";
import {
  doc,
  onSnapshot,
  setDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
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
          // Initialize if new user
          const newProfile: UserProfile = {
            id: user.uid,
            name: user.displayName || "Anonymous",
            balance: 2400, // Starts with Full Vessel
            xp: 0,
            warmth: 0,
            completed_contracts: 0,
            created_contracts: 0,
          };
          setDoc(
            userRef,
            { ...newProfile, last_updated: serverTimestamp() },
            { merge: true },
          );
          setProfile(newProfile);
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
    if (!user || !db) return false;
    const userRef = doc(db, "users", user.uid);
    try {
      await updateDoc(userRef, updates);
      return true;
    } catch (e) {
      console.error(e);
      return false;
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
