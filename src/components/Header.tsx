import React from 'react';
import { Sparkles, Wallet } from 'lucide-react';
import { motion } from 'framer-motion';
import { UNIT_LABEL } from '../constants';
import { WORLD_CONSTANTS } from '../logic/worldPhysics';
import { UserSubBar } from './UserSubBar';
import { useWallet } from '../hooks/useWallet';
import { useProfile } from '../hooks/useProfile';
import { AppViewMode } from '../types';

interface HeaderProps {
    viewMode?: AppViewMode;
}

export const Header: React.FC<HeaderProps> = ({ viewMode }) => {
    const { balance, availableLm, committedLm, status } = useWallet();
    const { profile } = useProfile();
    
    const displayValue = balance;
    const displayAvailable = availableLm;
    const displayCommitted = committedLm;

    const isFullyCommitted = displayAvailable <= 0;
    
    // Percentages
    const availablePercent = Math.min(100, (displayAvailable / WORLD_CONSTANTS.REBIRTH_AMOUNT) * 100);
    const committedPercent = Math.min(100, (displayCommitted / WORLD_CONSTANTS.REBIRTH_AMOUNT) * 100);

    const shouldShowUserName = viewMode !== 'profile' && viewMode !== 'profile_edit';

    // Seasonal Logic
    const cycleDays = profile?.scheduled_cycle_days || 10;
    // Handle Timestamp or other formats safely
    const cycleStartedAt = profile?.cycle_started_at?.toMillis 
        ? profile.cycle_started_at.toMillis() 
        : (profile?.created_at?.toMillis ? profile.created_at.toMillis() : Date.now());
    
    const nextReset = cycleStartedAt + (cycleDays * 24 * 60 * 60 * 1000);
    const daysLeft = Math.max(0, Math.ceil((nextReset - Date.now()) / (1000 * 60 * 60 * 24)));

    let seasonLabel = "通常 (秋)";
    let seasonColor = "text-yellow-600";
    if (cycleDays < 10) { seasonLabel = "春 (循環)"; seasonColor = "text-green-600"; }
    if (cycleDays > 10) { seasonLabel = "冬 (停滞)"; seasonColor = "text-slate-500"; }

    return (
        <>
            <header className="relative w-full pt-safe z-40">
                {/* Background with higher blur for premium feel */}
                <div className="absolute inset-0 bg-white/80 backdrop-blur-xl border-b border-white/20 shadow-sm" />

                <div className="relative w-full max-w-md mx-auto px-6 h-[90px] flex items-center justify-between">
                    
                    {/* Left: Available (Primary) */}
                    <div className="flex flex-col justify-center">
                        <div className="flex items-center gap-1.5 text-slate-500 mb-0.5">
                            <Sparkles size={12} className={isFullyCommitted ? "text-slate-300" : "text-amber-400 fill-amber-400"} />
                            <span className="text-xs font-bold tracking-widest uppercase opacity-80">
                                使える LM
                            </span>
                        </div>
                        <div className="flex items-baseline gap-1.5">
                            <motion.span 
                                key={Math.floor(displayAvailable)}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`text-4xl font-sans font-extrabold tracking-tighter tabular-nums ${
                                    isFullyCommitted ? 'text-slate-300' : 'text-slate-800'
                                }`}
                            >
                                {status === 'RITUAL_READY' ? '－' : Math.floor(displayAvailable).toLocaleString()}
                            </motion.span>
                            <span className={`text-xs font-bold ${isFullyCommitted ? 'text-slate-300' : 'text-slate-400'}`}>
                                {UNIT_LABEL}
                            </span>
                        </div>
                    </div>

                    {/* Season Indicator (Center-Right) */}
                    <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center opacity-60 pointer-events-none">
                        <span className={`text-xs font-mono font-bold uppercase tracking-widest ${seasonColor}`}>
                            {seasonLabel}
                        </span>
                        <span className="text-xs text-slate-400">
                            リセットまで {daysLeft} 日
                        </span>
                    </div>



                    {/* Right: Total & Gauge (Secondary) */}
                    <div className="flex flex-col items-end gap-1.5 min-w-[120px]">
                        
                        {/* Total Label */}
                        <div className="flex items-center gap-1.5 text-slate-400">
                            <Wallet size={10} strokeWidth={2.5} />
                            <div className="text-xs font-bold tracking-wider tabular-nums">
                                手持ち: <span className="text-slate-600 font-bold">{status === 'RITUAL_READY' ? '－' : Math.floor(displayValue).toLocaleString()}</span>
                            </div>
                        </div>

                        {/* Modern Rounded Gauge */}
                        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden relative shadow-inner">
                            {/* Base track */}
                            <div className="absolute inset-0 bg-slate-100" />
                            
                            {/* Layer 1: Committed (Total Used + Available) - Visualized as lighter/background color */}
                            <motion.div 
                                className="absolute inset-0 h-full bg-gradient-to-r from-amber-200 to-amber-300 rounded-full"
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min(100, availablePercent + committedPercent)}%` }}
                                transition={{ duration: 1, ease: "easeOut" }}
                            />

                            {/* Layer 2: Available (Foreground) - Visualized as deeper/active color */}
                            <motion.div 
                                className="absolute inset-0 h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full shadow-[0_0_8px_rgba(251,191,36,0.4)]"
                                initial={{ width: 0 }}
                                animate={{ width: `${availablePercent}%` }}
                                transition={{ duration: 1, ease: "easeOut", delay: 0.1 }}
                            />
                            
                            {/* Active Shine Effect */}
                            <div className="absolute inset-0 h-full w-full bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
                        </div>

                        {/* Status / Link */}
                        <div className="h-4 flex items-center justify-end">
                            <span className="text-xs text-slate-300 font-mono">
                                {Math.round(availablePercent)}%
                            </span>
                        </div>
                    </div>
                </div>
            </header>

            {/* User Name Sub Bar */}
            {shouldShowUserName && <UserSubBar />}
        </>
    );
};
