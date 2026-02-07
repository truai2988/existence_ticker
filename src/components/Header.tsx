import React from 'react';
import { Sparkles, Wallet, MapPin, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { UNIT_LABEL } from '../constants';
import { WORLD_CONSTANTS } from '../logic/worldPhysics';
import { useWallet } from '../hooks/useWallet';
import { useProfile } from '../hooks/useProfile';
import { useState, useEffect } from 'react';
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
    const { balance, availableLm, committedLm, status } = useWallet();
    const { profile } = useProfile();
    const [showPresenceModal, setShowPresenceModal] = useState(false);
    const [statsCount, setStatsCount] = useState<number | null>(null);
    
    const isFullyCommitted = availableLm <= 0;
    
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
                                    
                                    {/* 中央段：Lm金額（最大・漆黒） */}
                                    <motion.div 
                                        initial={{ opacity: 0, y: 5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={`text-4xl font-sans font-extrabold tracking-tight tabular-nums leading-none mb-1 ${
                                            isFullyCommitted ? 'text-slate-300' : 'text-slate-900'
                                        }`}
                                    >
                                        {status === 'RITUAL_READY' ? '－' : Math.floor(availableLm).toLocaleString()}
                                        <span className={`text-sm font-bold ml-1 ${isFullyCommitted ? 'text-slate-300' : 'text-slate-400'}`}>
                                            {UNIT_LABEL}
                                        </span>
                                    </motion.div>
                                    
                                    {/* 最下段：✨ 分かち合える */}
                                    <div className="flex items-center gap-1">
                                        <Sparkles size={11} className={isFullyCommitted ? "text-slate-300" : "text-amber-400 fill-amber-400"} />
                                        <span className="text-sm font-bold tracking-wider uppercase text-slate-400 leading-none">
                                            分かち合える
                                        </span>
                                    </div>
                                </div>

                                {/* 右の柱：管理と操作 */}
                                <div className="flex items-start gap-3">
                                    {/* 左側：残高・日数 + プログレスバー（縦並び） */}
                                    <div className="flex flex-col items-end gap-1.5">
                                        {/* 残高 ｜ 日数 */}
                                        <div className="flex items-center gap-2 text-xs text-slate-400 font-bold">
                                            <div className="flex items-center gap-1">
                                                <Wallet size={10} strokeWidth={2.5} />
                                                <span className="tabular-nums">
                                                    {status === 'RITUAL_READY' ? '－' : Math.floor(balance).toLocaleString()}
                                                </span>
                                                <span>{UNIT_LABEL}</span>
                                            </div>
                                            <span className="text-slate-300">|</span>
                                            <span>あと{daysLeft}日</span>
                                        </div>
                                        
                                        {/* プログレスバー */}
                                        <div className="w-32 h-3 bg-slate-100 rounded-full overflow-hidden relative">
                                            <motion.div 
                                                className="absolute inset-0 h-full bg-amber-200/40"
                                                initial={{ width: 0 }}
                                                animate={{ width: `${Math.min(100, availablePercent + committedPercent)}%` }}
                                            />
                                            <motion.div 
                                                className="absolute inset-0 h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full"
                                                initial={{ width: 0 }}
                                                animate={{ width: `${availablePercent}%` }}
                                            />
                                        </div>
                                    </div>
                                    
                                    {/* 右側：ナビゲーション */}
                                    <HeaderNavigation currentTab={viewMode || "home"} onTabChange={onTabChange} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* エリア情報（ページの一部として・背景色同じ） */}
                    <div className="w-full bg-slate-50">
                        <div className="w-full max-w-2xl mx-auto px-4 py-2">
                            <button
                                onClick={() => setShowPresenceModal(true)}
                                className="flex items-center gap-1.5 text-left hover:opacity-70 transition-opacity"
                            >
                                <MapPin size={11} className="text-slate-400" />
                                <span className="text-xs text-slate-400 font-medium truncate">
                                    {getLocationText()}
                                </span>
                                <span className="text-xs text-slate-300">|</span>
                                <Users size={11} className="text-slate-400" />
                                <span className="text-xs text-slate-400 font-medium">
                                    {getUserCountText()}
                                </span>
                            </button>
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
