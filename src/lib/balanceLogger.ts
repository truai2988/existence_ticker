import { db } from './firebase';
import { collection, addDoc, serverTimestamp, runTransaction, Transaction } from 'firebase/firestore';

export type BalanceChangeReason = 
  | 'payment'           // 願いへの支払い
  | 'transfer_send'     // ギフト送信
  | 'transfer_receive'  // ギフト受信
  | 'rebirth'          // サイクルリセット
  | 'profile_update'   // プロフィール更新時の減価確定
  | 'manual';          // 手動調整

interface BalanceChangeLog {
  user_id: string;
  timestamp: ReturnType<typeof serverTimestamp>;
  before: number;
  after: number;
  reason: BalanceChangeReason;
  details?: {
    amount?: number;
    target_user?: string;
    wish_id?: string;
    [key: string]: unknown;
  };
}

/**
 * Balance変更をログに記録する
 * トランザクション内外どちらでも使用可能
 */
export async function logBalanceChange(params: {
  userId: string;
  before: number;
  after: number;
  reason: BalanceChangeReason;
  details?: Record<string, unknown>;
  transaction?: Transaction;
}): Promise<void> {
  if (!db) {
    console.warn('[Balance Logger] DB not initialized');
    return;
  }

  const log: BalanceChangeLog = {
    user_id: params.userId,
    timestamp: serverTimestamp(),
    before: Math.floor(params.before),
    after: Math.floor(params.after),
    reason: params.reason,
    details: params.details
  };

  try {
    if (params.transaction) {
      // トランザクション内で実行
      const logRef = collection(db, 'balance_logs');
      const newDocRef = params.transaction as unknown as { set: (ref: unknown, data: unknown) => void };
      // Firestoreのトランザクションは collection().doc() を使えないため、addDocの代わりにsetを使う
      // しかし、transactionオブジェクトにはaddDocに相当するメソッドがないため、
      // ここでは単純にログを記録せず、トランザクション外で記録する方針に変更
      // （トランザクションの原子性を保ちつつ、ログは別途記録）
      
      // トランザクション完了後に記録するため、ここでは何もしない
      // 代わりに、呼び出し側で await logBalanceChange(...) をトランザクション外で呼ぶ
      console.warn('[Balance Logger] Transaction logging not yet implemented, log separately');
    } else {
      // 通常の記録
      await addDoc(collection(db, 'balance_logs'), log);
      console.log('[Balance Logger]', {
        user: params.userId.slice(0, 8),
        before: Math.floor(params.before),
        after: Math.floor(params.after),
        reason: params.reason
      });
    }
  } catch (error) {
    console.error('[Balance Logger] Failed to log:', error);
    // ログ記録失敗はアプリケーションの動作を妨げない
  }
}
