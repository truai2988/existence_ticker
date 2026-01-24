import { SURVIVAL_CONSTANTS } from '../constants';

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
 * 生存時間 (Life Points) を計算する (Survival Phase)
 * 
 * アルゴリズム:
 * 1. 時間経過消費 (Constant Decay)
 *    回復は「配給(Ration)」イベントのみで行われるため、ここでは計算しない。
 *    ここでは単純に、最後の更新時点から現在までの消費分を引く。
 */
export const calculateLifePoints = (initialBalance: number, lastUpdated: unknown): number => {
  if (!lastUpdated) return initialBalance;

  const now = Date.now();
  const lastTime = getMillis(lastUpdated);
  const elapsedSeconds = (now - lastTime) / 1000;
  
  // Guard future or invalid time
  if (elapsedSeconds < 0) return initialBalance;

  const { DECAY_PER_SEC } = SURVIVAL_CONSTANTS;

  // 減価 (Time eats everything)
  const decayAmount = elapsedSeconds * DECAY_PER_SEC;
  const currentBalance = initialBalance - decayAmount;

  // 下限 (Death)
  return Math.max(0, currentBalance);
};

// Aliases
export const calculateDecayedValue = calculateLifePoints;
export const calculateVoidValue = calculateLifePoints; 
