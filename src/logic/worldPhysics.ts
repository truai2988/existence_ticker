import { UserProfile } from '../types';

// =========================================================================================
// World Physics Constants (世界の理・定数)
// =========================================================================================

export const WORLD_CONSTANTS = {
  REBIRTH_AMOUNT: 2400, // 器（Vessel）の最大容量
  DECAY_RATE_HOURLY: 10, // 減価レート (Lumens per Hour)
  MAX_STREAK_FOR_REPAIR: 3, // 穢れ（Crack）を修復するために必要な連続誠実回数
};

// =========================================================================================
// Time Helper (Internal)
// =========================================================================================

// Firestore Timestamp duck typing interface
interface FirestoreTimestamp {
    toMillis: () => number;
    seconds: number;
}

const getMillis = (timestamp: unknown): number => {
    if (!timestamp) return Date.now();
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
    return Date.now();
};

// =========================================================================================
// Decay Logic (減価計算)
// =========================================================================================

/**
 * 時間経過による価値の減少を計算する (Physical Truth)
 * 
 * [Integer Policy]:
 * UI側での丸め処理を禁止するため、必ず整数（Integer）を返す。
 * 浮動小数点数（小数の端数）は存在しないものとして、切り捨てる。
 * 
 * [Null Safety]:
 * Firestoreの書き込み遅延等で timestamp が null/undefined の場合は、
 * 減価なしとして初期値（initialValue）をそのまま返す。
 */
export const calculateDecayedValue = (initialValue: number, lastUpdated: unknown): number => {
  // 1. Safety Checks
  if (lastUpdated === null || lastUpdated === undefined) {
      return Math.floor(initialValue);
  }

  // 2. Time Calculation
  const now = Date.now();
  const lastTime = getMillis(lastUpdated);
  
  // 未来の日時が渡された場合（クロックズレ等）は減価なし
  if (now < lastTime) {
      return Math.floor(initialValue);
  }

  const elapsedMs = now - lastTime;
  
  // 3. Integer Decay (1h = 10 Lm)
  // 時間も「整数時間」として切り捨てて扱う
  const elapsedHours = Math.floor(elapsedMs / 3600000); // 1h = 3600000ms
  const decayAmount = elapsedHours * WORLD_CONSTANTS.DECAY_RATE_HOURLY;
  
  // 4. Result (No Negative, Always Integer)
  const result = initialValue - decayAmount;
  return Math.max(0, Math.floor(result));
};

// =========================================================================================
// Liquidity Logic (ゆとり計算)
// =========================================================================================

/**
 * 現在利用可能な（他者に贈れる）余裕資産を可視化する
 * "Available" = DecayedBalance - Committed(Reserved) Amount
 */
export const calculateAvailableLm = (currentBalance: number, committedLm: number = 0): number => {
    // Note: currentBalance should already be decayed before passing here usually,
    // but safety check or raw naming is up to consumer. 
    // Usually this function expects "current visible balance".
    return Math.max(0, currentBalance - committedLm);
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
