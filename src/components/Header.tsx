import React from 'react';
import { Sparkles, Wallet } from 'lucide-react';
import { motion } from 'framer-motion';
import { UNIT_LABEL } from '../constants';
import { WORLD_CONSTANTS } from '../logic/worldPhysics';
import { useWallet } from '../hooks/useWallet';
import { useProfile } from '../hooks/useProfile';

import { HeaderNavigation } from './HeaderNavigation';
import { AppViewMode } from '../types';
import { MapPin } from 'lucide-react';
import { PresenceModal } from './PresenceModal';
import { AnimatePresence } from 'framer-motion';

interface HeaderProps {
    viewMode?: AppViewMode;
    onTabChange: (tab: "home" | "history" | "profile") => void;
}

export const Header: React.FC<HeaderProps> = ({ viewMode, onTabChange }) => {
    const { balance, availableLm, committedLm, status } = useWallet();
    const { profile } = useProfile();
    const [showPresenceModal, setShowPresenceModal] = React.useState(false);
    
    const isFullyCommitted = availableLm <= 0;
    
    // Percentages (Based on Rebirth Max Capacity)
    const availablePercent = Math.min(100, (availableLm / WORLD_CONSTANTS.REBIRTH_AMOUNT) * 100);
    const committedPercent = Math.min(100, (committedLm / WORLD_CONSTANTS.REBIRTH_AMOUNT) * 100);

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

                <div className="relative w-full max-w-md mx-auto px-4 h-[110px] flex items-center justify-between gap-1 overflow-hidden">
                    {/* Brand Label (Subtle) */}
                    <div className="absolute top-2 left-4 z-50 pointer-events-none">
                        <span className="text-[9px] font-sans text-slate-300 tracking-[0.2em] font-medium uppercase">
                            Existence Ticker
                        </span>
                    </div>
                    
                    {/* Left Block: Resources & Location */}
                    <div className="flex items-center gap-2 min-w-0 flex-1 justify-start">
                        {/* 1. Available LM (Shareable) */}
                        <div className="flex flex-col items-center shrink-0">
                            <div className="flex items-center gap-1.5 text-slate-500 mb-0.5">
                                <Sparkles size={11} className={isFullyCommitted ? "text-slate-300" : "text-amber-400 fill-amber-400"} />
                                <span className="text-xs font-bold tracking-widest uppercase opacity-70 whitespace-nowrap">
                                    分かち合える
                                </span>
                            </div>
                            <div className="flex items-center gap-1">
                                <motion.span 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`text-3xl font-sans font-extrabold tracking-tighter tabular-nums ${
                                        isFullyCommitted ? 'text-slate-300' : 'text-slate-800'
                                    }`}
                                >
                                    {status === 'RITUAL_READY' ? '－' : Math.floor(availableLm).toLocaleString()}
                                </motion.span>
                                <span className={`text-xs font-bold ${isFullyCommitted ? 'text-slate-300' : 'text-slate-400'}`}>
                                    {UNIT_LABEL}
                                </span>
                            </div>
                        </div>

                        {/* 2. Location Button (📍 City) */}
                        <button 
                            onClick={() => setShowPresenceModal(true)}
                            className="h-11 px-2 flex items-center gap-1.5 text-slate-400 hover:text-slate-600 transition-all rounded-xl hover:bg-blue-50/30 active:scale-95 group relative min-w-0 flex-1"
                            title="エリア状況を確認"
                        >
                            <span className="absolute inset-0 rounded-xl bg-blue-400/0 group-hover:bg-blue-400/5 blur-sm transition-all" />
                            <MapPin size={14} className="text-slate-300 group-hover:text-blue-400 transition-colors shrink-0" />
                            <span className="text-xs font-bold tracking-tight text-slate-400 group-hover:text-slate-600 transition-colors pt-0.5 whitespace-normal min-w-0 max-w-[70px] leading-tight text-left">
                                {profile?.location?.prefecture}{profile?.location?.city || "エリア"}
                            </span>
                        </button>
                    </div>

                    {/* Right Block: Status & Navigation */}
                    <div className="flex items-center justify-end gap-3 min-w-0 flex-1 shrink-0">
                        {/* 1. Wallet Status (Gauge) */}
                        <div className="flex flex-col items-center gap-1 shrink-0">
                            {/* Handheld Amount */}
                            <div className="flex items-center gap-1 text-slate-400">
                                <Wallet size={10} strokeWidth={2.5} />
                                <div className="text-xs font-bold tracking-wider tabular-nums leading-none">
                                    <span className="text-slate-600 font-bold">{status === 'RITUAL_READY' ? '－' : Math.floor(balance).toLocaleString()}</span>
                                </div>
                            </div>

                            {/* Progress Gauge */}
                            <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden relative shadow-inner">
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
                                <span className="text-xs text-slate-300 font-bold tracking-widest leading-none whitespace-nowrap">
                                    リセットまで {daysLeft}日
                                </span>
                            </div>
                        </div>

                        {/* 2. Navigation */}
                        <div className="shrink-0">
                            <HeaderNavigation currentTab={viewMode || "home"} onTabChange={onTabChange} />
                        </div>
                    </div>
                </div>
            </header>

            <AnimatePresence>
                {showPresenceModal && <PresenceModal onClose={() => setShowPresenceModal(false)} />}
            </AnimatePresence>
        </>
    );
};
