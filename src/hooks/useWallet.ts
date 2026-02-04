import { useMemo } from "react";
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
import { calculateDecayedValue, calculateAvailableLm, WORLD_CONSTANTS } from "../logic/worldPhysics";

export type WalletStatus = 'ALIVE' | 'EMPTY' | 'RITUAL_READY';

export const useWallet = () => {
  const { user } = useAuth();
  const { profile, isLoading: profileLoading } = useProfile();

  // === 1. PHYSICAL TRUTH (Decayed Values) ===
  const balance = useMemo(() => {
    const rawBalance = profile?.balance ?? 0;
    const lastUpdated = profile?.last_updated;
    return calculateDecayedValue(rawBalance, lastUpdated);
  }, [profile?.balance, profile?.last_updated]);

  const committedLm = useMemo(() => {
    const rawCommitted = profile?.committed_lm || 0;
    const lastUpdated = profile?.last_updated;
    return calculateDecayedValue(rawCommitted, lastUpdated);
  }, [profile?.committed_lm, profile?.last_updated]);

  const availableLm = calculateAvailableLm(balance, committedLm);

  // === 2. METABOLIC STATUS (The Three States) ===
  const status: WalletStatus = useMemo(() => {
    if (!profile || profileLoading) return 'ALIVE'; // Default while loading

    // Anchor check
    const cycleStartedAt = profile.cycle_started_at && typeof profile.cycle_started_at.toMillis === 'function'
        ? profile.cycle_started_at.toMillis()
        : 0;

    if (cycleStartedAt === 0) return 'RITUAL_READY'; // First Birth Needed

    const effectiveCycleDays = profile.scheduled_cycle_days || 10;
    const cycleDurationMillis = effectiveCycleDays * 24 * 60 * 60 * 1000;
    const expiryDate = cycleStartedAt + cycleDurationMillis;
    const now = Date.now();

    if (now >= expiryDate) return 'RITUAL_READY'; // Rebirth Needed
    if (balance <= 0) return 'EMPTY'; // Vessel is dry
    return 'ALIVE'; // Flowing
  }, [profile, profileLoading, balance]);

  // === 3. THE SACRED RITUAL (Rebirth / First Birth) ===
  const performRebirthReset = async (): Promise<{ success: boolean; newBalance?: number }> => {
    if (!user || !db) return { success: false };
    if (status !== 'RITUAL_READY') return { success: false };

    try {
      let resultBalance = WORLD_CONSTANTS.REBIRTH_AMOUNT;

      await runTransaction(db, async (transaction) => {
        // --- PHASE I: READS (全 transaction.get() を冒頭に集約) ---
        const userRef = doc(db!, "users", user.uid);
        const userDoc = await transaction.get(userRef);
        
        const settingsRef = doc(db!, "system_settings", "global");
        const settingsDoc = await transaction.get(settingsRef);

        // Pre-read active social contracts (Wishes)
        const wishesRef = collection(db!, 'wishes');
        const activeQ = query(wishesRef, where('requester_id', '==', user.uid));
        const activeSnap = await getDocs(activeQ);
        const activeWishRefs = activeSnap.docs
            .filter(d => ['open', 'in_progress'].includes(d.data().status))
            .map(d => d.ref);
        
        const wishDocs = [];
        for (const wRef of activeWishRefs) {
            const snap = await transaction.get(wRef);
            wishDocs.push({ ref: wRef, snap });
        }

        // --- PHASE II: LOGIC (判定と計算) ---
        if (!userDoc.exists()) throw "World Error: Soul not found";
        
        const data = userDoc.data();
        const cycleStartedAt = data.cycle_started_at && typeof data.cycle_started_at.toMillis === 'function'
            ? data.cycle_started_at.toMillis()
            : 0;

        const now = Date.now();
        let newAnchorTimeMillis: number;
        let isFirstBirth = false;

        if (cycleStartedAt === 0) {
            // First Birth: Anchor to NOW
            newAnchorTimeMillis = now;
            isFirstBirth = true;
        } else {
            // Rebirth: Anchor to Theoretical Expiry
            const days = data.scheduled_cycle_days || 10;
            const duration = days * 24 * 60 * 60 * 1000;
            const theoreticalEnd = cycleStartedAt + duration;

            // Rescue Logic: If theoretical anchor is too far in past or broken
            if (theoreticalEnd > now || (now - theoreticalEnd) > duration * 2) {
                newAnchorTimeMillis = now; // Out of sync or broken -> Rescue to NOW
            } else {
                newAnchorTimeMillis = theoreticalEnd;
            }
        }

        // Calculation of Balance at the Anchor (Mathematical Truth)
        const exactElapsedHours = Math.floor((now - newAnchorTimeMillis) / 3600000);
        const decay = exactElapsedHours * WORLD_CONSTANTS.DECAY_RATE_HOURLY;
        resultBalance = Math.max(0, WORLD_CONSTANTS.REBIRTH_AMOUNT - decay);

        // Idempotency: Check if this specific anchor has been recorded
        const txId = `rebirth_${user.uid}_${newAnchorTimeMillis}`;
        const txRef = doc(db!, 'transactions', txId);
        const txDoc = await transaction.get(txRef);
        if (txDoc.exists() && !isFirstBirth) {
            console.warn("Idempotency: Ritual already performed for this anchor.");
            return; 
        }

        // Settings
        const nextCycleDays = settingsDoc.exists() ? (settingsDoc.data().cycleDays || 10) : 10;
        
        // Calculate remaining liability from active contracts
        let newCommitted = 0;
        for (const { snap } of wishDocs) {
            if (snap.exists()) {
                const w = snap.data();
                newCommitted += calculateDecayedValue(w.cost, w.created_at);
            }
        }

        // --- PHASE III: WRITES (書き込み) ---
        const anchorDate = new Date(newAnchorTimeMillis);

        transaction.update(userRef, {
            balance: WORLD_CONSTANTS.REBIRTH_AMOUNT,
            committed_lm: newCommitted,
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

        // Stats Tracker
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
    try {
      await runTransaction(db, async (transaction) => {
        const userRef = doc(db!, "users", user.uid);
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists()) throw "Missing Soul";

        const data = userDoc.data();
        const currentRealBalance = calculateDecayedValue(data.balance, data.last_updated);

        if (currentRealBalance < amount) throw "Insufficient Energy";

        transaction.update(userRef, {
          balance: currentRealBalance - amount,
          last_updated: serverTimestamp()
        });

        const today = new Date().toISOString().split("T")[0];
        const statsRef = doc(db!, "daily_stats", today);
        transaction.set(statsRef, {
          volume: increment(amount),
          updated_at: serverTimestamp()
        }, { merge: true });
        
        console.log(`Flow: Paid ${amount} for ${reason}`);
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
    isLoading: profileLoading,
  };
};
