import { db } from './firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

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
 */
export async function logBalanceChange(params: {
  userId: string;
  before: number;
  after: number;
  reason: BalanceChangeReason;
  details?: Record<string, unknown>;
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
    await addDoc(collection(db, 'balance_logs'), log);
    console.log('[Balance Logger]', {
      user: params.userId.slice(0, 8),
      before: Math.floor(params.before),
      after: Math.floor(params.after),
      reason: params.reason
    });
  } catch (error) {
    console.error('[Balance Logger] Failed to log:', error);
    // ログ記録失敗はアプリケーションの動作を妨げない
  }
}
