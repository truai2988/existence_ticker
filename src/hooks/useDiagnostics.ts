import { DashboardStats } from "./useStats";
import { UserProfile } from "../types";

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
        shortDescription: '診断を読み込み中...',
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
            shortDescription: `${prefix}渇きの連鎖`,
            longDescription: '循環が消滅の重力に抗えず、社会全体が枯渇しています。生存の危機。',
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
            shortDescription: `${prefix}贅沢な微睡み`,
            longDescription: '資産は十分にありますが、魂のつながり（循環）が失われています。静かなる死。',
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
            shortDescription: `${prefix}静止した世界`,
            longDescription: '経済活動が完全に停止しています。信頼の動脈硬化状態。',
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
            description: `残高がマイナスです (${user.balance})。器の破損（システム異常）を検知しました。`,
            severity: 'critical',
            detectedAt: Date.now()
        };
    }

    // 2. Check for Negative Warmth or XP (Data Corruption)
    if ((user.warmth || 0) < 0 || (user.xp || 0) < 0) {
        return {
            userId: user.id || 'unknown',
            description: `熱量または経験値が破損しています。負の値が検出されました。`,
            severity: 'warning',
            detectedAt: Date.now()
        };
    }

    return null;
};
