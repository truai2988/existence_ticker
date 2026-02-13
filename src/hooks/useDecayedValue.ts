import { useState, useEffect } from 'react';
import { calculateDecayedValue, getMillis, toMilli, fromMilli } from '../logic/worldPhysics';

/**
 * 共通の減価計算フック
 * 
 * すべてのコンポーネントで同じ減価ロジックを使用するための統一フック。
 * これにより、WishCardやその他のコンポーネントで減価計算が一致し、
 * 「989と314のような異常な差」が発生しにくくなります。
 * 
 * @param initialValue 初期値（発行時の金額）
 * @param createdAt 作成時刻（Firestore Timestamp or ISO string）
 * @returns リアルタイムで減価した現在値
 */
export const useDecayedValue = (initialValue: number, createdAt: unknown) => {
  const [displayValue, setDisplayValue] = useState(() => {
    const startMs = getMillis(createdAt);
    const elapsedSec = ((Date.now() - startMs) / 1000) | 0;
    return fromMilli(calculateDecayedValue(toMilli(initialValue), elapsedSec));
  });
  
  useEffect(() => {
    const update = () => {
      const startMs = getMillis(createdAt);
      const elapsedSec = ((Date.now() - startMs) / 1000) | 0;
      const val = fromMilli(calculateDecayedValue(toMilli(initialValue), elapsedSec));
      setDisplayValue(val);
    };
    
    update(); // 初回実行
    const timer = setInterval(update, 100); // 100msごとに更新
    
    return () => clearInterval(timer);
  }, [initialValue, createdAt]);
  
  return displayValue;
};
