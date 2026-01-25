import { useAuth } from "./useAuthHook";
import { db } from "../lib/firebase";
import {
  doc,
  runTransaction,
  serverTimestamp,
  increment,
  collection,
} from "firebase/firestore";
import { useProfile } from "./useProfile";
import { calculateLifePoints } from "../utils/decay";
import { LUNAR_CONSTANTS } from "../constants";

export const useWallet = () => {
  const { user } = useAuth();
  const { profile, isLoading: profileLoading } = useProfile();

  const balance = profile?.balance ?? 0;

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

        const { CYCLE_DAYS, FULL_MOON_BALANCE } = LUNAR_CONSTANTS;
        const cycleDurationMillis = CYCLE_DAYS * 24 * 60 * 60 * 1000;
        const now = Date.now();

        // If more than 10 days have passed since the cycle started (or if never set)
        if (
          cycleStartedAt === 0 ||
          now - cycleStartedAt >= cycleDurationMillis
        ) {
          // === METABOLIC RESET (Rebirth) ===
          hasReset = true;

          // Fetch Dynamic Capacity (Solar Control)
          let resetScale = FULL_MOON_BALANCE;
          try {
            // Note: We are INSIDE a transaction. Ideally we use transaction.get()
            // But system_settings is global. Reading it outside or separately is fine?
            // Transaction requires all reads before writes.
            // Let's do `transaction.get(settingsRef)`.
            const settingsRef = doc(db!, "system_settings", "stats");
            const settingsDoc = await transaction.get(settingsRef);
            if (settingsDoc.exists()) {
              const val = settingsDoc.data().global_capacity;
              if (typeof val === "number") resetScale = val;
            }
          } catch (e) {
            console.warn("Using default capacity due to fetch error", e);
          }

          transaction.update(userRef, {
            balance: resetScale,
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
        console.log("Metabolism: New Cycle Started (2400 Lm Refilled)");
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
        transaction.set(dailyStatsRef, {
            volume: increment(amount),
            wish_volume: increment(amount),
            updated_at: serverTimestamp()
        }, { merge: true });
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
        txn.set(dailyStatsRef, {
            volume: increment(amount),
            gift_volume: increment(amount),
            updated_at: serverTimestamp()
        }, { merge: true });
      });

      console.log(`Transferred ${amount} to ${recipientId}`);
      return true;
    } catch (e) {
      console.error("Transfer failed:", e);
      return false;
    }
  };

  return {
    balance,
    pay,
    transferLumen,
    checkLunarPhase,
    isLoading: profileLoading,
  };
};
