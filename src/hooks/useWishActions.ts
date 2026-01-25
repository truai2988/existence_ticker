import { useState } from 'react';
import { CreateWishInput } from '../types';
import { useAuth } from './useAuthHook';
import { db } from '../lib/firebase';
import { collection, doc, runTransaction, serverTimestamp, Timestamp, increment, updateDoc } from 'firebase/firestore';

import { SURVIVAL_CONSTANTS } from '../constants';

// タイムスタンプと初期値から現在価値を計算
export const calculatePresentValue = (initialValue: number, createdAtMillis: number): number => {
  const ageSeconds = (Date.now() - createdAtMillis) / 1000;
  const decay = ageSeconds * SURVIVAL_CONSTANTS.DECAY_PER_SEC;
  return Math.max(0, Math.floor(initialValue - decay));
};


export const useWishActions = () => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculate costs matches logic in UI/Types
  const costMap = { light: 100, medium: 500, heavy: 1000 };

  const castWish = async (input: CreateWishInput): Promise<boolean> => {
    if (!db) {
       alert("データベースエラー: 接続されていません。");
       return false;
    }
    if (!user) {
       alert("エラー: ログインしていません。");
       return false;
    }
    
    setIsSubmitting(true);

    const userRef = doc(db, 'users', user.uid);
    const wishRef = doc(collection(db, 'wishes')); // Generates new ID
    const bounty = costMap[input.tier];

    try {
      await runTransaction(db, async (transaction) => {
        // 1. Get User Data
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists()) throw "User profile not found";
        
        const data = userDoc.data();
        const currentBalance = data.balance || 0;

        const lastUpdated = data.last_updated;
        const myTrustScore = data.completed_contracts || 0; // Current help count
        const myRequestHistory = data.completed_requests || 0; // Current paid/fulfilled count

        // 2. Strict Check (Phase 1: No Void/Negative)
        // Calculate dynamic balance first
        const calculateDecayedValue = (initial: number, ts: unknown) => {
             // Inline or import? Since we are inside a function, importing effectively is better, 
             // but I can't add import easily with replace_file_content if I only target this block.
             // I will duplicate logic or rely on a separate import step?
             // Actually, I can add the import at the top in a separate call or just trust I can't do it here easily.
             // Wait, I can use the existing `calculatePresentValue` helper available in the file? 
             // No, that uses DECAY_RATE_PER_SEC. 
             // Let's just inline the decay logic for safety inside the transaction wrapper as I did in useWallet.
             // Logic: Max(0, initial - elapsedSeconds)
             if (!ts) return initial;
             
             // Better: Firestore timestamp toMillis? 
             // Let's use the helper logic:
             let millis = Date.now();
             // eslint-disable-next-line @typescript-eslint/no-explicit-any
             const t = ts as any; // Temporary cast to access properties safely without complex type guards here
             if (t && typeof t.toMillis === 'function') millis = t.toMillis();
             else if (t && typeof t.seconds === 'number') millis = t.seconds * 1000;
             else if (t instanceof Date) millis = t.getTime();
             
             const elapsed = (Date.now() - millis) / 1000;
             const decay = elapsed * SURVIVAL_CONSTANTS.DECAY_PER_SEC;
             return Math.max(0, currentBalance - decay);
        };

        const decayedBalance = calculateDecayedValue(currentBalance, lastUpdated);

        if (decayedBalance < bounty) {
            throw new Error(`手持ちが不足しています (必要: ${bounty}, 現在: ${Math.floor(decayedBalance)})`); 
        }

        const newBalance = decayedBalance - bounty;
        
        // Update user: Balance changes AND last_updated resets (Decay Anchor reset)
        transaction.update(userRef, { 
            balance: newBalance,
            created_contracts: increment(1), // Track Requests (Created)
            last_updated: serverTimestamp() 
        });

        // 3. Create Wish
        transaction.set(wishRef, {
            requester_id: user.uid,
            requester_name: userDoc.data().name || 'Anonymous Soul',
            content: input.content,
            gratitude_preset: input.tier,
            status: 'open',
            cost: bounty, // Initial Value

            requester_trust_score: myTrustScore, // Stamp Trust (Helped Count)
            requester_completed_requests: myRequestHistory, // Stamp Reliability (Paid/Completed Requests)
            created_at: serverTimestamp() // Firestore Timestamp
        });
      });
      
      console.log('Wish Cast:', input, { bounty });
      return true;

    } catch (e) {
      console.error("Failed to cast wish:", e);
      const errorMessage = e instanceof Error ? e.message : String(e);
      alert(`${errorMessage}`);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const applyForWish = async (wishId: string): Promise<boolean> => {
    if (!db || !user) return false;
    setIsSubmitting(true);
    
    try {
        const wishRef = doc(db, 'wishes', wishId);
        const userRef = doc(db, 'users', user.uid);
        
        await runTransaction(db, async (transaction) => {
            const wishDoc = await transaction.get(wishRef);
            if (!wishDoc.exists()) throw "Wish not found";
            
            const userData = (await transaction.get(userRef)).data();
            const applicantInfo = {
                id: user.uid,
                name: userData?.name || 'Anonymous',
                trust_score: userData?.completed_contracts || 0
            };

            // Add to applicants array (Union)
            // Note: Firestore arrayUnion is simpler but transaction is safer for reading state first
             const currentApplicants = wishDoc.data().applicants || [];
             if (currentApplicants.some((a: { id: string }) => a.id === user.uid)) {
                 throw "Already applied";
             }

             transaction.update(wishRef, {
                 applicants: [...currentApplicants, applicantInfo]
             });
        });
        return true;
    } catch (e) {
        console.error(e);
        alert("応募に失敗しました");
        return false;
    } finally {
        setIsSubmitting(false);
    }
  };

  const approveWish = async (wishId: string, applicantId: string): Promise<boolean> => {
      if (!db || !user) return false;
      setIsSubmitting(true);
      try {
          const wishRef = doc(db, 'wishes', wishId);
          await updateDoc(wishRef, {
              status: 'in_progress',
              helper_id: applicantId,
              accepted_at: serverTimestamp()
          });
          return true;
      } catch (e) {
          console.error(e);
          return false;
      } finally {
          setIsSubmitting(false);
      }
  };

  const reportCompletion = async (wishId: string): Promise<boolean> => {
      if (!db || !user) return false;
      setIsSubmitting(true);
      try {
          const wishRef = doc(db, 'wishes', wishId);
          await updateDoc(wishRef, {
              status: 'review_pending'
          });
          return true;
      } catch (e) {
          console.error(e);
          return false;
      } finally {
          setIsSubmitting(false);
      }
  };

  const fulfillWish = async (wishId: string, fulfillerId: string): Promise<boolean> => {
    if (!db) return false;
    setIsSubmitting(true);

    // db is guaranteed defined here due to check above, but TS might need help if it narrows oddly?
    // Actually the error is at line ~110 inside runTransaction? No, the line was 110.
    // The previous error was on `const issuerRef = doc(db, ...)` inside try block.
    // Ensure db is captured or re-checked.
    const database = db; 
    
    const wishRef = doc(database, 'wishes', wishId);
    const fulfillerRef = doc(database, 'users', fulfillerId);

    try {
      // Import decay logic inside or helper
      // Note: We need the utility but using clean logic here
      const calculateValue = (initial: number, ts: Timestamp) => {
          const now = Date.now();
          const created = ts.toMillis();
          const elapsed = (now - created) / 1000;
          const decay = elapsed * SURVIVAL_CONSTANTS.DECAY_PER_SEC;
          return Math.max(0, initial - decay);
      };

      await runTransaction(db, async (transaction) => {
        const wishDoc = await transaction.get(wishRef);
        if (!wishDoc.exists()) throw "Wish does not exist";

        const wishData = wishDoc.data();
        if (wishData.status === 'fulfilled' || wishData.status === 'completed') {
            throw "Wish is already fulfilled";
        }

        // Issuer Ref
        const issuerRef = doc(database, 'users', wishData.requester_id);
        const issuerDoc = await transaction.get(issuerRef); // Need to check balance for salvation

        // === Anti-Gravity Logic ===

        // 1. Calculate Decayed Value (Universal Decay)
        const createdAt = wishData.created_at as Timestamp;
        const actualValue = calculateValue(wishData.cost || 0, createdAt);

        if (actualValue <= 0) {
           // Value is dust. Still fulfillable? Yes, but reward is 0.
           // User prompt doesn't forbid 0 value fulfillment, just says "Paid with decayed value"
        }

        // 2. Reward Fulfiller
        const fulfillerDoc = await transaction.get(fulfillerRef);
        if (fulfillerDoc.exists()) {
            // Fetch Dynamic Cap (Solar Control)
            let cap = 2400; 
            try {
                // Read from same transaction context
                const settingsRef = doc(database, 'system_settings', 'stats');
                const settingsDoc = await transaction.get(settingsRef);
                 if (settingsDoc.exists()) {
                      const val = settingsDoc.data().global_capacity;
                      if (typeof val === 'number') cap = val;
                 }
            } catch (e) {
                console.warn("Using default cap", e);
            }

            const fBalance = fulfillerDoc.data().balance || 0;
            const rawNewBalance = fBalance + actualValue;
            // The Vessel Cap: Dynamic
            const cappedBalance = Math.min(rawNewBalance, cap);

            transaction.update(fulfillerRef, { 
                balance: cappedBalance,
                completed_contracts: increment(1), // Track helps
                last_updated: serverTimestamp() 
            });

        }

        // 3. Salvation for Issuer (Physics C)
        // 願いが叶った瞬間、Issuerはマイナスから解放される（0になる）
        if (issuerDoc.exists()) {
            const iBalance = issuerDoc.data().balance || 0;
            if (iBalance < 0) {
                 transaction.update(issuerRef, { 
                     balance: 0,
                     completed_requests: increment(1), // Increment 'Properly Paid' count
                     last_updated: serverTimestamp() // Anchor Reset at Salvation
                 });
            } else {
                 transaction.update(issuerRef, {
                     completed_requests: increment(1) // Increment 'Properly Paid' count even if not negative
                 });
            }
        }

        // 4. Mark Wish Fulfilled
        transaction.update(wishRef, {
            status: 'fulfilled',
            helper_id: fulfillerId,
            val_at_fulfillment: actualValue,
            fulfilled_at: serverTimestamp()
        });

        // 5. Log Transaction for Metabolism Tracking
        const txRef = doc(collection(database, 'transactions'));
        let txType = 'SPARK';
        if (actualValue >= 900) txType = 'BONFIRE';
        else if (actualValue >= 400) txType = 'CANDLE';

        transaction.set(txRef, {
            amount: actualValue,
            timestamp: serverTimestamp(),
            type: txType,
            wish_id: wishId,
            from_id: wishData.requester_id,
            to_id: fulfillerId
        });

        // 6. Incremental Counter for Scalability (Daily Stats)
        // ID: YYYY-MM-DD
        const today = new Date().toISOString().split('T')[0];
        const dailyStatsRef = doc(database, 'daily_stats', today);
        
        // Use set with merge to create if not exists, and atomic increment
        transaction.set(dailyStatsRef, {
            volume: increment(actualValue),
            updated_at: serverTimestamp()
        }, { merge: true });
      });

      console.log('Wish Fulfilled & Salvation Granted');
      return true;
    } catch (e) {
        console.error("Fulfillment failed:", e);
        const errorMessage = e instanceof Error ? e.message : String(e);
        alert(`成就に失敗しました: ${errorMessage}`);
        return false;
    } finally {
        setIsSubmitting(false);
    }
  };
  
  // Wrapper for backward compatibility or if "accept" means "fulfill" in this new world
  const acceptWish = async (wishId: string) => {
      // In the new logic, "accepting" immediately fulfills it for simplicity, 
      // OR we can keep two steps. The user prompt implies "Fulfill" is the key action.
      // But usually "Accept" -> "Work" -> "Fulfill".
      // For now, let's map Accept button to Fulfill logic if that matches the prompt's intent.
      // "誰かが願いを叶えた（Fulfill）時、以下のトランザクションを一瞬で行います"
      // -> So let's assume the "Accept" button on the UI now triggers this instantaneous fulfillment for this demo.
      if (!user) return false;
      return fulfillWish(wishId, user.uid);
  };

  return {
    castWish,
    fulfillWish,
    applyForWish,
    approveWish,
    reportCompletion,
    acceptWish, // Expose for UI compatibility
    isSubmitting
  };
};