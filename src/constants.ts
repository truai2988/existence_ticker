
// Poetic Cost Constants (The weight of existence shared)
export const WISH_COST = {
  SPARK: 100,    // Twinkle (瞬き)
  CANDLE: 500,   // Ray (月光)
  BONFIRE: 1000, // Halo (月暈)
};

// 1 Lm = 1 Lumen (Light)
export const UNIT_LABEL = "Lm";

// --- Lunar Cycle Model Constants ---
export const LUNAR_CONSTANTS = {
  FULL_MOON_BALANCE: 2400, // Max Capacity (The Vessel)
  REBIRTH_AMOUNT: 2400,    // Fixed Rebirth Amount (The Grant)
  CYCLE_DAYS: 10,          // Default Reset Period (The Cycle)
  
  // Rate: 10 Lm per 1 Hour
  // 10 / 3600 = 0.002777...
  DECAY_PER_SEC: 10 / 3600
};


// Alias for compatibility if needed (transition)
export const SURVIVAL_CONSTANTS = {
    CAPACITY: LUNAR_CONSTANTS.FULL_MOON_BALANCE,
    DAILY_RATION: 240, // Legacy support if logic references it
    DECAY_PER_SEC: LUNAR_CONSTANTS.DECAY_PER_SEC
};

// --- Security / Roles ---
// Replace with your actual User ID from the Profile screen (or console)
export const ADMIN_UIDS = [
    // "E87QByEYgTPciOzHbIVHjZOjmzB3",
    "truai_admin_id"
];
