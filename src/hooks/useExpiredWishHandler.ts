import { useEffect } from 'react';
import { Wish } from '../types';
import { calculateDecayedValue } from '../logic/worldPhysics';
import { db } from '../lib/firebase';
import { doc, updateDoc, serverTimestamp, collection, addDoc } from 'firebase/firestore';

/**
 * 進行中・募集中・確認待ちの願いが0 Lmになったら自動的にexpiredに変更する
 */
export const useExpiredWishHandler = (wish: Wish | null, onExpired?: () => void) => {
  useEffect(() => {
    const checkAndExpire = async () => {
      if (!wish || !db) return;
      
      const displayValue = calculateDecayedValue(wish.cost || 0, wish.created_at);
      const shouldExpire = displayValue <= 0 && 
        (wish.status === 'open' || wish.status === 'in_progress' || wish.status === 'review_pending');
      
      if (shouldExpire && wish.status !== 'expired') {
        try {
          const wishRef = doc(db, 'wishes', wish.id);
          await updateDoc(wishRef, {
            status: 'expired',
            expired_at: serverTimestamp()
          });
          
          // 履歴にトランザクションログを作成
          try {
            await addDoc(collection(db, 'transactions'), {
              type: 'WISH_EXPIRED',
              wish_id: wish.id,
              wish_title: wish.content,
              sender_id: wish.requester_id,
              sender_name: wish.requester_name || '依頼主',
              recipient_id: wish.helper_id || null,
              recipient_name: wish.helper_id ? '手伝い手' : null,
              amount: 0,
              created_at: serverTimestamp(),
              description: 'お礼がなくなるまでに完了しませんでした'
            });
          } catch (logError) {
            console.error('[useExpiredWishHandler] Failed to create transaction log:', logError);
          }
          
          // 更新成功 - リフレッシュはしない（期限切れの願いを表示し続ける）
          // if (onExpired) {
          //   onExpired();
          // }
        } catch (error) {
          console.error('[useExpiredWishHandler] Failed to expire wish:', error);
        }
      }
    };
    
    checkAndExpire();
  }, [wish, onExpired]);
};
