import React, { useState } from 'react';
import { ClipboardList, Timer, PlayCircle, Menu } from "lucide-react";
import { motion } from "framer-motion";
import { useWishes } from '../hooks/useWishes';
import { calculateDecayedValue, getMillis, toMilli, fromMilli } from '../logic/worldPhysics';
import { WishCardList } from './WishCardList';
import { AppViewMode } from '../types';
import { SideDrawer } from './SideDrawer';
import { useLanguage } from '../contexts/LanguageContext';

interface FlowViewProps {
    currentUserId: string;
    onOpenProfile?: () => void;
    onTabChange?: (mode: AppViewMode) => void;
    onOpenOnboarding?: () => void;
}

type TabType = 'explore' | 'pending' | 'active';

export const FlowView: React.FC<FlowViewProps> = ({ currentUserId, onOpenProfile, onTabChange, onOpenOnboarding }) => {
    const { 
        wishes, // active feed
        involvedActiveWishes, 
    } = useWishes();
    const { t: MESSAGES } = useLanguage();
    
    const [activeTab, setActiveTab] = useState<TabType>('explore');
    const [hasInitialized, setHasInitialized] = useState(false);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    // 1. Explore (Active Global Feed)
    const exploreWishes = wishes.filter(w => {
        if (w.requester_id === currentUserId) return false;
        if (w.applicants && w.applicants.some(a => a.id === currentUserId)) return false;
        const startMs = getMillis(w.created_at);
        const elapsedSec = ((Date.now() - startMs) / 1000) | 0;
        const currentValue = fromMilli(calculateDecayedValue(toMilli(w.cost || 0), elapsedSec));
        if (currentValue <= 0) return false;
        return true;
    });

    // 2. Pending (Applied) -> From involvedActiveWishes
    const pendingWishes = involvedActiveWishes.filter(w => {
        if (w.status !== 'open') return false;
        return w.applicants && w.applicants.some(a => a.id === currentUserId);
    });

    // 3. Active (Helper) -> From involvedActiveWishes
    const activeWishes = involvedActiveWishes.filter(w => {
        return w.helper_id === currentUserId && (w.status === 'in_progress' || w.status === 'review_pending');
    });

    // Auto-select leftmost non-empty tab
    React.useEffect(() => {
        if (!hasInitialized && (exploreWishes.length > 0 || pendingWishes.length > 0 || activeWishes.length > 0)) {
            if (exploreWishes.length > 0) {
                setActiveTab('explore');
            } else if (pendingWishes.length > 0) {
                setActiveTab('pending');
            } else if (activeWishes.length > 0) {
                setActiveTab('active');
            }
            setHasInitialized(true);
        }
    }, [exploreWishes, pendingWishes, activeWishes, hasInitialized]);

    // Auto-Tab Switch Handler
    const handleActionComplete = (action: 'applied' | 'withdrawn' | 'approved' | 'cancelled' | 'resigned' | 'completed' | 'cleanup') => {
        if (action === 'applied') {
            setActiveTab('pending');
        } else if (action === 'withdrawn' || action === 'resigned') {
            setActiveTab('explore');
        }
    };

    return (
        <div className="flex-1 flex flex-col w-full h-full animate-fade-in group/flow">
            {/* Header */}
            <div className="pt-safe">
                <div className="max-w-2xl mx-auto px-6 py-4 md:py-6 flex items-center justify-between">
                     <div className="flex items-center gap-3 min-w-0">
                        {/* Logo: ホームへ戻るボタン */}
                        <button
                            onClick={() => onTabChange?.('home')}
                            aria-label={MESSAGES.LAYOUT.RETURN_HOME}
                            className="shrink-0 focus:outline-none active:scale-95 transition-transform"
                        >
                            <img
                                src="/logo.png"
                                alt="Existence Ticker"
                                className="w-10 h-10 rounded-lg shadow-sm border border-slate-200/40 object-cover hover:opacity-80 transition-opacity"
                            />
                        </button>
                        {/* Text Group */}
                        <div className="flex flex-col min-w-0 justify-center">
                            <h2 className="text-xl sm:text-2xl font-light tracking-[0.2em] sm:tracking-[0.4em] text-slate-800 truncate leading-tight uppercase" style={{fontFamily: "'Noto Serif JP', serif"}}>{MESSAGES.FLOW.TITLE}</h2>
                        </div>
                    </div>
                    <div className="flex h-12 items-center gap-3 shrink-0">
                        <button
                          onClick={() => setIsDrawerOpen(true)}
                          className="p-3 -mr-3 text-slate-500 hover:text-slate-800 transition-colors active:scale-95"
                          aria-label={MESSAGES.LAYOUT.OPEN_MENU}
                        >
                          <Menu size={24} strokeWidth={1.5} />
                        </button>
                    </div>
                </div>
            </div>

            <SideDrawer
              isOpen={isDrawerOpen}
              onClose={() => setIsDrawerOpen(false)}
              currentTab="flow"
              onTabChange={(tab: AppViewMode) => onTabChange?.(tab)}
              onOpenOnboarding={onOpenOnboarding || (() => {})}
            />

            {/* Sub-Tabs (Premium Glassmorphism) */}
            <div className="bg-white/40 backdrop-blur-2xl border-b border-white/20 sticky top-0 z-30">
                <div className="max-w-2xl mx-auto px-6 flex items-center gap-8 overflow-x-auto no-scrollbar relative min-h-[52px]">
                    <button 
                        onClick={() => setActiveTab('explore')}
                        className={`relative py-3 text-sm font-bold transition-all shrink-0 focus:outline-none tracking-widest ${
                            activeTab === 'explore' 
                                ? 'text-amber-700' 
                                : exploreWishes.length === 0 ? 'text-slate-300' : 'text-slate-400 hover:text-slate-500'
                        }`}
                    >
                        <span>{MESSAGES.FLOW.TAB_EXPLORE} <span className="text-[10px] opacity-60 ml-1">({exploreWishes.length})</span></span>
                        {activeTab === 'explore' && (
                            <motion.div 
                                layoutId="flow-tab-underline"
                                className="absolute bottom-0 left-0 right-0 h-[3px] bg-amber-400 rounded-full"
                            />
                        )}
                    </button>

                    <button
                        onClick={() => setActiveTab('pending')}
                        className={`relative py-3 text-sm font-bold transition-all shrink-0 focus:outline-none tracking-widest ${
                            activeTab === 'pending' 
                                ? 'text-indigo-800' 
                                : pendingWishes.length === 0 ? 'text-slate-300' : 'text-slate-400 hover:text-slate-500'
                        }`}
                    >
                        {MESSAGES.FLOW.TAB_PENDING} <span className="text-[10px] opacity-60 ml-1">({pendingWishes.length})</span>
                        {activeTab === 'pending' && (
                            <motion.div 
                                layoutId="flow-tab-underline"
                                className="absolute bottom-0 left-0 right-0 h-[3px] bg-indigo-400 rounded-full"
                            />
                        )}
                    </button>

                    <button
                        onClick={() => setActiveTab('active')}
                        className={`relative py-3 text-sm font-bold transition-all shrink-0 focus:outline-none tracking-widest ${
                            activeTab === 'active' 
                                ? 'text-emerald-700' 
                                : activeWishes.length === 0 ? 'text-slate-300' : 'text-slate-400 hover:text-slate-500'
                        }`}
                    >
                        {MESSAGES.FLOW.TAB_ACTIVE} <span className="text-[10px] opacity-60 ml-1">({activeWishes.length})</span>
                        {activeTab === 'active' && (
                            <motion.div 
                                layoutId="flow-tab-underline"
                                className="absolute bottom-0 left-0 right-0 h-[3px] bg-emerald-400 rounded-full"
                            />
                        )}
                    </button>

                </div>
            </div>
            
            {/* Content Container */}
            <div className="flex-1 overflow-y-auto no-scrollbar w-full transition-colors duration-500">
                <div className="max-w-2xl mx-auto w-full px-6 py-6 pb-24 relative space-y-4">
                    
                    {activeTab === 'explore' && (
                        <WishCardList 
                            wishes={exploreWishes} 
                            currentUserId={currentUserId}
                            viewType="flow"
                            emptyMessage={MESSAGES.FLOW.EMPTY_EXPLORE}
                            emptyIcon={<ClipboardList size={48} className="text-slate-500 mb-2" />}
                            onOpenProfile={onOpenProfile}
                            onActionComplete={handleActionComplete}
                            onTabChange={onTabChange}
                        />
                    )}

                    {activeTab === 'pending' && (
                        <WishCardList 
                            wishes={pendingWishes} 
                            currentUserId={currentUserId}
                            viewType="flow"
                            emptyMessage={MESSAGES.FLOW.EMPTY_PENDING}
                            emptyIcon={<Timer size={48} className="text-slate-500 mb-2" />}
                            onOpenProfile={onOpenProfile}
                            onActionComplete={handleActionComplete}
                            onTabChange={onTabChange}
                        />
                    )}

                    {activeTab === 'active' && (
                        <WishCardList 
                            wishes={activeWishes} 
                            currentUserId={currentUserId}
                            viewType="flow"
                            emptyMessage={MESSAGES.FLOW.EMPTY_ACTIVE}
                            emptyIcon={<PlayCircle size={48} className="text-slate-500 mb-2" />}
                            onOpenProfile={onOpenProfile}
                            onActionComplete={handleActionComplete}
                            onTabChange={onTabChange}
                        />
                    )}

                </div>
            </div>
        </div>
    );
};
