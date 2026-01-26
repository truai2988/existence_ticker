import { DashboardStats } from "./useStats";

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
        shortDescription: 'Loading Diagnostics...',
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
    const prefix = isMicro ? '【Micro】' : '';

    // --- LOGIC TREE ---

    // 1. STARVATION (渇きの連鎖)
    if (circulationRate < decayRate && (average < 1200 || needyRatio > 0.5)) {
        return {
            currentPhase: 'STARVATION',
            severity: 'critical',
            shortDescription: `${prefix}渇きの連鎖 (Chain of Thirst)`,
            longDescription: '循環が消滅を下回り、かつ社会全体が枯渇しています。',
            bg: 'bg-cyan-900/30 border-cyan-500',
            text: 'text-cyan-200',
            isMicro
        };
    }

    // 2. SATURATION (静寂なる停滞)
    if (circulationRate < decayRate && (average >= 1200 || richRatio > 0.3)) {
        return {
            currentPhase: 'SATURATION',
            severity: 'warning',
            shortDescription: `${prefix}静寂なる停滞 (Silent Stagnation)`,
            longDescription: '循環が消滅を下回っていますが、資産は十分にあります。繋がりの欠如。',
            bg: 'bg-yellow-900/30 border-yellow-500',
            text: 'text-yellow-200',
            isMicro
        };
    }

    // 3. STAGNATION (循環不全)
    if (circulationRate < 5) {
         return {
            currentPhase: 'STAGNATION',
            severity: 'critical',
            shortDescription: `${prefix}完全循環不全 (Total Failure)`,
            longDescription: '経済活動が停止しています。',
            bg: 'bg-red-900/30 border-red-500',
            text: 'text-red-200',
            isMicro
        };
    }

    // 4. HEALTHY
    return {
        currentPhase: 'HEALTHY',
        severity: 'info',
        shortDescription: `${prefix}システムは安定稼働中です`,
        bg: 'bg-green-900/30 border-green-500',
        text: 'text-green-200',
        isMicro
    };
};
