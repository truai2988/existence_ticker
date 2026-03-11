import { DashboardStats } from "./useStats";
import { UserProfile } from "../types";
import { MESSAGES } from "../constants/messages";

export type WorldPhase = 'STARVATION' | 'SATURATION' | 'STAGNATION' | 'HEALTHY';
export type Severity = 'critical' | 'warning' | 'info';

export interface DiagnosticsResult {
    currentPhase: WorldPhase;
    severity: Severity;
    shortDescription: string;
    longDescription?: string;
    bg: string;
    text: string;
    isMicro?: boolean;
}

export const useDiagnostics = (stats: DashboardStats | null): DiagnosticsResult => {
    if (!stats) return {
        currentPhase: 'HEALTHY',
        severity: 'info',
        shortDescription: MESSAGES.DIAGNOSTICS.STATUS_LOADING,
        bg: 'bg-slate-800',
        text: 'text-slate-400',
        isMicro: false
    };

    const { metabolism, distribution } = stats;
    const { rate, overflowLoss, decay24h, avgBalance, totalSupply } = metabolism;
    
    // Metabolic Metrics
    const entropyLoss = decay24h + (overflowLoss || 0);
    // Convert loss to percentage relative to Total Supply for comparison with Circulation(rate)
    const decayRate = totalSupply > 0 ? (entropyLoss / totalSupply) * 100 : 0;
    
    const circulationRate = rate; // Already %
    const average = avgBalance || 0;
    
    // Asset Ratio
    const totalPop = distribution.full + distribution.quarter + distribution.new;
    const needyRatio = totalPop > 0 ? distribution.new / totalPop : 0;
    const richRatio = totalPop > 0 ? distribution.full / totalPop : 0;
    
    const isMicro = totalPop < 5;
    const prefix = isMicro ? MESSAGES.DIAGNOSTICS.MICRO_PREFIX : '';

    // --- LOGIC TREE ---

    // 1. STARVATION (渇きの連鎖)
    if (circulationRate < decayRate && (average < 1200 || needyRatio > 0.5)) {
        return {
            currentPhase: 'STARVATION',
            severity: 'critical',
            shortDescription: `${prefix}${MESSAGES.DIAGNOSTICS.PHASE_STARVATION_SHORT}`,
            longDescription: MESSAGES.DIAGNOSTICS.PHASE_STARVATION_LONG,
            bg: 'bg-cyan-900/30 border-cyan-500',
            text: 'text-cyan-200',
            isMicro
        };
    }

    // 2. SATURATION (贅沢な微睡み)
    if (circulationRate < decayRate && (average >= 1200 || richRatio > 0.3)) {
        return {
            currentPhase: 'SATURATION',
            severity: 'warning',
            shortDescription: `${prefix}${MESSAGES.DIAGNOSTICS.PHASE_SATURATION_SHORT}`,
            longDescription: MESSAGES.DIAGNOSTICS.PHASE_SATURATION_LONG,
            bg: 'bg-yellow-900/30 border-yellow-500',
            text: 'text-yellow-200',
            isMicro
        };
    }

    // 3. STAGNATION (静止した世界)
    if (circulationRate < 5) {
         return {
            currentPhase: 'STAGNATION',
            severity: 'critical',
            shortDescription: `${prefix}${MESSAGES.DIAGNOSTICS.PHASE_STAGNATION_SHORT}`,
            longDescription: MESSAGES.DIAGNOSTICS.PHASE_STAGNATION_LONG,
            bg: 'bg-red-900/30 border-red-500',
            text: 'text-red-200',
            isMicro
        };
    }

    // 4. HEALTHY
    return {
        currentPhase: 'HEALTHY',
        severity: 'info',
        shortDescription: `${prefix}${MESSAGES.DIAGNOSTICS.PHASE_HEALTHY_SHORT}`,
        bg: 'bg-green-900/30 border-green-500',
        text: 'text-green-200',
        isMicro
    };
};

// === Anomaly Detection for Admin ===
export interface UserAnomaly {
    userId: string;
    description: string;
    severity: 'critical' | 'warning';
    detectedAt: number;
}

export const checkUserAnomaly = (user: UserProfile): UserAnomaly | null => {
    if (!user) return null;

    // 1. Check for Negative Balance (Physical Impossibility)
    if (user.balance < 0) {
        return {
            userId: user.id || 'unknown',
            description: `${MESSAGES.DIAGNOSTICS.ANOMALY_NEGATIVE_BALANCE} (${user.balance})`,
            severity: 'critical',
            detectedAt: Date.now()
        };
    }

    // 2. Check for Negative Warmth or XP (Data Corruption)
    if ((user.warmth || 0) < 0 || (user.xp || 0) < 0) {
        return {
            userId: user.id || 'unknown',
            description: MESSAGES.DIAGNOSTICS.ANOMALY_DATA_CORRUPTION,
            severity: 'warning',
            detectedAt: Date.now()
        };
    }

    return null;
};
