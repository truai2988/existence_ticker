// Helper to safely extract milliseconds
const getMillis = (timestamp: unknown): number => {
    if (!timestamp) return Date.now();

    if (
        typeof timestamp === 'object' && 
        timestamp !== null && 
        'toMillis' in timestamp && 
        typeof (timestamp as { toMillis: unknown }).toMillis === 'function'
    ) {
        return (timestamp as { toMillis: () => number }).toMillis();
    }

    if (
        typeof timestamp === 'object' &&
        timestamp !== null &&
        'seconds' in timestamp &&
        typeof (timestamp as { seconds: unknown }).seconds === 'number'
    ) {
        return (timestamp as { seconds: number }).seconds * 1000;
    }

    if (timestamp instanceof Date) {
        return timestamp.getTime();
    }

    if (typeof timestamp === 'string' || typeof timestamp === 'number') {
        return new Date(timestamp).getTime();
    }

    return Date.now();
};

/**
 * 生存時間 (Life Points) を計算する - 1時間単位の減価
 * 
 * 物理法則:
 * - 10 Lm / 1時間 の減価
 * - 経過時間は Math.floor(経過ミリ秒 / 3600000) で算出（時間単位で切り捨て）
 * - すべて整数として扱う
 * 
 * 計算式: 現在の値 = Math.max(0, 発行時の額 - (経過時間(hour) × 10))
 */
export const calculateLifePoints = (initialBalance: number, lastUpdated: unknown): number => {
  if (!lastUpdated) return initialBalance;

  const now = Date.now();
  const lastTime = getMillis(lastUpdated);
  const elapsedMs = now - lastTime;
  
  // Guard future or invalid time
  if (elapsedMs < 0) return initialBalance;

  // 経過時間を時間単位で計算（切り捨て）
  const elapsedHours = Math.floor(elapsedMs / 3600000); // 1時間 = 3600000ms
  
  // 減価計算（整数のみ）
  const DECAY_PER_HOUR = 10; // 10 Lm/時間
  const decayAmount = elapsedHours * DECAY_PER_HOUR;
  const currentBalance = initialBalance - decayAmount;

  // 下限 (Death)
  return Math.max(0, currentBalance);
};

// Aliases
export const calculateDecayedValue = calculateLifePoints;
export const calculateVoidValue = calculateLifePoints; 
