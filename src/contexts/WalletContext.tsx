import React, { useMemo, useEffect, useState, ReactNode } from "react";
import { useAuth } from "../hooks/useAuthHook";
import { db } from "../lib/firebase";
import {
  doc,
  runTransaction,
  serverTimestamp,
  increment,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { useProfile } from "../hooks/useProfile";
import { 
  calculateDecayedValue, 
  calculateAvailableLm, 
  WORLD_CONSTANTS,
  toMilli,
  fromMilli,
  getMillis
} from "../logic/worldPhysics";
import { WalletStatus } from "../types/wallet";
import { useWishesContext } from "./WishesContext";
import { WalletContext, WalletContextType } from "./WalletContextDefinition";

// WalletProvider Component

export const WalletProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { profile, isLoading: profileLoading } = useProfile();
  const { isLoading: wishesLoading } = useWishesContext();

  // 1-Hour Silence: Live Ticker for live decay updates (1 hour)
  const [localTick, setLocalTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setLocalTick(t => t + 1), 3600000);
    return () => clearInterval(timer);
  }, []);
  // 4. Optimistic Offsets (The Mirage)
  const [optimisticBalanceOffset, setOptimisticBalanceOffset] = useState(0);
  const [optimisticCommittedOffset, setOptimisticCommittedOffset] = useState(0);

  // === 1. PHYSICAL TRUTH (Absolute Hierarchy) ===

  // Chain 1: Total Balance (Decayed Base)
  const balance = useMemo(() => {
    const rawBalance = profile?.balance ?? 0;
    const lastUpdated = getMillis(profile?.last_updated ?? Date.now());
    const elapsedSec = ((Date.now() - lastUpdated) / 1000) | 0;
    const decayedBaseMilli = calculateDecayedValue(toMilli(rawBalance), elapsedSec);
    return fromMilli(decayedBaseMilli) + optimisticBalanceOffset;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.balance, profile?.last_updated, localTick, optimisticBalanceOffset]);

  // Chain 2: Committed Lm (Source of Truth: DB Record + Decay) - O(1)
  const committedLm = useMemo(() => {
    const rawCommitted = profile?.committed_lm ?? 0;
    const lastUpdated = getMillis(profile?.last_updated ?? Date.now());
    const elapsedSec = ((Date.now() - lastUpdated) / 1000) | 0;
    // O(1) Calculation: We trust the Vessel's record, decaying it as a single mass
    const decayedBaseMilli = calculateDecayedValue(toMilli(rawCommitted), elapsedSec);
    return fromMilli(decayedBaseMilli) + optimisticCommittedOffset;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.committed_lm, profile?.last_updated, localTick, optimisticCommittedOffset]);

  // Chain 3: Available Lm (The Result)
  const availableLm = useMemo(() => {
    return fromMilli(calculateAvailableLm(toMilli(balance), toMilli(committedLm)));
  }, [balance, committedLm]);


  // === 2. AUTOMATIC SANITIZATION (Ghost Exorcism) ===
  // [ABOLISHED 2026-02-13] Automatic repair is disabled to honor user will.
  // Data inconsistencies now lead to passive ritual state instead of auto-sync.


  // === 3. METABOLIC STATUS ===
  const status: WalletStatus = useMemo(() => {
    // 1. Loading Phase: strict wait to prevent flashes.
    if (profileLoading) return 'INITIALIZING';

    // 2. Ghost Phase: Loading done, but no profile found for authenticated user.
    // This allows App.tsx to show a specific Recovery/SignOut screen.
    if (user && !profile) return 'GHOST';

    // 3. Guest Phase: No user, no profile.
    // Return 'ALIVE' so we fall through to the Auth Gate in App.tsx.
    if (!profile) return 'ALIVE';

    const cycleStartedAt = profile.cycle_started_at || 0;

    const effectiveCycleDays = profile.scheduled_cycle_days || 10;
    const cycleDurationMillis = effectiveCycleDays * 24 * 60 * 60 * 1000;
    const expiryDate = cycleStartedAt + cycleDurationMillis;
    const now = Date.now();

    // 2026-02-13: PASSIVE RESCUE - "Detect corruption, transition to ritual"
    const isCorrupted = 
      isNaN(balance) || 
      isNaN(committedLm) || 
      isNaN(availableLm) || 
      isNaN(cycleStartedAt);

    if (isCorrupted) {
      console.warn("[Rescue] Corruption detected in wallet data. Transitioning to RITUAL_READY.");
      return 'RITUAL_READY';
    }

    // 1. First Birth (Never reset before)
    if (cycleStartedAt === 0) return 'RITUAL_READY';

    // 2. Rebirth (Time has passed) - "Even 1 second beyond next_reset requires ritual"
    if (now >= expiryDate) return 'RITUAL_READY';

    return 'ALIVE';
  }, [user, profile, profileLoading, balance, committedLm, availableLm]);

  // === 4. THE SACRED RITUAL (Rebirth) ===
  const performRebirthReset = async (options: { userInitiated: boolean }): Promise<{ success: boolean; newBalance?: number }> => {
    if (!user || !db) return { success: false };
    
    // Strict enforcement of User Will
    if (!options.userInitiated) {
      console.error("[Security] performRebirthReset was called without explicit user initiation. Blocked.");
      return { success: false };
    }

    if (status !== 'RITUAL_READY') return { success: false };

    try {
      let resultBalance = WORLD_CONSTANTS.REBIRTH_AMOUNT;

      await runTransaction(db, async (transaction) => {
        const userRef = doc(db!, "users", user.uid);
        const userDoc = await transaction.get(userRef);
        
        const settingsRef = doc(db!, "system_settings", "global");
        const settingsDoc = await transaction.get(settingsRef);

        const wishesRef = collection(db!, 'wishes');
        const activeQ = query(wishesRef, where('requester_id', '==', user.uid), where('status', 'in', ['open', 'in_progress']));
        const activeSnap = await getDocs(activeQ);
        
        if (!userDoc.exists()) throw "World Error: Soul not found";
        
        const data = userDoc.data();
        const cycleStartedAt = getMillis(data.cycle_started_at);

        const now = Date.now();
        let newAnchorTimeMillis: number;
        let isFirstBirth = false;

        if (cycleStartedAt === 0) {
            newAnchorTimeMillis = now;
            isFirstBirth = true;
        } else {
            const days = data.scheduled_cycle_days || 10;
            const duration = days * 24 * 60 * 60 * 1000;
            const theoreticalEnd = cycleStartedAt + duration;

            if (theoreticalEnd > now || (now - theoreticalEnd) > duration * 2) {
                newAnchorTimeMillis = now;
            } else {
                newAnchorTimeMillis = theoreticalEnd;
            }
        }

        const exactElapsedSec = Math.floor((now - newAnchorTimeMillis) / 1000);
        // Pure integer math for rebirth decay
        const milliDecay = calculateDecayedValue(toMilli(WORLD_CONSTANTS.REBIRTH_AMOUNT), exactElapsedSec);
        resultBalance = fromMilli(milliDecay);

        const txId = `rebirth_${user.uid}_${newAnchorTimeMillis}`;
        const txRef = doc(db!, 'transactions', txId);
        const txDoc = await transaction.get(txRef);
        if (txDoc.exists() && !isFirstBirth) return; 

        const nextCycleDays = settingsDoc.exists() ? (settingsDoc.data().cycleDays || 10) : 10;
        
        let newCommittedMilli = 0;
        activeSnap.forEach(d => {
            const w = d.data();
            const wElapsedSec = ((now - getMillis(w.created_at)) / 1000) | 0;
            const decayedMilli = calculateDecayedValue(toMilli(w.cost || 0), wElapsedSec);
            newCommittedMilli += decayedMilli;
        });

        const anchorDate = new Date(newAnchorTimeMillis);

        transaction.update(userRef, {
            balance: WORLD_CONSTANTS.REBIRTH_AMOUNT,
            committed_lm: fromMilli(newCommittedMilli),
            last_updated: anchorDate,
            cycle_started_at: anchorDate,
            scheduled_cycle_days: nextCycleDays
        });

        transaction.set(txRef, {
            type: isFirstBirth ? 'BIRTH' : 'REBIRTH',
            user_id: user.uid,
            amount: WORLD_CONSTANTS.REBIRTH_AMOUNT,
            created_at: serverTimestamp(),
            anchor_time: anchorDate,
            description: isFirstBirth ? '命が宿りました' : '魂が再生されました'
        });

        const today = new Date().toISOString().split("T")[0];
        const statsRef = doc(db!, "daily_stats", today);
        transaction.set(statsRef, {
            reborn_count: increment(1),
            updated_at: serverTimestamp()
        }, { merge: true });

      });

      return { success: true, newBalance: resultBalance };
    } catch (e) {
      console.error("Purification Failed:", e);
      return { success: false };
    }
  };

  const pay = async (amount: number): Promise<boolean> => {
    if (!user || !db) return false;
    try {
      await runTransaction(db, async (transaction) => {
        const userRef = doc(db!, "users", user.uid);
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists()) throw "Missing Soul";

        const data = userDoc.data();
        const lastUpdated = getMillis(data.last_updated);
        const elapsedSec = ((Date.now() - lastUpdated) / 1000) | 0;
        const currentRealMilli = calculateDecayedValue(toMilli(data.balance), elapsedSec);
        const currentRealBalance = fromMilli(currentRealMilli);

        if (currentRealBalance < amount) throw "Insufficient Energy";

        const milliRemaining = toMilli(currentRealBalance) - toMilli(amount);

        transaction.update(userRef, {
          balance: fromMilli(milliRemaining),
          last_updated: serverTimestamp()
        });

        const today = new Date().toISOString().split("T")[0];
        const statsRef = doc(db!, "daily_stats", today);
        transaction.set(statsRef, {
          volume: increment(amount),
          updated_at: serverTimestamp()
        }, { merge: true });
      });
      return true;
    } catch (e) {
      console.error("Payment Failed:", e);
      return false;
    }
  };

  const value: WalletContextType = {
    balance,
    committedLm,
    availableLm,
    status,
    pay,
    performRebirthReset,
    isLoading: profileLoading || wishesLoading,
    optimisticBalanceOffset,
    setOptimisticBalanceOffset,
    optimisticCommittedOffset,
    setOptimisticCommittedOffset,
  };

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
};
