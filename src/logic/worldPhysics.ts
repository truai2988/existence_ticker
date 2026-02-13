import { UserProfile } from '../types';

// =========================================================================================
// World Physics Constants (世界の理・定数)
// =========================================================================================

export const WORLD_CONSTANTS = {
  REBIRTH_AMOUNT: 2400, // 器（Vessel）の最大容量
  MAX_VESSEL_CAPACITY_MILLI: 2400000, // 2,400 Lm = 絶対的な壁
  DECAY_RATE_HOURLY: 10, // 減価レート (Lumens per Hour)
  MAX_STREAK_FOR_REPAIR: 2, // 穢れ（Crack）を修復するために必要な連続誠実回数
  GLOBAL_METABOLISM_PATH: 'stats/global_metabolism',
};

// =========================================================================================
// Time Helper (Internal)
// =========================================================================================

interface FirestoreTimestamp {
    toMillis: () => number;
    seconds: number;
}

export const getMillis = (timestamp: unknown, fallback: number = Date.now()): number => {
    if (!timestamp) return fallback;
    if (timestamp instanceof Date) return timestamp.getTime();
    if (typeof timestamp === 'number') return timestamp;
    if (typeof timestamp === 'string') return new Date(timestamp).getTime();
    
    // Firestore Timestamp Duck Typing
    if (typeof timestamp === 'object' && timestamp !== null) {
        if ('toMillis' in timestamp && typeof (timestamp as FirestoreTimestamp).toMillis === 'function') {
            return (timestamp as FirestoreTimestamp).toMillis();
        }
        if ('seconds' in timestamp && typeof (timestamp as FirestoreTimestamp).seconds === 'number') {
            return (timestamp as FirestoreTimestamp).seconds * 1000;
        }
    }
    return fallback;
};

// =========================================================================================
// Milli-Lm Helpers (1 Lm = 1000 milli-Lm)
// =========================================================================================

export const toMilli = (lm: number): number => (lm * 1000) | 0;
export const fromMilli = (milli: number): number => milli / 1000;

// Decay Rate: 10 Lm/h = 10,000 milli-Lm / 3600 sec = 25 / 9 milli-Lm per sec
const DECAY_NUM = 25;
const DECAY_DEN = 9;

// =========================================================================================
// Decay Logic (減価計算) - Pure Integer Math
// =========================================================================================

/**
 * 時間経過による価値の減少を計算する (Pure Mathematical Truth)
 * @param initialMilli 初期値 (milli-Lm)
 * @param elapsedSec 経過時間 (秒)
 * @returns 減少後の値 (milli-Lm)
 */
export const calculateDecayedValue = (initialMilli: number, elapsedSec: number): number => {
  // Positive elapsed only
  const s = elapsedSec < 0 ? 0 : elapsedSec;
  const decay = ((s * DECAY_NUM) / DECAY_DEN) | 0;
  const result = initialMilli - decay;
  return result < 0 ? 0 : result;
};

/**
 * 過去の特定の時点での価値を計算する (Historical Truth)
 * @param initialMilli 初期値 (milli-Lm)
 * @param startMs 開始時間 (ms)
 * @param endMs 終了時間 (ms)
 * @returns 算出値 (milli-Lm)
 */
export const calculateHistoricalValue = (initialMilli: number, startMs: number, endMs: number): number => {
    const elapsedSec = ((endMs - startMs) / 1000) | 0;
    return calculateDecayedValue(initialMilli, elapsedSec);
};

// =========================================================================================
// Liquidity Logic (ゆとり計算) - Pure Integer Math
// =========================================================================================

/**
 * Available = Total - Committed (Expects Milli-Lm)
 */
export const calculateAvailableLm = (currentBalanceMilli: number, committedMilli: number = 0): number => {
    const res = currentBalanceMilli - committedMilli;
    return res < 0 ? 0 : res;
};

// =========================================================================================
// Rank Logic (信頼性評価)
// =========================================================================================

export interface TrustRank {
    label: string;
    icon: string;
    color: string;
    bg: string;
    isVerified: boolean;
}

/**
 * ユーザーの信頼性ランクを判定する
 * 
 * [Impurity Model / 穢れと禊]
 * - 契約破棄歴(has_cancellation_history)があり、かつ連続誠実回数(streak)が3未満の場合
 *   -> Rankは強制的に 'Beginner' となり、警告対象となる。
 */
export const getTrustRank = (profile: UserProfile | null, snapshotScore: number = 0): TrustRank => {
    if (!profile) {
        // Fallback or Unknown User
        if (snapshotScore >= 10) return { label: 'Veteran', icon: '🏆', color: 'text-amber-500', bg: 'bg-amber-100', isVerified: false };
        if (snapshotScore >= 3) return { label: 'Regular', icon: '★', color: 'text-blue-500', bg: 'bg-blue-100', isVerified: false };
        return { label: 'Beginner', icon: '🔰', color: 'text-green-500', bg: 'bg-green-100', isVerified: false };
    }

    const score = profile.completed_contracts ?? snapshotScore;

    // --- Impurity Check (The Crack) ---
    const streak = profile.consecutive_completions || 0;
    const isImpure = profile.has_cancellation_history && streak < WORLD_CONSTANTS.MAX_STREAK_FOR_REPAIR;

    if (isImpure) {
        // 穢れ状態: ランク剥奪
        return { label: 'Beginner', icon: '🔰', color: 'text-slate-500', bg: 'bg-slate-100', isVerified: false };
    }
    
    // --- Verification Criteria ---
    const hasAvatar = !!profile.avatarUrl;
    const hasBioComplete = !!(profile.bio && profile.bio.length >= 30);
    const hasLinks = profile.links && (profile.links.x || profile.links.instagram || profile.links.website);
    const isVerified = hasAvatar && hasBioComplete && !!hasLinks;
    const hasBio = !!profile.bio;

    // Veteran: Score 10+ & Verified & Bio & Avatar
    if (score >= 10 && isVerified && hasBio && hasAvatar) {
        return { label: 'Veteran', icon: '🏆', color: 'text-amber-500', bg: 'bg-amber-100', isVerified };
    }
    
    // Regular: Score 3+ & (Bio OR Avatar)
    if (score >= 3 && (hasBio || hasAvatar)) {
        return { label: 'Regular', icon: '★', color: 'text-blue-500', bg: 'bg-blue-100', isVerified };
    }
    
    // Beginner (Default)
    return { label: 'Beginner', icon: '🔰', color: 'text-green-500', bg: 'bg-green-100', isVerified };
};
