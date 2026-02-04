import { useMemo, useEffect } from "react";
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


export const useWallet = () => {
  const { user } = useAuth();
  const { profile, isLoading: profileLoading } = useProfile();

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
   * User ドキュメントの committed_lm フィールドから直接読み取る。
   * 減価は既に Balance と同期されているため、再計算不要。
   * 
   * Phase 3: 重い reduce 計算を完全に排除。
   */
  const committedLm = useMemo(() => {
    return profile?.committed_lm || 0;
  }, [profile?.committed_lm]);

  /**
   * 分かち合える光（Available Lm）:
   * 手持ちから約束中の光を引いた、新たに誰かに託したり贈ったりできる余白。
   * 負にはならない（器の物理法則）。
   * 
   * 安全弁: 計算誤差があっても、availableLmが手持ちを超えることはない。
   */
  const availableLm = calculateAvailableLm(balance, committedLm);

  // === Lunar Cycle Logic (Metabolism) ===
  const cycleStatus = useMemo(() => {
    if (!profile) return { isExpired: false, expiryDate: null };

    const cycleStartedAt = profile.cycle_started_at 
        ? (typeof profile.cycle_started_at.toMillis === 'function' ? profile.cycle_started_at.toMillis() : 0)
        : (profile.created_at && typeof profile.created_at.toMillis === 'function' ? profile.created_at.toMillis() : 0);
    
    // Fallback if no timestamps (shouldn't happen for valid users)
    if (cycleStartedAt === 0) return { isExpired: false, expiryDate: null };

    const effectiveCycleDays = profile.scheduled_cycle_days || 10;
    const cycleDurationMillis = effectiveCycleDays * 24 * 60 * 60 * 1000;
    const expiryDate = cycleStartedAt + cycleDurationMillis;
    const now = Date.now();

    return {
        isUnborn: cycleStartedAt === 0,
        isExpired: cycleStartedAt !== 0 && now >= expiryDate,
        expiryDate: cycleStartedAt !== 0 ? expiryDate : null,
        cycleStartedAt,
        cycleDurationMillis
    };
  }, [profile]);

  /**
   * 存在の祝祭 (Existence Celebration)
   * Resets the vessel to 2400 Lm.
   * - First Birth: Anchored to NOW. Balance 2400.
   * - Rebirth: Anchored to "Objective Past" (cycle expiry). Balance < 2400 (Decayed).
   * This is a manual ritual triggered by the user.
   */
  const performRebirthReset = async (): Promise<{ success: boolean; newBalance?: number; newAnchorTime?: number }> => {
    if (!user || !db) return { success: false };
    if (!cycleStatus.isExpired && !cycleStatus.isUnborn) return { success: false };
    
    // Calculate Anchor Time
    const { cycleStartedAt, cycleDurationMillis, isUnborn } = cycleStatus;
    const now = Date.now();
    
    let newAnchorTimeMillis = now;
    
    if (isUnborn) {
        // First Birth: Life starts NOW
        newAnchorTimeMillis = now;
    } else {
        // Rebirth: Anchored to the past end of cycle
        // Safety checks
        if (!cycleStartedAt || !cycleDurationMillis) return { success: false };
        
        const elapsed = now - cycleStartedAt;
        const cyclesElapsed = Math.floor(elapsed / cycleDurationMillis); 
        newAnchorTimeMillis = cycleStartedAt + (cyclesElapsed * cycleDurationMillis);
    }
    
        // === PRE-READ: Active Wishes to Cleanse ===
        // Rebirth must clear all liabilities (Wishes) to prevent Insolvency.
        // We query outside, then verify/update inside transaction.
        const wishesRef = collection(db, 'wishes');
        const activeQ = query(
             wishesRef, 
             where('requester_id', '==', user.uid),
             where('status', 'in', ['open', 'in_progress', 'review_pending'])
        );
        const activeSnap = await getDocs(activeQ);
        const wishRefs = activeSnap.docs.map(d => d.ref);

        const userRef = doc(db, "users", user.uid);
        let resultBalance = 0;

        try {
          await runTransaction(db, async (transaction) => {
            const userDoc = await transaction.get(userRef);
            if (!userDoc.exists()) throw "User missing";

            // 1. Cleanse Old Wishes (Absolute Forgiveness)
            for (const wRef of wishRefs) {
                const wDoc = await transaction.get(wRef);
                if (wDoc.exists() && ['open', 'in_progress', 'review_pending'].includes(wDoc.data().status)) {
                    transaction.update(wRef, {
                        status: 'expired',
                        cancel_reason: 'rebirth_cleansing',
                        cancelled_at: serverTimestamp(),
                        val_at_fulfillment: 0 // No payout, just oblivion
                    });
                }
            }
            
            let nextCycleDays = 10;
            const { REBIRTH_AMOUNT } = WORLD_CONSTANTS;
    
            // 2. Fetch NEXT Cycle Configuration
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
    
            const anchorDate = new Date(newAnchorTimeMillis);
            
            // === PRE-WRITE CHECK: Rebirth Log ===
            // ID Rule: 
            // - First Birth: "birth_<UID>" (Born once)
            // - Rebirth: "rebirth_<UID>_<AnchorTimestamp>" (Unique per cycle)
            const txId = isUnborn 
                ? `birth_${user.uid}` 
                : `rebirth_${user.uid}_${newAnchorTimeMillis}`;
                
            const txRef = doc(db!, 'transactions', txId);
            const txDoc = await transaction.get(txRef);
    
            if (txDoc.exists()) {
                console.log("Idempotency Check: Ritual already recorded. Skipping.");
                return; 
            }
    
            // Calculate the "Truth" Balance
            const exactElapsedMs = now - newAnchorTimeMillis;
            const exactElapsedHours = Math.floor(exactElapsedMs / 3600000);
            const decay = exactElapsedHours * WORLD_CONSTANTS.DECAY_RATE_HOURLY;
            resultBalance = Math.max(0, REBIRTH_AMOUNT - decay);
    
            // === EXECUTE WRITES ===
            transaction.update(userRef, {
              balance: REBIRTH_AMOUNT,
              last_updated: anchorDate, // Set "Last Updated" to Anchor Time
              cycle_started_at: anchorDate, // New Cycle Starts at Anchor Time
              scheduled_cycle_days: nextCycleDays,
            });
    
            // Incremental Counter for Souls Reborn (Daily Stats)
            const today = new Date().toISOString().split("T")[0];
            const dailyStatsRef = doc(db!, "daily_stats", today);
            transaction.set(
              dailyStatsRef,
              {
                reborn_count: increment(1),
                updated_at: serverTimestamp(),
              },
              { merge: true },
            );
    
            transaction.set(txRef, {
                type: isUnborn ? 'BIRTH' : 'REBIRTH',
                recipient_id: user.uid,
                amount: REBIRTH_AMOUNT,
                created_at: serverTimestamp(),
                description: isUnborn ? '世界に産声を上げました' : '光が満ちました (古い契約は浄化されました)',
                anchor_time: anchorDate 
            });
          });

      console.log("Metabolism: Ritual Complete. New Anchor:", new Date(newAnchorTimeMillis).toISOString());
      return { success: true, newBalance: resultBalance, newAnchorTime: newAnchorTimeMillis };
    } catch (e) {
      console.error("Metabolism Check Failed:", e);
      return { success: false };
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
    cycleStatus,
    performRebirthReset,
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
