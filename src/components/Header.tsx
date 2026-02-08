import { MapPin, Users } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
// import { UNIT_LABEL } from '../constants';
// import { WORLD_CONSTANTS } from '../logic/worldPhysics';
import { useWallet } from '../hooks/useWallet';
import { useProfile } from '../hooks/useProfile';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { formatLocationCount } from '../utils/formatLocation';

import { HeaderNavigation } from './HeaderNavigation';
import { AppViewMode } from '../types';
import { PresenceModal } from './PresenceModal';
import { AnimatePresence } from 'framer-motion';

interface HeaderProps {
    viewMode?: AppViewMode;
    onTabChange: (tab: "home" | "history" | "profile") => void;
}

export const Header: React.FC<HeaderProps> = ({ viewMode, onTabChange }) => {
    const { availableLm, committedLm } = useWallet();
    const { profile } = useProfile();
    const [showPresenceModal, setShowPresenceModal] = useState(false);
    const [statsCount, setStatsCount] = useState<number | null>(null);
    
    // Fetch nearby user count
    useEffect(() => {
        if (!profile?.location?.prefecture || !profile?.location?.city || !db) return;
        
        const fetchStats = async () => {
            try {
                const docId = `${profile.location!.prefecture}_${profile.location!.city}`;
                const docRef = doc(db!, 'location_stats', docId);
                const snap = await getDoc(docRef);
                if (snap.exists()) {
                    setStatsCount(snap.data().count || 0);
                } else {
                    setStatsCount(0);
                }
            } catch (e) {
                console.error("Location stats fetch failed", e);
            }
        };
        fetchStats();
    }, [profile?.location]);
    
    const getLocationText = () => {
        if (!profile?.location) return "エリア未設定";
        return `${profile.location.prefecture}${profile.location.city}`;
    };
    
    const getUserCountText = () => {
        if (statsCount === null) return "確認中...";
        return formatLocationCount(statsCount);
    };

    // Seasonal Logic (Simplified)
    const cycleDays = profile?.scheduled_cycle_days || 10;
    const cycleStartedAt = profile?.cycle_started_at?.toMillis 
        ? profile.cycle_started_at.toMillis() 
        : (profile?.created_at?.toMillis ? profile.created_at.toMillis() : Date.now());
    
    const nextReset = cycleStartedAt + (cycleDays * 24 * 60 * 60 * 1000);
    const daysLeft = Math.max(0, Math.ceil((nextReset - Date.now()) / (1000 * 60 * 60 * 24)));

    // Percentages for Water Clock (Max 2400)
    // committed: 既に捧げた分 (底に沈殿)
    // available: 自由に使える分 (上に乗る)
    const maxCapacity = 2400; // WORLD_CONSTANTS.REBIRTH_AMOUNT;
    const committedHeight = Math.min(100, (committedLm / maxCapacity) * 100);
    const availableHeight = Math.min(100, (availableLm / maxCapacity) * 100);


    return (
        <>
            <header className="relative w-full pt-safe z-40">
                <div className="relative w-full">
                    {/* Two Pillars Structure - with white background spanning full width */}
                    <div className="relative w-full bg-white/95">
                        <div className="w-full max-w-2xl mx-auto px-4 pt-2 pb-3">
                            <div className="flex items-center justify-between">
                                {/* 左の柱：あなたの「今」 */}
                                <div className="flex flex-col items-start">
                                    {/* 最上段：EXISTENCE TICKER */}
                                    <div className="text-xs font-bold tracking-[0.25em] uppercase text-slate-400 leading-none mb-2">
                                        Existence Ticker
                                    </div>
                                    
                                    {/* Location Info (Moved here for better balance) */}
                                    <button
                                        onClick={() => setShowPresenceModal(true)}
                                        className="flex items-center gap-1.5 text-left hover:opacity-70 transition-opacity group"
                                    >
                                        <MapPin size={11} className="text-slate-400 group-hover:text-slate-600 transition-colors" />
                                        <span className="text-xs text-slate-400 font-medium truncate group-hover:text-slate-600 transition-colors">
                                            {getLocationText()}
                                        </span>
                                        <span className="text-xs text-slate-300">|</span>
                                        <Users size={11} className="text-slate-400 group-hover:text-slate-600 transition-colors" />
                                        <span className="text-xs text-slate-400 font-medium group-hover:text-slate-600 transition-colors">
                                            {getUserCountText()}
                                        </span>
                                    </button>
                                </div>

                                {/* 右の柱：管理と操作 */}
                                <div className="flex items-center gap-4">
                                    {/* Water Clock Indicator (Lm Capacity) */}
                                    <div className="flex flex-col items-end gap-1">
                                        <div className="relative w-8 h-10 bg-slate-50 rounded-b-xl rounded-t-sm overflow-hidden border border-slate-200 shadow-inner">
                                            
                                            {/* 1. Committed Lm (Bottom Layer - Frozen/Sediment) */}
                                            <motion.div 
                                                className="absolute bottom-0 left-0 right-0 bg-slate-200/80 saturate-0"
                                                initial={{ height: 0 }}
                                                animate={{ height: `${committedHeight}%` }}
                                                transition={{ duration: 1.0, ease: "easeOut" }}
                                            />

                                            {/* 2. Available Lm (Top Layer - Liquid Light) */}
                                            <motion.div 
                                                className="absolute bottom-0 left-0 right-0 bg-amber-300/60 backdrop-blur-sm"
                                                initial={{ height: 0, bottom: 0 }}
                                                animate={{ 
                                                    height: `${availableHeight}%`, 
                                                    bottom: `${committedHeight}%` 
                                                }}
                                                transition={{ duration: 1.0, ease: "easeOut", delay: 0.2 }}
                                            >
                                                 <div className="absolute inset-0 bg-white/30 animate-pulse" />
                                            </motion.div>
                                            
                                            {/* Glass Reflection */}
                                            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-transparent opacity-50 pointer-events-none" />
                                        </div>
                                        <span className="text-[10px] font-bold text-slate-400 tracking-wider">
                                            あと {daysLeft}日
                                        </span>
                                    </div>
                                    
                                    {/* 右側：ナビゲーション */}
                                    <HeaderNavigation currentTab={viewMode || "home"} onTabChange={onTabChange} />
                                </div>
                            </div>
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
