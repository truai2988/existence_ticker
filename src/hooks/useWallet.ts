import { useMemo, useEffect, useState } from "react";
import { useAuth } from "./useAuthHook";
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
import { useProfile } from "./useProfile";
import { 
  calculateDecayedValue, 
  calculateAvailableLm, 
  WORLD_CONSTANTS,
  toMilli,
  fromMilli
} from "../logic/worldPhysics";
import { useWishesContext } from "../contexts/WishesContext";

export type WalletStatus = 'ALIVE' | 'EMPTY' | 'RITUAL_READY';

export const useWallet = () => {
  const { user } = useAuth();
  const { profile, isLoading: profileLoading } = useProfile();
  const { userWishes, isLoading: wishesLoading } = useWishesContext();

  // 1-Hour Silence: Live Ticker for live decay updates (1 hour)
  const [localTick, setLocalTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setLocalTick(t => t + 1), 3600000);
    return () => clearInterval(timer);
  }, []);

  // === 1. PHYSICAL TRUTH (Absolute Hierarchy) ===

  // Chain 1: Total Balance (Decayed Base)
  const balance = useMemo(() => {
    const rawBalance = profile?.balance ?? 0;
    const lastUpdated = profile?.last_updated;
    return calculateDecayedValue(rawBalance, lastUpdated);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.balance, profile?.last_updated, localTick]);

  // Chain 2: Committed Lm (Sum of real active wishes, each decayed)
  const committedLm = useMemo(() => {
    if (wishesLoading) return profile?.committed_lm ?? 0;
    
    let totalMilli = 0;
    userWishes.forEach(w => {
        const decayedCost = calculateDecayedValue(w.cost || 0, w.created_at);
        totalMilli += toMilli(decayedCost);
    });
    return fromMilli(totalMilli);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userWishes, wishesLoading, profile?.committed_lm, localTick]);

  // Chain 3: Available Lm (The Result)
  const availableLm = useMemo(() => {
    return calculateAvailableLm(balance, committedLm);
  }, [balance, committedLm]);


  // === 2. AUTOMATIC SANITIZATION (Ghost Exorcism) ===
  useEffect(() => {
    if (!user || !db || wishesLoading || profileLoading || !profile) return;
    
    // We compare with the real-time Truth we just calculated
    const dbCommitted = profile.committed_lm || 0;
    const realCommitted = committedLm;
    
    // Use a small epsilon for float comparison
    if (Math.abs(dbCommitted - realCommitted) > 0.01) {
        console.warn(`[Sanitization] Syncing Committed Lm: DB(${dbCommitted}) -> Real(${realCommitted})`);
        
        const syncDb = async () => {
            try {
                await runTransaction(db!, async (transaction) => {
                    const userRef = doc(db!, "users", user.uid);
                    const userSnap = await transaction.get(userRef);
                    if (!userSnap.exists()) return;
                    
                    transaction.update(userRef, {
                        committed_lm: realCommitted
                    });
                    
                    // Log the correction
                    const logRef = doc(collection(db!, "transactions"));
                    transaction.set(logRef, {
                        type: 'SYSTEM_SYNC',
                        user_id: user.uid,
                        amount: fromMilli(toMilli(realCommitted) - toMilli(dbCommitted)),
                        description: `Auto-Sync: committed_lm corrected to match decayed active wishes.`,
                        created_at: serverTimestamp()
                    });
                });
            } catch (e) {
                console.error("Sanitization Failed", e);
            }
        };
        syncDb();
    }
  }, [user, profile, committedLm, wishesLoading, profileLoading]);

  // === 3. METABOLIC STATUS ===
  const status: WalletStatus = useMemo(() => {
    if (!profile || profileLoading) return 'ALIVE';

    const cycleStartedAt = profile.cycle_started_at && typeof profile.cycle_started_at.toMillis === 'function'
        ? profile.cycle_started_at.toMillis()
        : 0;

    if (profile.is_cycle_observed === false) return 'RITUAL_READY'; 
    if (cycleStartedAt === 0) return 'RITUAL_READY';

    const effectiveCycleDays = profile.scheduled_cycle_days || 10;
    const cycleDurationMillis = effectiveCycleDays * 24 * 60 * 60 * 1000;
    const expiryDate = cycleStartedAt + cycleDurationMillis;
    const now = Date.now();

    if (now >= expiryDate) return 'RITUAL_READY';
    if (balance <= 0) return 'EMPTY';
    return 'ALIVE';
  }, [profile, profileLoading, balance]);

  // === 4. THE SACRED RITUAL (Rebirth) ===
  const performRebirthReset = async (): Promise<{ success: boolean; newBalance?: number }> => {
    if (!user || !db) return { success: false };
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
        const cycleStartedAt = data.cycle_started_at && typeof data.cycle_started_at.toMillis === 'function'
            ? data.cycle_started_at.toMillis()
            : 0;

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
        const milliDecay = Math.floor((exactElapsedSec * 25) / 9);
        const milliRebirth = toMilli(WORLD_CONSTANTS.REBIRTH_AMOUNT);
        resultBalance = fromMilli(Math.max(0, milliRebirth - milliDecay));

        const txId = `rebirth_${user.uid}_${newAnchorTimeMillis}`;
        const txRef = doc(db!, 'transactions', txId);
        const txDoc = await transaction.get(txRef);
        if (txDoc.exists() && !isFirstBirth) return; 

        const nextCycleDays = settingsDoc.exists() ? (settingsDoc.data().cycleDays || 10) : 10;
        
        let newCommittedMilli = 0;
        activeSnap.forEach(d => {
            const w = d.data();
            const decayed = calculateDecayedValue(w.cost || 0, w.created_at);
            newCommittedMilli += toMilli(decayed);
        });

        const anchorDate = new Date(newAnchorTimeMillis);

        transaction.update(userRef, {
            balance: WORLD_CONSTANTS.REBIRTH_AMOUNT,
            committed_lm: fromMilli(newCommittedMilli),
            last_updated: anchorDate,
            cycle_started_at: anchorDate,
            scheduled_cycle_days: nextCycleDays,
            is_cycle_observed: true
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

  const pay = async (amount: number, reason: string): Promise<boolean> => {
    if (!user || !db) return false;
    console.log(`[Wallet] Processing payment: ${amount} for ${reason}`);
    try {
      await runTransaction(db, async (transaction) => {
        const userRef = doc(db!, "users", user.uid);
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists()) throw "Missing Soul";

        const data = userDoc.data();
        const currentRealBalance = calculateDecayedValue(data.balance, data.last_updated);

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

  return {
    balance,
    committedLm,
    availableLm,
    status,
    pay,
    performRebirthReset,
    isLoading: profileLoading || wishesLoading,
  };
};

