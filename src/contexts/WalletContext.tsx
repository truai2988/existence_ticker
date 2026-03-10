import React, { useMemo, useEffect, useState, useCallback, ReactNode } from "react";
import { useAuth } from "../hooks/useAuthHook";
import { db } from "../lib/firebase";
import {
  doc,
  runTransaction,
  serverTimestamp,
  increment,
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
import { WalletContext } from "./WalletContextDefinition";

// WalletProvider Component

export const WalletProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { profile, isLoading: profileLoading } = useProfile();
  const { userActiveWishes, isLoading: wishesLoading } = useWishesContext();

  // 1-Hour Silence: Global Clock for steady decay updates (1 hour)
  const [globalNow, setGlobalNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setGlobalNow(Date.now()), 3600000);
    return () => clearInterval(timer);
  }, []);
  // 4. Optimistic Offsets (The Mirage)
  const [optimisticBalanceOffset, setOptimisticBalanceOffset] = useState(0);
  const [optimisticCommittedOffset, setOptimisticCommittedOffset] = useState(0);

  // === 1. PHYSICAL TRUTH (Absolute Hierarchy) ===

  // Chain 1: Total Balance (Decayed from Cycle Anchor)
  const balance = useMemo(() => {
    // 【世界の理】器の価値は誕生（cycle_started_at）からのみ計算される。
    // 中間のスナップショット（last_updated）は不純物として排除する。
    const cycleStartedAt = getMillis(profile?.cycle_started_at, 0);
    if (cycleStartedAt === 0) return 0; // まだ誕生していない

    const elapsedSec = ((globalNow - cycleStartedAt) / 1000) | 0;
    
    // 誕生時の満タン状態（2400）からの減価を計算
    const initialMilli = toMilli(WORLD_CONSTANTS.REBIRTH_AMOUNT);
    const decayedVesselMilli = calculateDecayedValue(initialMilli, elapsedSec);
    
    // 手持ち = 現在の器の価値 - このサイクルでの総移動額（分かち合った分）
    const totalSpentMilli = toMilli(profile?.spent_lm || 0);
    const currentBalanceMilli = decayedVesselMilli - totalSpentMilli;
    
    // 【世界の理】器の容量は2400 Lmが限界（絶対的な壁）。
    const cappedBalanceMilli = Math.min(initialMilli, Math.max(0, currentBalanceMilli));

    return fromMilli(cappedBalanceMilli) + optimisticBalanceOffset;
  }, [profile?.cycle_started_at, profile?.spent_lm, globalNow, optimisticBalanceOffset]);

  const committedLm = useMemo(() => {
    // 【世界の理】願いの価値はそれそれが生まれた瞬間（created_at）からのみ計算される。
    let totalMilli = 0;
    const costMap: Record<string, number> = { light: 100, medium: 500, heavy: 1000 };
    
    userActiveWishes.forEach(wish => {
      const initialCost = wish.cost || costMap[wish.gratitude_preset || ''] || 0;
      const createdAt = getMillis(wish.created_at);
      const elapsedSec = ((globalNow - createdAt) / 1000) | 0;
      totalMilli += calculateDecayedValue(toMilli(initialCost), elapsedSec);
    });
    return fromMilli(totalMilli) + optimisticCommittedOffset;
  }, [userActiveWishes, globalNow, optimisticCommittedOffset]);

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
    const now = globalNow;

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
  }, [user, profile, profileLoading, balance, committedLm, availableLm, globalNow]);

  // === 4. THE SACRED RITUAL (Rebirth) ===
  const performRebirthReset = useCallback(async (options: { userInitiated: boolean }): Promise<{ success: boolean; newBalance?: number }> => {
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
        
        if (!userDoc.exists()) throw "World Error: Soul not found";
        
        const data = userDoc.data();
        const cycleStartedAt = getMillis(data.cycle_started_at, 0);

        let newAnchorTimeMillis: number;
        let isFirstBirth = false;

        if (cycleStartedAt === 0) {
            newAnchorTimeMillis = Date.now();
            isFirstBirth = true;
        } else {
            const days = data.scheduled_cycle_days || 10;
            const duration = days * 24 * 60 * 60 * 1000;
            const now = Date.now();
            const elapsedSinceStart = now - cycleStartedAt;
            const periodsElapsed = Math.floor(elapsedSinceStart / duration);

            if (periodsElapsed <= 0) {
                // 早期リセットの場合（期間終了前）は、現在時刻から再スタート
                newAnchorTimeMillis = now;
            } else {
                // 遅れてリセットした場合、経過したサイクル数分だけ進めた「直近のリズム境界」にスナップする
                newAnchorTimeMillis = cycleStartedAt + (periodsElapsed * duration);
            }
        }

        const exactElapsedSec = Math.floor((Date.now() - newAnchorTimeMillis) / 1000);
        // Pure integer math for rebirth decay (Using NEW law for the coming cycle)
        const milliDecay = calculateDecayedValue(toMilli(WORLD_CONSTANTS.REBIRTH_AMOUNT), exactElapsedSec);
        resultBalance = fromMilli(milliDecay);

        const txId = `rebirth_${user.uid}_${newAnchorTimeMillis}`;
        const txRef = doc(db!, 'transactions', txId);
        const txDoc = await transaction.get(txRef);
        if (txDoc.exists() && !isFirstBirth) return; 
        
        // (nextCycleDays already declared above)
        
        const anchorDate = new Date(newAnchorTimeMillis);

        transaction.update(userRef, {
            balance: WORLD_CONSTANTS.REBIRTH_AMOUNT,
            last_updated: serverTimestamp(), 
            cycle_started_at: newAnchorTimeMillis,
            spent_lm: 0
        });

        transaction.set(txRef, {
            type: isFirstBirth ? 'BIRTH' : 'REBIRTH',
            user_id: user.uid,
            owner_id: user.uid,
            sender_id: user.uid,
            sender_name: data.name || "奏者",
            amount: WORLD_CONSTANTS.REBIRTH_AMOUNT,
            created_at: serverTimestamp(),
            anchor_time: anchorDate,
            description: isFirstBirth ? '源気が流れ込んできました' : '魂が再生されました'
        });

        const today = new Date().toISOString().split("T")[0];
        const statsRef = doc(db!, "daily_stats", today);
        transaction.set(statsRef, {
            reborn_count: increment(1),
            updated_at: serverTimestamp()
        }, { merge: true });

      });

      return { success: true, newBalance: resultBalance };
    } catch (error) {
      console.error("Purification Failed:", error);
      return { success: false };
    }
  }, [user, status]);

  const contextValue = useMemo(() => ({
    balance,
    committedLm,
    availableLm,
    status,
    performRebirthReset,
    isLoading: profileLoading || wishesLoading,
    globalNow,
    optimisticBalanceOffset,
    setOptimisticBalanceOffset,
    optimisticCommittedOffset,
    setOptimisticCommittedOffset,
  }), [balance, committedLm, availableLm, status, performRebirthReset, profileLoading, wishesLoading, globalNow, optimisticBalanceOffset, optimisticCommittedOffset]);

  return <WalletContext.Provider value={contextValue}>{children}</WalletContext.Provider>;
};
