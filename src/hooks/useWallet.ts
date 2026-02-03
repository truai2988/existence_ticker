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
  onSnapshot,
} from "firebase/firestore";
import { useProfile } from "./useProfile";
import { calculateDecayedValue, calculateAvailableLm, WORLD_CONSTANTS } from "../logic/worldPhysics";
import { Wish } from "../types";


export const useWallet = () => {
  const { user } = useAuth();
  const { profile, isLoading: profileLoading } = useProfile();
  
  // Local state for MY active wishes (to calculate committedLm accurately without context dependency)
  const [activeWishes, setActiveWishes] = useState<Wish[]>([]);

  // === 自分のActive Wishを購読 (Optimization) ===
  // wishesContextに依存せず、必要なデータ("open", "in_progress")のみを購読
  useEffect(() => {
     if (!user || !db) {
         setActiveWishes([]);
         return;
     }

     const q = query(
         collection(db, 'wishes'),
         where('requester_id', '==', user.uid),
         where('status', 'in', ['open', 'in_progress'])
     );

     const unsubscribe = onSnapshot(q, (snapshot) => {
         const docs = snapshot.docs.map(d => {
             const data = d.data();
             return {
                 id: d.id,
                 ...data,
                 // Ensure mandatory fields exist for type safety
                 requester_id: data.requester_id || '',
                 content: data.content || '',
                 gratitude_preset: data.gratitude_preset || 'light',
                 status: data.status || 'open',
                 created_at: data.created_at,
             } as Wish;
         });
         setActiveWishes(docs);
     }, (err) => {
         console.error("Failed to subscribe to active wishes:", err);
     });

     return () => unsubscribe();
  }, [user]);

  // === 減価適用後のバランス（Physical Truth）===
  /**
   * 手持ちの光（Balance）:
   * Firestoreに保存されている初期値に、時間経過による減価を適用した現在の値。
   * これが物理的な真実であり、すべての計算の基準となる。
   */
  const balance = useMemo(() => {
    const rawBalance = profile?.balance ?? 0;
    const lastUpdated = profile?.last_updated;
    
    return calculateDecayedValue(rawBalance, lastUpdated);
  }, [profile?.balance, profile?.last_updated]);

  // === Reservation Logic (聖なる約定) ===
  /**
   * 約束中の光（Committed Lm）:
   * 自分が発信した依頼のうち、status が 'open' または 'in_progress' のものに
   * 対する報酬（cost）の合計。ただし、手持ちと同じレート（10 Lm/h）で減価させた現在価値を使用。
   * これにより、「手持ち」と「約束」が同じ速度で減り続け、常に整合性を保つ。
   */
  const committedLm = useMemo(() => {
    if (!user) return 0;
    
    // 各依頼のcostを発行時から現在までの減価を考慮して合計
    return activeWishes.reduce((sum, w) => {
      const initialCost = w.cost || 0;
      const createdAt = w.created_at; // Firestore Timestamp or ISO string
      
      // calculateDecayedValueで減価した現在価値を計算
      const currentValue = calculateDecayedValue(initialCost, createdAt);
      
      return sum + currentValue;
    }, 0);
  }, [activeWishes, user]);

  /**
   * 分かち合える光（Available Lm）:
   * 手持ちから約束中の光を引いた、新たに誰かに託したり贈ったりできる余白。
   * 負にはならない（器の物理法則）。
   * 
   * 安全弁: 計算誤差があっても、availableLmが手持ちを超えることはない。
   */
  const availableLm = calculateAvailableLm(balance, committedLm);

  // === Lunar Cycle Logic (Metabolism) ===
  /**
   * Checks if the user's personal 10-day cycle has expired.
   * If so, resets their balance to 2400 (The Vessel Cap).
   */
  const checkLunarPhase = async (): Promise<{ reset: boolean }> => {
    if (!user || !db) return { reset: false };

    // === OPTIMIZATION: Early Exit using local data ===
    // If we have profile data (from useProfile listener), check locally first.
    // This prevents running a write transaction on every page load/mount.
    if (profile && profile.cycle_started_at && typeof profile.cycle_started_at.toMillis === 'function') {
        const cycleStartedAt = profile.cycle_started_at.toMillis();
        const effectiveCycleDays = profile.scheduled_cycle_days || 10;
        const cycleDurationMillis = effectiveCycleDays * 24 * 60 * 60 * 1000;
        const now = Date.now();

        // If current time is strictly BEFORE the expiry, do nothing.
        // INTEGRITY UPDATE: Add a 60-second safety buffer for client clock skew.
        // If we are within 1 minute of expiry, allow the transaction to proceed (Safety Side).
        const timeRemaining = (cycleStartedAt + cycleDurationMillis) - now;
        const SAFETY_BUFFER = 60 * 1000; // 1 minute

        if (timeRemaining > SAFETY_BUFFER) {
            // Debug log only in dev or if specifically debugging
            // console.debug("Metabolism: Cycle active (Local Check). Skipping transaction.", timeRemaining / 1000, "s left");
            return { reset: false };
        }
    }

    const userRef = doc(db, "users", user.uid);

    try {
      let hasReset = false;

      await runTransaction(db, async (transaction) => {
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists()) throw "User missing";

        const data = userDoc.data();
        // Safe access to Timestamp
        const cycleStartedAt = data.cycle_started_at 
            ? (data.cycle_started_at.toMillis ? data.cycle_started_at.toMillis() : 0)
            : (data.created_at?.toMillis ? data.created_at.toMillis() : 0);

        // 1. NON-RETROACTIVITY Check (法の不遡及)
        // Use the cycle duration that was scheduled for THIS cycle.
        // If missing (legacy), default to 10 days.
        const effectiveCycleDays = data.scheduled_cycle_days || 10;
        
        const now = Date.now();
        const cycleDurationMillis = effectiveCycleDays * 24 * 60 * 60 * 1000;
        
        if (
          cycleStartedAt === 0 ||
          now - cycleStartedAt >= cycleDurationMillis
        ) {
          // === METABOLIC RESET (Rebirth) ===
          hasReset = true;
          const { REBIRTH_AMOUNT } = WORLD_CONSTANTS;

          // 2. Fetch NEXT Cycle Configuration (Apply New Law)
          // 次のサイクルの長さを決定する（ここで初めて新しい法が適用される）
          let nextCycleDays = 10; 
          try {
              const settingsRef = doc(db!, "system_settings", "global");
              const settingsDoc = await transaction.get(settingsRef);
              
              if (settingsDoc.exists()) {
                const val = settingsDoc.data().cycleDays;
                if (typeof val === "number") nextCycleDays = val;
              }
          } catch (e) {
              console.warn("Using default cycle days due to fetch error", e);
          }

          // === 第一の大罪の修正: 約束中のLmを計算 ===
          // トランザクション内でユーザーの依頼を読み取る
          const wishesRef = collection(db!, "wishes");
          const q = query(
            wishesRef,
            where("requester_id", "==", user.uid),
            where("status", "in", ["open", "in_progress"])
          );
          const wishesSnapshot = await getDocs(q); // Note: getDocs is NOT transactional but query is read-only
          
          // 約束中のLmを計算（減価を考慮）
          let committedLm = 0;
          wishesSnapshot.forEach((wishDoc) => {
            const wish = wishDoc.data();
            const initialCost = wish.cost || 0;
            const createdAt = wish.created_at;
            
            // calculateDecayedValueで減価した現在価値を計算
            const currentValue = calculateDecayedValue(initialCost, createdAt);
            committedLm += currentValue;
          });

          // リセット額を計算: 約束 + 100 Lm または 定数(2400) の大きい方
          // これにより、約束超過を防ぎつつ、常に最低限の余白(100)を確保
          const safeResetAmount = Math.max(REBIRTH_AMOUNT, Math.ceil(committedLm) + 100);

          console.log('[Lunar Cycle Reset]', {
            effectiveCycleDays,
            nextCycleDays,
            baseRebirthAmount: REBIRTH_AMOUNT,
            committedLm: Math.ceil(committedLm),
            finalResetAmount: safeResetAmount,
            保護された: safeResetAmount > REBIRTH_AMOUNT
          });

          transaction.update(userRef, {
            balance: safeResetAmount,
            last_updated: serverTimestamp(),
            cycle_started_at: serverTimestamp(), // New Cycle Starts Now
            scheduled_cycle_days: nextCycleDays, // Schedule Next Cycle Duration
            // last_phase_index: ... // Deprecated
          });

          // Incremental Counter for Souls Reborn (Daily Stats)
          const today = new Date().toISOString().split("T")[0];
          // db is defined here due to early return at line 20
          const dailyStatsRef = doc(db!, "daily_stats", today);
          transaction.set(
            dailyStatsRef,
            {
              reborn_count: increment(1),
              updated_at: serverTimestamp(),
            },
            { merge: true },
          ); // Merge ensures volume isn't wiped if updated concurrently

           // === Log Rebirth Transaction ===
          const txRef = doc(collection(db!, 'transactions'));
          transaction.set(txRef, {
              type: 'REBIRTH',
              recipient_id: user.uid,
              recipient_name: data.name || 'User',
              amount: safeResetAmount,
              created_at: serverTimestamp(),
              description: '太陽の光で器が満たされました'
          });
        }
      });

      if (hasReset) {
        console.log("Metabolism: New Cycle Started (Protected Reset)");
        return { reset: true };
      }
      return { reset: false };
    } catch (e) {
      console.error("Metabolism Check Failed:", e);
      return { reset: false };
    }
  };

  const pay = async (amount: number, reason: string): Promise<boolean> => {
    if (!user || !db) return false;
    const userRef = doc(db, "users", user.uid);

    try {
      await runTransaction(db, async (transaction) => {
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists()) throw "User does not exist!";

        const data = userDoc.data();
        const currentBalance = data.balance || 0;
        const lastUpdated = data.last_updated;

        // 1. Calculate TRUE Balance at this exact moment
        const realTimeBalance = calculateDecayedValue(
          currentBalance,
          lastUpdated,
        );

        // 2. Check sufficiency
        if (realTimeBalance < amount) {
          throw "Insufficient Life Points (Starvation)";
        }

        // 3. Update
        transaction.update(userRef, {
          balance: realTimeBalance - amount,
          last_updated: serverTimestamp(),
        });

        // 4. Record Daily Stats (Metabolism)
        const today = new Date().toISOString().split("T")[0];
        const dailyStatsRef = doc(db!, "daily_stats", today);
        transaction.set(
          dailyStatsRef,
          {
            volume: increment(amount),
            wish_volume: increment(amount),
            updated_at: serverTimestamp(),
          },
          { merge: true },
        );
      });
      console.log(`Paid ${amount} Lm for ${reason}`);
      return true;
    } catch (e) {
      console.error("Payment failed:", e);
      return false;
    }
  };



  // === 凍結方針（Freeze Policy）===
  // committedLm > balance の状態を検出し、警告を表示する（自動キャンセルは行わない）
  useEffect(() => {
    // profileLoading中はbalanceが0になる可能性があるため、チェックをスキップ
    // また、profileが取得できていない場合(null)もスキップ
    if (profileLoading || !profile) return;

    if (committedLm > balance && user && db) {
      // System Diagnostic: This state should be physically impossible if logic holds.
      // We log it silently for debugging purposes only.
      console.debug('[System Diagnostic] Vessel Pressure Warning: Committed > Balance', {
        balance,
        committedLm,
        overrun: committedLm - balance,
        uid: user.uid
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [committedLm, balance, user]);

  return {
    balance,
    committedLm,
    availableLm,
    pay,
    checkLunarPhase,
    refundUnfairDeductions, // 返金機能をエクスポート
    isLoading: profileLoading,
  };
};

/**
 * 既存ユーザーへの返金機能
 * 依頼作成時に不当に引き落とされたcostをbalanceに返金する
 * 
 * 修正版: アクティブな依頼 + 最近キャンセルされた依頼も対象
 * 自己治癒機能でキャンセルされた依頼の返金も含む
 */
export const refundUnfairDeductions = async (userId: string): Promise<{ refunded: boolean; amount: number }> => {
  if (!db) return { refunded: false, amount: 0 };

  try {
    console.log('🔄 [Refund] 返金処理を開始します...', { userId });

    // ユーザーの依頼を取得（すべてのステータス）
    const wishesRef = collection(db, "wishes");
    const q = query(
      wishesRef,
      where("requester_id", "==", userId)
    );
    const wishesSnapshot = await getDocs(q);

    console.log('📊 [Refund] 依頼データ:', {
      総依頼数: wishesSnapshot.size,
      依頼一覧: wishesSnapshot.docs.map(d => ({
        id: d.id,
        status: d.data().status,
        cost: d.data().cost,
        created_at: d.data().created_at,
        cancelled_at: d.data().cancelled_at
      }))
    });

    // アクティブな依頼 + 「自己治癒」でキャンセルされた依頼を対象に返金
    let totalRefund = 0;
    const refundTargets: Array<{ id: string; status: string; cost: number; currentValue: number }> = [];
    
    wishesSnapshot.forEach((wishDoc) => {
      const wish = wishDoc.data();
      const status = wish.status;
      const cancelReason = wish.cancel_reason || '';
      
      // open, in_progress, または自己治癒でキャンセルされた依頼を対象
      const isActive = status === 'open' || status === 'in_progress';
      const isSelfHealedCancellation = status === 'cancelled' && cancelReason.includes('自己治癒');
      
      if (isActive || isSelfHealedCancellation) {
        const initialCost = wish.cost || 0;
        const createdAt = wish.created_at;
        
        // アクティブな依頼は減価後の現在価値、キャンセル済みは初期コストで返金
        const refundValue = isActive 
          ? calculateDecayedValue(initialCost, createdAt)
          : initialCost;
        
        refundTargets.push({
          id: wishDoc.id,
          status,
          cost: initialCost,
          currentValue: refundValue
        });
        
        totalRefund += refundValue;
      }
    });

    console.log('💰 [Refund] 返金計算結果:', {
      返金対象数: refundTargets.length,
      返金額合計: totalRefund,
      依頼詳細: refundTargets
    });

    if (totalRefund === 0) {
      console.log('✅ [Refund] 返金対象の依頼がありません');
      return { refunded: false, amount: 0 };
    }

    // Firestoreでbalanceに加算
    const { updateDoc } = await import("firebase/firestore");
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      balance: increment(totalRefund)
    });

    console.log('✅ [Refund] 返金完了', {
      返金額: totalRefund,
      依頼数: refundTargets.length
    });

    return { refunded: true, amount: totalRefund };
  } catch (e) {
    console.error("❌ [Refund] 返金失敗:", e);
    return { refunded: false, amount: 0 };
  }
};
