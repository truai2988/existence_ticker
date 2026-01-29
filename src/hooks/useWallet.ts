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
import { useWishesContext } from "../contexts/WishesContext";
import { calculateLifePoints } from "../utils/decay";
import { LUNAR_CONSTANTS } from "../constants";

export const useWallet = () => {
  const { user } = useAuth();
  const { profile, isLoading: profileLoading } = useProfile();
  const { wishes } = useWishesContext();

  // === 減価適用後のバランス（Physical Truth）===
  /**
   * 手持ちの光（Balance）:
   * Firestoreに保存されている初期値に、時間経過による減価を適用した現在の値。
   * これが物理的な真実であり、すべての計算の基準となる。
   */
  const balance = useMemo(() => {
    const rawBalance = profile?.balance ?? 0;
    const lastUpdated = profile?.last_updated;
    
    // 減価計算を適用
    return calculateLifePoints(rawBalance, lastUpdated);
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
    
    const myActiveWishes = wishes.filter(w => 
      w.requester_id === user.uid && 
      (w.status === 'open' || w.status === 'in_progress')
    );
    
    // 各依頼のcostを発行時から現在までの減価を考慮して合計
    return myActiveWishes.reduce((sum, w) => {
      const initialCost = w.cost || 0;
      const createdAt = w.created_at; // Firestore Timestamp or ISO string
      
      // calculateLifePointsで減価した現在価値を計算
      const currentValue = calculateLifePoints(initialCost, createdAt);
      
      return sum + currentValue;
    }, 0);
  }, [wishes, user]);

  /**
   * 分かち合える光（Available Lm）:
   * 手持ちから約束中の光を引いた、新たに誰かに託したり贈ったりできる余白。
   * 負にはならない（器の物理法則）。
   * 
   * 安全弁: 計算誤差があっても、availableLmが手持ちを超えることはない。
   */
  const calculatedAvailable = balance - committedLm;
  const availableLm = Math.max(0, Math.min(calculatedAvailable, balance));

  // === Lunar Cycle Logic (Metabolism) ===
  /**
   * Checks if the user's personal 10-day cycle has expired.
   * If so, resets their balance to 2400 (The Vessel Cap).
   */
  const checkLunarPhase = async (): Promise<{ reset: boolean }> => {
    if (!user || !db) return { reset: false };
    const userRef = doc(db, "users", user.uid);

    try {
      let hasReset = false;

      await runTransaction(db, async (transaction) => {
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists()) throw "User missing";

        const data = userDoc.data();
        // const lastPhaseIndex = data.last_phase_index || 0; // Legacy
        const cycleStartedAt =
          data.cycle_started_at?.toMillis() || data.created_at?.toMillis() || 0;

        const { CYCLE_DAYS } = LUNAR_CONSTANTS;
        const now = Date.now();

        // If more than configured days have passed since the cycle started (or if never set)
        
        // Fetch Admin Cycle Configuration (Time Control)
        let currentCycleDays = CYCLE_DAYS; 
        try {
            // Note: We are INSIDE a transaction. Ideally we use transaction.get()
            const settingsRef = doc(db!, "system_settings", "global");
            // const settingsDoc = await transaction.get(settingsRef); 
            // Transaction requires reads before writes. If we haven't read it yet, we can't write to userRef.
            // But userDoc read is line 88. 
            // So we MUST read settingsRef BEFORE writing to userRef.
            // However, inserting a read here might be tricky if we already read userDoc.
            // Firestore transactions require all reads before any writes. We haven't written yet.
            const settingsDoc = await transaction.get(settingsRef);
            
            if (settingsDoc.exists()) {
              const val = settingsDoc.data().cycleDays;
              if (typeof val === "number") currentCycleDays = val;
            }
        } catch (e) {
            console.warn("Using default cycle days due to fetch error", e);
        }

        const cycleDurationMillis = currentCycleDays * 24 * 60 * 60 * 1000;
        
        if (
          cycleStartedAt === 0 ||
          now - cycleStartedAt >= cycleDurationMillis
        ) {
          // === METABOLIC RESET (Rebirth) ===
          hasReset = true;
          const { REBIRTH_AMOUNT } = LUNAR_CONSTANTS;

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
            
            // calculateLifePointsで減価した現在価値を計算
            const currentValue = calculateLifePoints(initialCost, createdAt);
            committedLm += currentValue;
          });

          // リセット額を計算: 約束 + 100 Lm または 定数(2400) の大きい方
          // これにより、約束超過を防ぎつつ、常に最低限の余白(100)を確保
          const safeResetAmount = Math.max(REBIRTH_AMOUNT, Math.ceil(committedLm) + 100);

          console.log('[Lunar Cycle Reset]', {
            currentCycleDays,
            baseRebirthAmount: REBIRTH_AMOUNT,
            committedLm: Math.ceil(committedLm),
            finalResetAmount: safeResetAmount,
            保護された: safeResetAmount > REBIRTH_AMOUNT
          });

          transaction.update(userRef, {
            balance: safeResetAmount,
            last_updated: serverTimestamp(),
            cycle_started_at: serverTimestamp(), // New Cycle Starts Now
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
        const realTimeBalance = calculateLifePoints(
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

  const transferLumen = async (
    recipientId: string,
    amount: number,
  ): Promise<boolean> => {
    if (!user || !db) return false;
    if (amount <= 0) return false;

    const senderRef = doc(db, "users", user.uid);
    const recipientRef = doc(db, "users", recipientId);

    // Create specific reference for transaction record to ensure it is part of atomic write if needed
    // However, runTransaction usually handles reads then writes.
    // We will generate a new ID for the transaction record.
    const newTxRef = doc(collection(db, "transactions"));

    try {
      await runTransaction(db, async (txn) => {
        // 1. Get Sender
        const senderDoc = await txn.get(senderRef);
        if (!senderDoc.exists()) throw "Sender not found";

        const senderData = senderDoc.data();
        const senderBalance = calculateLifePoints(
          senderData.balance || 0,
          senderData.last_updated,
        );

        if (senderBalance < amount) {
          throw "Insufficient funds";
        }

        // 2. Get Recipient
        const recipientDoc = await txn.get(recipientRef);
        if (!recipientDoc.exists()) throw "Recipient not found";

        // 3. Get Global Capacity (for capping)
        let globalCapacity = LUNAR_CONSTANTS.FULL_MOON_BALANCE;
        try {
          const settingsRef = doc(db!, "system_settings", "stats");
          const settingsDoc = await txn.get(settingsRef);
          if (settingsDoc.exists()) {
            const val = settingsDoc.data().global_capacity;
            if (typeof val === "number") globalCapacity = val;
          }
        } catch (e) {
          console.warn("Using default capacity", e);
        }

        // 4. Calculate Recipient New Balance
        const recipientData = recipientDoc.data();
        const recipientCurrentReal = calculateLifePoints(
          recipientData.balance || 0,
          recipientData.last_updated,
        );

        // Cap at globalCapacity
        const newRecipientBalance = Math.min(
          recipientCurrentReal + amount,
          globalCapacity,
        );

        // 5. Writes
        // Deduct from Sender
        txn.update(senderRef, {
          balance: senderBalance - amount,
          last_updated: serverTimestamp(),
        });

        // Add to Recipient
        txn.update(recipientRef, {
          balance: newRecipientBalance,
          last_updated: serverTimestamp(),
        });

        // Record Transaction
        txn.set(newTxRef, {
          type: "GIFT",
          sender_id: user.uid,
          recipient_id: recipientId,
          amount: amount,
          overflow_loss: recipientCurrentReal + amount - newRecipientBalance, // How much was lost to void
          created_at: serverTimestamp(),
        });

        // Record Daily Stats
        const today = new Date().toISOString().split("T")[0];
        const dailyStatsRef = doc(db!, "daily_stats", today);

        const overflowAmount =
          recipientCurrentReal + amount - newRecipientBalance;

        txn.set(
          dailyStatsRef,
          {
            volume: increment(amount),
            gift_volume: increment(amount),
            overflow_volume: increment(overflowAmount > 0 ? overflowAmount : 0),
            updated_at: serverTimestamp(),
          },
          { merge: true },
        );
      });

      console.log(`Transferred ${amount} to ${recipientId}`);
      return true;
    } catch (e) {
      console.error("Transfer failed:", e);
      return false;
    }
  };

  // === 凍結方針（Freeze Policy）===
  // committedLm > balance の状態を検出し、警告を表示する（自動キャンセルは行わない）
  useEffect(() => {
    if (committedLm > balance && user && db) {
      console.error('❄️ [凍結警告] 約束超過が検出されました', {
        balance,
        committedLm,
        availableLm,
        超過分: committedLm - balance,
        ユーザー: user.uid,
        メッセージ: 'これ以上新しい約束はできません。Adminに問い合わせてください。'
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [committedLm, balance, user]);

  return {
    balance,
    committedLm,
    availableLm,
    pay,
    transferLumen,
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
          ? calculateLifePoints(initialCost, createdAt)
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
