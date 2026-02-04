import { useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './useAuthHook';
import { calculateDecayedValue, calculateHistoricalValue } from '../logic/worldPhysics';

interface AuditLog {
  timestamp: Date;
  type: string;
  amount: number;
  balanceBefore: number; // Theoretical
  balanceAfter: number;  // Theoretical
  decayedAmount: number; // How much was lost to decay since last tx
  description: string;
}

export function useBalanceAudit() {
  const { user } = useAuth();
  const [isAuditing, setIsAuditing] = useState(false);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [result, setResult] = useState<{
    calculatedBalance: number;
    actualBalance: number;
    discrepancy: number;
  } | null>(null);

  const auditBalance = async () => {
    if (!user || !db) {
        alert("エラー: ユーザー情報またはDB接続が見つかりません。");
        console.error("User or DB missing", { user, db });
        return;
    }
    
    // Debug Alert
    // alert("監査を開始します..."); 
    
    setIsAuditing(true);
    setLogs([]);
    setResult(null);

    try {
      // 1. Fetch current profile for Actual Balance
      const userRef = collection(db, 'users');
      const userQuery = query(userRef, where('__name__', '==', user.uid));
      const userDocs = await getDocs(userQuery);
      if (userDocs.empty) throw new Error("User not found");
      
      const userData = userDocs.docs[0].data();
      // Calculate current actual balance (decayed to NOW)
      const currentActualBalance = calculateDecayedValue(
        userData.balance || 0, 
        userData.last_updated
      );

      // 2. Fetch ALL transactions (Looking for 'recipient_id' as used in Birth/Rebirth)
      const txRef = collection(db, 'transactions');
      const q = query(
        txRef, 
        where('recipient_id', '==', user.uid)
      );
      
      // Note: Some transactions might involve user as 'recipient' or 'sender' but field might differ.
      // Usually we check if we query by 'involved_users' array or separate queries.
      // For now assume 'user_id' is the owner of the wallet change.
      // If transactions are double-entry (sender/recipient), we might need complex query.
      // Let's assume standard implementation: 'transactions' collection contains logs for the user.
      // Actually, standard implementation often duplicates tx for both parties or uses user_id field.
      // Let's try simple query first.
      
      const snapshot = await getDocs(q);
      console.log(`Transactions found: ${snapshot.size}`);
      // alert(`トランザクション数: ${snapshot.size}件を取得しました。計算を開始します。`);
      
      // 3. Replay History
      // Initial State
      let theoreticalBalance = 0;
      let lastTime = 0;
      
      // Attempt to find "Birth" time or first accumulated balance?
      // Usually starts at 0 or 2400 if initialized.
      // If there is no "birth" transaction, we might miss the initial 2400.
      // Let's see if there's a 'SYSTEM_GIFT' or 'INITIAL' tx.
      
      const auditLogs: AuditLog[] = [];
      const now = Date.now();

      // If user has 'cycle_started_at', maybe that's the start anchor?
      // But transactions should cover everything.
      
      const processDocs = (snapshot.docs.map(d => ({...d.data(), id: d.id, created_at: d.data().created_at})) as { id: string; created_at: unknown; amount?: number; type: string; description?: string }[])
        .sort((a, b) => {
            const getMillis = (t: unknown): number => {
                if (typeof t === 'object' && t !== null && 'toMillis' in t) {
                    return (t as { toMillis: () => number }).toMillis();
                }
                if (typeof t === 'string') return Date.parse(t);
                if (typeof t === 'number') return t;
                return 0;
            };
            return getMillis(a.created_at) - getMillis(b.created_at);
        });
      
      // Check if we need to account for initial 2400 that might not be in transactions
      // If the first TX is "spending" without "income", then we started with something.
      // But properly, "Birth" should be a transaction.
      
      // Special logic: If first ever tx is NOT an income/birth, likely we miss the start.
      // But let's just replay and see.
      
      for (const tx of processDocs) {
        let txTime = 0;
        const c = tx.created_at as { toMillis?: () => number } | string | number | null;
        
        if (typeof c === 'object' && c && 'toMillis' in c && typeof c.toMillis === 'function') {
           txTime = c.toMillis();
        } else if (typeof c === 'string') {
           txTime = Date.parse(c);
        } else if (typeof c === 'number') {
            txTime = c;
        }

        if (isNaN(txTime) || txTime === 0) continue;

        if (lastTime === 0) {
            // First transaction ever.
            // If it's a huge positive, it's likely the birth.
            // If it's small or negative, we might have started at 0 or 2400.
            // For audit, let's assume strictly cumulative from 0 unless logic suggests otherwise.
            lastTime = txTime;
        }

        // Apply decay from lastTime to txTime

        // NOTE: calculateDecayedValue(balance, lastUpdated, targetTime)
        // We verify if calculateDecayedValue supports targetTime (3rd arg).
        // Looking at UseWallet -> imports calculateDecayedValue. 
        // We need to check worldPhysics.ts to be sure.
        // Assuming it does or we simulate it.
        // If it doesn't support 3rd arg (targetTime), we mock Date.now? No that's hard.
        // Let's assume we can calculate it manually if needed: 
        // Bal * (0.5 ^ (elapsed / halfLife))
        
        // Wait, standard calculateDecayedValue usually defaults to Date.now().
        // We probably need a customized version for audit that accepts 'now'.
        
        // Apply decay from lastTime to txTime (Fixed Linear Logic)
        const balanceAfterDecay = calculateHistoricalValue(theoreticalBalance, lastTime, txTime);
        
        const amount = tx.amount || 0;
        const balanceAfterTx = balanceAfterDecay + amount;
        
        auditLogs.push({
            timestamp: new Date(txTime),
            type: tx.type,
            amount: amount,
            balanceBefore: balanceAfterDecay,
            balanceAfter: balanceAfterTx,
            decayedAmount: theoreticalBalance - balanceAfterDecay,
            description: tx.description || tx.type
        });
        
        theoreticalBalance = balanceAfterTx;
        lastTime = txTime;
      }
      
      // Finally decay to NOW (Fixed Linear Logic)
      const finalCalculated = calculateHistoricalValue(theoreticalBalance, lastTime, now);
      
      setResult({
        calculatedBalance: finalCalculated,
        actualBalance: currentActualBalance,
        discrepancy: currentActualBalance - finalCalculated
      });
      // alert(`計算完了: 理論値 ${finalCalculated.toFixed(2)} vs 実測値 ${currentActualBalance.toFixed(2)}`);
      setLogs(auditLogs);

    } catch (err) {
      console.error(err);
    } finally {
      setIsAuditing(false);
    }
  };

  return { auditBalance, isAuditing, logs, result };
}
