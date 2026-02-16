"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTrustRank = exports.calculateAvailableLm = exports.calculateHistoricalValue = exports.calculateDecayedValue = exports.fromMilli = exports.toMilli = exports.getMillis = exports.WORLD_CONSTANTS = void 0;
// =========================================================================================
// World Physics Constants (世界の理・定数)
// =========================================================================================
exports.WORLD_CONSTANTS = {
    REBIRTH_AMOUNT: 2400, // 器（Vessel）の最大容量
    MAX_VESSEL_CAPACITY_MILLI: 2400000, // 2,400 Lm = 絶対的な壁
    DECAY_RATE_MLLM_PER_HOUR: 10000, // 宇宙定数: 10 Lm/h (絶対不変)
    MAX_STREAK_FOR_REPAIR: 2, // 穢れ（Crack）を修復するために必要な連続誠実回数
    GLOBAL_METABOLISM_PATH: 'stats/global_metabolism',
};
const getMillis = (timestamp, fallback = Date.now()) => {
    if (!timestamp)
        return fallback;
    if (timestamp instanceof Date)
        return timestamp.getTime();
    if (typeof timestamp === 'number')
        return timestamp;
    if (typeof timestamp === 'string')
        return new Date(timestamp).getTime();
    // Firestore Timestamp Duck Typing
    if (typeof timestamp === 'object' && timestamp !== null) {
        if ('toMillis' in timestamp && typeof timestamp.toMillis === 'function') {
            return timestamp.toMillis();
        }
        if ('seconds' in timestamp && typeof timestamp.seconds === 'number') {
            return timestamp.seconds * 1000;
        }
    }
    return fallback;
};
exports.getMillis = getMillis;
// =========================================================================================
// Milli-Lm Helpers (1 Lm = 1000 milli-Lm)
// =========================================================================================
const toMilli = (lm) => (lm * 1000) | 0;
exports.toMilli = toMilli;
const fromMilli = (milli) => milli / 1000;
exports.fromMilli = fromMilli;
// =========================================================================================
// Decay Logic (減価計算) - Pure Integer Math
// =========================================================================================
/**
 * 時間経過による価値の減少を計算する (Universal Physical Law)
 * 減価率は 10 Lm/h (10,000 mLm/h) 固定であり、いかなる変数（サイクル期間等）の影響も受けない。
 *
 * @param initialMilli 初期値 (milli-Lm)
 * @param elapsedSec 経過時間 (秒)
 * @returns 減少後の値 (milli-Lm)
 */
const calculateDecayedValue = (value, elapsedSec) => {
    const s = elapsedSec < 0 ? 0 : elapsedSec;
    const num = 25;
    const den = 9;
    const decay = ((s * num) / den) | 0;
    const result = value - decay;
    return result < 0 ? 0 : result;
};
exports.calculateDecayedValue = calculateDecayedValue;
/**
 * 過去の特定の時点での価値を計算する (Historical Truth)
 * @param initialMilli 初期値 (milli-Lm)
 * @param startMs 開始時間 (ms)
 * @param endMs 終了時間 (ms)
 * @returns 算出値 (milli-Lm)
 */
const calculateHistoricalValue = (initialMilli, startMs, endMs) => {
    const elapsedSec = ((endMs - startMs) / 1000) | 0;
    return (0, exports.calculateDecayedValue)(initialMilli, elapsedSec);
};
exports.calculateHistoricalValue = calculateHistoricalValue;
// =========================================================================================
// Liquidity Logic (ゆとり計算) - Pure Integer Math
// =========================================================================================
/**
 * Available = Total - Committed (Expects Milli-Lm)
 */
const calculateAvailableLm = (currentBalanceMilli, committedMilli = 0) => {
    const res = currentBalanceMilli - committedMilli;
    return res < 0 ? 0 : res;
};
exports.calculateAvailableLm = calculateAvailableLm;
/**
 * ユーザーの信頼性ランクを判定する
 *
 * [Impurity Model / 穢れと禊]
 * - 契約破棄歴(has_cancellation_history)があり、かつ連続誠実回数(streak)が3未満の場合
 *   -> Rankは強制的に 'Beginner' となり、警告対象となる。
 */
const getTrustRank = (profile, snapshotScore = 0) => {
    var _a;
    if (!profile) {
        // Fallback or Unknown User
        if (snapshotScore >= 10)
            return { label: 'Veteran', icon: '🏆', color: 'text-amber-500', bg: 'bg-amber-100', isVerified: false };
        if (snapshotScore >= 3)
            return { label: 'Regular', icon: '★', color: 'text-blue-500', bg: 'bg-blue-100', isVerified: false };
        return { label: 'Beginner', icon: '🔰', color: 'text-green-500', bg: 'bg-green-100', isVerified: false };
    }
    const score = (_a = profile.completed_contracts) !== null && _a !== void 0 ? _a : snapshotScore;
    // --- Impurity Check (The Crack) ---
    const streak = profile.consecutive_completions || 0;
    const isImpure = profile.has_cancellation_history && streak < exports.WORLD_CONSTANTS.MAX_STREAK_FOR_REPAIR;
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
exports.getTrustRank = getTrustRank;
//# sourceMappingURL=worldPhysics.js.map