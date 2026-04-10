/** すべての願いに共通する固定コスト（1回の心と心の交わり＝1000 Lm）
 * 資本主義的な値付けを廃し、事の大小に関わらず価値を平等にする。 */
export const FIXED_WISH_COST = 1000;

// 1 Lm = 1 Lumen (生命の源気)
export const UNIT_LABEL = "Lm";

// --- Lunar Cycle Model Constants ---
export const LUNAR_CONSTANTS = {
  FULL_MOON_BALANCE: 2400, // Max Capacity (自らの命によって湧出される器)
  REBIRTH_AMOUNT: 2400, // Fixed Rebirth Amount (生命の源気の湧出)
  CYCLE_DAYS: 10, // Default Reset Period (The Cycle)

  // Rate: 7.5 Lm per 45 Minutes
  // 7.5 / 2700 = 0.002777...
  DECAY_PER_SEC: 7.5 / 2700,
};

// Alias for compatibility if needed (transition)
export const SURVIVAL_CONSTANTS = {
  CAPACITY: LUNAR_CONSTANTS.FULL_MOON_BALANCE,
  DAILY_RATION: 240, // Legacy support if logic references it
  DECAY_PER_SEC: LUNAR_CONSTANTS.DECAY_PER_SEC,
};

// --- Security / Roles ---
// All administrative access is now managed dynamically via the Admin Dashboard.
// To bootstrap the first admin, please contact the developer or use the database console.
