import React, { useState } from 'react';
import { ClipboardList, Timer, PlayCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useWishes } from '../hooks/useWishes';
import { calculateLifePoints } from '../utils/decay';
import { WishCardList } from './WishCardList';
import { HeaderNavigation } from './HeaderNavigation';
import { AppViewMode } from '../types';

interface FlowViewProps {
    currentUserId: string;
    onOpenProfile?: () => void;
    onTabChange?: (mode: AppViewMode) => void;
}

type TabType = 'explore' | 'pending' | 'active';

export const FlowView: React.FC<FlowViewProps> = ({ currentUserId, onOpenProfile, onTabChange }) => {
    const { 
        wishes, // active feed
        involvedActiveWishes, 
    } = useWishes();
    
    const [activeTab, setActiveTab] = useState<TabType>('explore');
    const [hasInitialized, setHasInitialized] = useState(false);

    // 1. Explore (Active Global Feed)
    const exploreWishes = wishes.filter(w => {
        if (w.requester_id === currentUserId) return false;
        if (w.applicants && w.applicants.some(a => a.id === currentUserId)) return false;
        const currentValue = calculateLifePoints(w.cost || 0, w.created_at);
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
            {/* Subtle Section Header with Navigation */}
            <div className="border-b border-slate-100/50">
                <div className="max-w-2xl mx-auto px-6 py-4 md:py-6 flex items-center justify-between flex-nowrap gap-2">
                    <div className="min-w-0">
                        <h2 className="text-lg min-[375px]:text-xl font-bold tracking-widest uppercase text-slate-900 flex items-center gap-2 truncate">
                            みんなの願い
                        </h2>
                        <p className="text-xs min-[375px]:text-sm text-slate-500 font-mono tracking-[0.2em] uppercase mt-1 truncate">Flow of Wishes</p>
                    </div>
                    <div className="flex items-center gap-2">
                        {onTabChange && (
                            <div className="shrink-0 ml-1">
                                <HeaderNavigation 
                                    currentTab="flow" 
                                    onTabChange={(tab: AppViewMode) => onTabChange(tab)} 
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Sub-Tabs (Subtle Flat Design) */}
            <div className="bg-amber-50/20">
                <div className="max-w-2xl mx-auto px-6 flex items-center gap-6 overflow-x-auto no-scrollbar relative min-h-[52px]">
                    <button 
                        onClick={() => setActiveTab('explore')}
                        className={`relative py-3 text-sm font-bold transition-all shrink-0 focus:outline-none ${
                            activeTab === 'explore' 
                                ? 'text-amber-800' 
                                : exploreWishes.length === 0 ? 'text-slate-200' : 'text-slate-400 hover:text-slate-500'
                        }`}
                    >
                        <span>募集中</span>
                        {activeTab === 'explore' && (
                            <motion.div 
                                layoutId="flow-tab-underline"
                                className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500 rounded-full"
                            />
                        )}
                    </button>

                    <button
                        onClick={() => setActiveTab('pending')}
                        className={`relative py-3 text-sm font-bold transition-all shrink-0 focus:outline-none ${
                            activeTab === 'pending' 
                                ? 'text-amber-700' 
                                : pendingWishes.length === 0 ? 'text-slate-200' : 'text-slate-400 hover:text-slate-500'
                        }`}
                    >
                        返事待ち ({pendingWishes.length})
                        {activeTab === 'pending' && (
                            <motion.div 
                                layoutId="flow-tab-underline"
                                className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-400 rounded-full"
                            />
                        )}
                    </button>

                    <button
                        onClick={() => setActiveTab('active')}
                        className={`relative py-3 text-sm font-bold transition-all shrink-0 focus:outline-none ${
                            activeTab === 'active' 
                                ? 'text-emerald-700' 
                                : activeWishes.length === 0 ? 'text-slate-200' : 'text-slate-400 hover:text-slate-500'
                        }`}
                    >
                        進行中 ({activeWishes.length})
                        {activeTab === 'active' && (
                            <motion.div 
                                layoutId="flow-tab-underline"
                                className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500 rounded-full"
                            />
                        )}
                    </button>

                </div>
            </div>
            
            {/* Content Container */}
            <div className="flex-1 overflow-y-auto no-scrollbar bg-amber-50/20 w-full transition-colors duration-500">
                <div className="max-w-2xl mx-auto w-full px-6 py-4 pb-24 relative">
                    
                    {activeTab === 'explore' && (
                        <WishCardList 
                            wishes={exploreWishes} 
                            currentUserId={currentUserId}
                            viewType="flow"
                            emptyMessage="条件に合う募集中の依頼はありません"
                            emptyIcon={<ClipboardList size={48} className="text-slate-300 mb-2" />}
                            onOpenProfile={onOpenProfile}
                            onActionComplete={handleActionComplete}
                        />
                    )}

                    {activeTab === 'pending' && (
                        <WishCardList 
                            wishes={pendingWishes} 
                            currentUserId={currentUserId}
                            viewType="flow"
                            emptyMessage="返事待ちの依頼はありません"
                            emptyIcon={<Timer size={48} className="text-slate-300 mb-2" />}
                            onOpenProfile={onOpenProfile}
                            onActionComplete={handleActionComplete}
                        />
                    )}

                    {activeTab === 'active' && (
                        <WishCardList 
                            wishes={activeWishes} 
                            currentUserId={currentUserId}
                            viewType="flow"
                            emptyMessage="進行中の依頼はありません"
                            emptyIcon={<PlayCircle size={48} className="text-slate-300 mb-2" />}
                            onOpenProfile={onOpenProfile}
                            onActionComplete={handleActionComplete}
                        />
                    )}

                </div>
            </div>
        </div>
    );
};
