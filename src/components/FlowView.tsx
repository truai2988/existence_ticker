import React, { useState } from 'react';
import { ClipboardList, X, ChevronRight, Timer, PlayCircle } from "lucide-react";
import { useWishes } from '../hooks/useWishes';
import { calculateLifePoints } from '../utils/decay';
import { WishCardList } from './WishCardList';

import { UserSubBar } from './UserSubBar';

interface FlowViewProps {
    onClose: () => void;
    currentUserId: string;
    onOpenProfile?: () => void;
}

type TabType = 'explore' | 'pending' | 'active' | 'history';

export const FlowView: React.FC<FlowViewProps> = ({ onClose, currentUserId, onOpenProfile }) => {
    const { wishes, involvedWishes, loadMore, hasMore, isFetchingMore } = useWishes();
    const [activeTab, setActiveTab] = useState<TabType>('explore');
    
    // 1. Explore (お願いを探す)
    // - status: 'open'
    // - NOT my wish
    // - NOT applied by me
    const exploreWishes = wishes.filter(w => {
        if (w.status !== 'open') return false;
        if (w.requester_id === currentUserId) return false;
        if (w.applicants && w.applicants.some(a => a.id === currentUserId)) return false;
        
        // Also hide if 0 Lm (already decayed completely)
        const currentValue = calculateLifePoints(w.cost || 0, w.created_at);
        if (currentValue <= 0) return false;
        
        return true;
    });

    // 2. Pending (返事待ち) - FROM INVOLVED
    // - status: 'open'
    // - applied by me
    const pendingWishes = involvedWishes.filter(w => {
        if (w.status !== 'open') return false;
        if (!w.applicants || !w.applicants.some(a => a.id === currentUserId)) return false;
        
        // Hide if expired
        const currentValue = calculateLifePoints(w.cost || 0, w.created_at);
        if (currentValue <= 0) return false;
        
        return true;
    });

    // 3. Active (進行中) - FROM INVOLVED
    // - helper_id is me
    // - status: 'in_progress' or 'review_pending'
    const activeWishes = involvedWishes.filter(w => {
        if (w.helper_id !== currentUserId) return false;
        if (w.status !== 'in_progress' && w.status !== 'review_pending') return false;
        
        // Hide if expired
        const currentValue = calculateLifePoints(w.cost || 0, w.created_at);
        if (currentValue <= 0) return false;
        
        return true;
    });

    // 4. History (過去の記録) - FROM INVOLVED
    // - helper_id is me OR I applied
    // - status: 'fulfilled', 'cancelled', 'expired' OR (open/in_progress/review_pending AND 0 Lm)
    const historyWishes = involvedWishes.filter(w => {
        const isHelper = w.helper_id === currentUserId;
        const isApplicant = w.applicants && w.applicants.some(a => a.id === currentUserId);
        
        // Base check: Must be involved
        if (!isHelper && !isApplicant) return false;

        // Status check
        const isOfficialHistory = ['fulfilled', 'cancelled', 'expired'].includes(w.status);
        const isDecayed = calculateLifePoints(w.cost || 0, w.created_at) <= 0;

        if (isOfficialHistory || isDecayed) {
            // SPEC CHANGE: If expired (or decayed), ONLY show if actual Helper.
            // Applicants don't see "missed/expired" opportunities in history.
            if (w.status === 'expired' || isDecayed) {
                return isHelper;
            }
            // For fulfilled/cancelled, Applicants might see it? 
            // Usually 'fulfilled' implies a helper existed. 
            // 'cancelled' might happen while open.
            // If cancelled while open, applicants might want to know? 
            // User spec implies "Expired" is the main specific exclusion.
            // Let's stick to "If expired/decayed, must be Helper".
            return true;
        }

        return false;
    });

    // Combine for counts ?? No, keep sections separate.

    // Auto-Tab Switch Handler
    const handleActionComplete = (action: 'applied' | 'withdrawn' | 'approved' | 'cancelled' | 'resigned' | 'completed' | 'cleanup') => {
        if (action === 'applied') {
            setActiveTab('pending');
        } else if (action === 'withdrawn' || action === 'resigned') {
            setActiveTab('explore');
        }
    };

    return (
        <div className="fixed inset-0 z-[60] bg-slate-50 flex flex-col w-full h-full">
            {/* Header Container (Full Width) */}
            <div className="w-full bg-white/80 backdrop-blur-md border-b border-slate-200 shrink-0 z-10 pt-safe">
            {/* Compact Header Content (Centered) */}
            <div className="max-w-md mx-auto px-6 h-[90px] flex flex-col justify-start pt-3">
                <div className="flex justify-between items-center w-full mb-2">
                    <div>
                        <h2 className="text-lg font-bold font-sans text-slate-900 flex items-center gap-3">
                            みんなの願い
                        </h2>
                    </div>
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => setActiveTab('explore')}
                            className={`flex items-center gap-2 px-4 h-9 rounded-full text-xs font-bold transition-all shadow-sm active:scale-95 border ${
                                activeTab === 'explore' 
                                    ? 'bg-blue-600 text-white border-transparent shadow-blue-100' 
                                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                        >
                            <ClipboardList size={14} className={activeTab === 'explore' ? 'text-white/80' : 'text-slate-400'} />
                            <span>お願いを探す</span>
                            <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[11px] tabular-nums ${
                                activeTab === 'explore' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                            }`}>
                                {exploreWishes.length}
                            </span>
                        </button>
                        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                            <X size={20} className="text-slate-400" />
                        </button>
                    </div>
                </div>

                {/* Bottom Row: Tabs */}
                <div className="flex items-end w-full overflow-hidden">
                    <div className="flex gap-2 pb-0.5 w-full justify-between sm:justify-start sm:gap-6">
                        <button
                            onClick={() => setActiveTab('pending')}
                            className={`pb-1 text-xs font-bold transition-all whitespace-nowrap relative ${
                                activeTab === 'pending' ? 'text-amber-600' : 'text-slate-400 hover:text-slate-600'
                            }`}
                        >
                            返事待ち
                            <span className={`ml-1 px-1 py-0.5 rounded-full text-[10px] tabular-nums ${
                                activeTab === 'pending' ? 'bg-amber-100/50 text-amber-700' : 'bg-slate-100 text-slate-500'
                            }`}>
                                {pendingWishes.length}
                            </span>
                            {activeTab === 'pending' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-amber-500 rounded-t-full" />}
                        </button>

                        <div className="flex items-center pb-2">
                            <ChevronRight size={14} className="text-slate-300" />
                        </div>

                        <button
                            onClick={() => setActiveTab('active')}
                            className={`pb-1 text-xs font-bold transition-all whitespace-nowrap relative ${
                                activeTab === 'active' ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600'
                            }`}
                        >
                            進行中
                            <span className={`ml-1 px-1 py-0.5 rounded-full text-[10px] tabular-nums ${
                                activeTab === 'active' ? 'bg-emerald-100/50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                            }`}>
                                {activeWishes.length}
                            </span>
                            {activeTab === 'active' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-emerald-500 rounded-t-full" />}
                        </button>

                        <div className="flex items-center pb-2">
                            <ChevronRight size={14} className="text-slate-300" />
                        </div>

                        <button
                            onClick={() => setActiveTab('history')}
                            className={`pb-1 text-xs font-bold transition-all whitespace-nowrap relative ${
                                activeTab === 'history' ? 'text-slate-600' : 'text-slate-400 hover:text-slate-600'
                            }`}
                        >
                            過去の記録
                            <span className={`ml-1 px-1 py-0.5 rounded-full text-[11px] tabular-nums ${
                                activeTab === 'history' ? 'bg-slate-200 text-slate-700' : 'bg-slate-100 text-slate-500'
                            }`}>
                                {historyWishes.length}
                            </span>
                            {activeTab === 'history' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-slate-400 rounded-t-full" />}
                        </button>
                    </div>
                </div>
            </div>
        </div>
        <UserSubBar />
        
        {/* Content Container (Full Width) */}
        <div className="flex-1 overflow-y-auto no-scrollbar w-full">
            {/* Inner Content (Centered) */}
            <div className="max-w-md mx-auto px-6 py-4 pb-24 w-full">
                
                {activeTab === 'explore' && (
                    <WishCardList 
                        wishes={exploreWishes} 
                        currentUserId={currentUserId}
                        emptyMessage="条件に合う募集中の依頼はありません"
                        emptyIcon={<ClipboardList size={48} className="text-slate-300 mb-2" />}
                        onLoadMore={loadMore}
                        hasMore={hasMore}
                        isFetchingMore={isFetchingMore}
                        onOpenProfile={onOpenProfile}
                        onActionComplete={handleActionComplete}
                    />
                )}

                {activeTab === 'pending' && (
                    <WishCardList 
                        wishes={pendingWishes} 
                        currentUserId={currentUserId}
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
                        emptyMessage="進行中の依頼はありません"
                        emptyIcon={<PlayCircle size={48} className="text-slate-300 mb-2" />}
                        onOpenProfile={onOpenProfile}
                        onActionComplete={handleActionComplete}
                    />
                )}

            {activeTab === 'history' && (
                    <WishCardList 
                        wishes={historyWishes} 
                        currentUserId={currentUserId}
                        emptyMessage="活動記録はありません"
                        emptyIcon={<ClipboardList size={48} className="text-slate-300 mb-2" />}
                        onOpenProfile={onOpenProfile}
                        onActionComplete={handleActionComplete}
                    />
                )}
            </div>
        </div>
    </div>
  );
};