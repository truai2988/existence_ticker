import React from 'react';
import { Sparkles, Wallet } from 'lucide-react';
import { motion } from 'framer-motion';
import { UNIT_LABEL } from '../constants';
import { WORLD_CONSTANTS } from '../logic/worldPhysics';
import { UserSubBar } from './UserSubBar';
import { useWallet } from '../hooks/useWallet';
import { useProfile } from '../hooks/useProfile';

import { HeaderNavigation } from './HeaderNavigation';
import { AppViewMode } from '../types';

interface HeaderProps {
    viewMode?: AppViewMode;
    onTabChange: (tab: "home" | "history" | "profile") => void;
}

export const Header: React.FC<HeaderProps> = ({ viewMode, onTabChange }) => {
    const { balance, availableLm, committedLm, status } = useWallet();
    const { profile } = useProfile();
    
    const isFullyCommitted = availableLm <= 0;
    
    // Percentages (Based on Rebirth Max Capacity)
    const availablePercent = Math.min(100, (availableLm / WORLD_CONSTANTS.REBIRTH_AMOUNT) * 100);
    const committedPercent = Math.min(100, (committedLm / WORLD_CONSTANTS.REBIRTH_AMOUNT) * 100);

    const shouldShowUserName = viewMode !== 'profile' && viewMode !== 'profile_edit';

    // Seasonal Logic (Simplified)
    const cycleDays = profile?.scheduled_cycle_days || 10;
    const cycleStartedAt = profile?.cycle_started_at?.toMillis 
        ? profile.cycle_started_at.toMillis() 
        : (profile?.created_at?.toMillis ? profile.created_at.toMillis() : Date.now());
    
    const nextReset = cycleStartedAt + (cycleDays * 24 * 60 * 60 * 1000);
    const daysLeft = Math.max(0, Math.ceil((nextReset - Date.now()) / (1000 * 60 * 60 * 24)));




    return (
        <>
            <header className="relative w-full pt-safe z-40">
                {/* Background with higher blur for premium feel */}
                <div className="absolute inset-0 bg-white/80 backdrop-blur-xl border-b border-white/20 shadow-sm" />

                <div className="relative w-full max-w-md mx-auto px-6 h-[110px] flex items-center justify-between">
                    {/* Left padding/spacer to balance the right nav and help center the middle */}
                    <div className="w-10 md:hidden" /> 

                    {/* Center Block: All LM Stats grouped together */}
                    <div className="flex-1 flex items-center justify-center gap-6">
                        {/* 1. Available LM (Large) */}
                        <div className="flex flex-col items-center">
                            <div className="flex items-center gap-1.5 text-slate-500 mb-0.5">
                                <Sparkles size={11} className={isFullyCommitted ? "text-slate-300" : "text-amber-400 fill-amber-400"} />
                                <span className="text-[10px] font-bold tracking-widest uppercase opacity-70">
                                    使える LM
                                </span>
                            </div>
                            <div className="flex items-baseline gap-1">
                                <motion.span 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`text-3xl font-sans font-extrabold tracking-tighter tabular-nums ${
                                        isFullyCommitted ? 'text-slate-300' : 'text-slate-800'
                                    }`}
                                >
                                    {status === 'RITUAL_READY' ? '－' : Math.floor(availableLm).toLocaleString()}
                                </motion.span>
                                <span className={`text-[10px] font-bold ${isFullyCommitted ? 'text-slate-300' : 'text-slate-400'}`}>
                                    {UNIT_LABEL}
                                </span>
                            </div>
                        </div>

                        {/* Thin vertical divider for visual grouping */}
                        <div className="w-px h-8 bg-slate-100/50" />

                        {/* 2. Wallet Stats (Compact right-side of group) */}
                        <div className="flex flex-col gap-1.5">
                            {/* Handheld Amount */}
                            <div className="flex items-center gap-1.5 text-slate-400">
                                <Wallet size={10} strokeWidth={2.5} />
                                <div className="text-[10px] font-bold tracking-wider tabular-nums leading-none">
                                    手持ち: <span className="text-slate-600 font-bold">{status === 'RITUAL_READY' ? '－' : Math.floor(balance).toLocaleString()}</span>
                                </div>
                            </div>

                            {/* Progress Gauge */}
                            <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden relative shadow-inner">
                                <div className="absolute inset-0 bg-slate-100" />
                                <motion.div 
                                    className="absolute inset-0 h-full bg-gradient-to-r from-amber-200 to-amber-300 rounded-full"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${Math.min(100, availablePercent + committedPercent)}%` }}
                                    transition={{ duration: 1, ease: "easeOut" }}
                                />
                                <motion.div 
                                    className="absolute inset-0 h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${availablePercent}%` }}
                                    transition={{ duration: 1, ease: "easeOut", delay: 0.1 }}
                                />
                            </div>

                            {/* Reset Countdown */}
                            <div className="flex items-center">
                                <span className="text-[10px] text-slate-300 font-mono tracking-widest leading-none">
                                    リセットまで{daysLeft}日
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Right Block: Navigation icons moved to the edge */}
                    <div className="shrink-0">
                        <HeaderNavigation currentTab={viewMode || "home"} onTabChange={onTabChange} />
                    </div>
                </div>
            </header>

            {/* User Name Sub Bar */}
            {shouldShowUserName && <UserSubBar />}
        </>
    );
};
