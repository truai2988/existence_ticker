import { useEffect } from 'react';
import { Wish } from '../types';
import { calculateDecayedValue } from '../logic/worldPhysics';
import { db } from '../lib/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';

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
          
          // 更新成功後にリフレッシュ
          if (onExpired) {
            onExpired();
          }
        } catch (error) {
          console.error('[useExpiredWishHandler] Failed to expire wish:', error);
        }
      }
    };
    
    checkAndExpire();
  }, [wish, onExpired]);
};
