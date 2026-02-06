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
    const { 
        wishes, // active feed
        involvedActiveWishes, 
        involvedArchiveWishes,
        loadInvolvedArchive,
        involvedArchiveHasMore
    } = useWishes();
    
    const [activeTab, setActiveTab] = useState<TabType>('explore');
    const [isHistoryLoading, setIsHistoryLoading] = useState(false);

    // Rule of 10: Load Archive only when tab is 'history'
    React.useEffect(() => {
        if (activeTab === 'history') {
            loadInvolvedArchive(true); // Initial Load
        }
    }, [activeTab, loadInvolvedArchive]);

    const handleLoadMoreHistory = async () => {
        setIsHistoryLoading(true);
        await loadInvolvedArchive(false);
        setIsHistoryLoading(false);
    };
    
    // 1. Explore (Active Global Feed)
    // Filter: NOT my wish, NOT applied
    // Note: 'wishes' from context is now REAL-TIME 'open' status only.
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

    // 4. History -> From involvedArchiveWishes (Lazy Loaded)
    const historyWishes = involvedArchiveWishes;

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
                                {/* Show count only if loaded? Or maybe '...' */}
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
                        onOpenProfile={onOpenProfile}
                        onActionComplete={handleActionComplete}
                        // Note: Global feed pagination (loadMore) removed from UI for now per 'Simplicity' or 
                        // should we keep it for Explore? The new Context doesn't expose 'loadMore' for general feed yet.
                        // Context has 'activeWishes' (realtime) which might be capped by Firestore 'limit' if we added one, 
                        // but currently onSnapshot query has NO limit?
                        // IMPORTANT: The Context 'qFeed' has NO LIMIT in my snippet. 
                        // Realtime usually implies "latest" window. 
                        // User request: "Scalable". Infinite realtime list is bad.
                        // But let's stick to "Active (Open)" being relatively small list managed by nature of app?
                        // Or did I miss adding limit to qFeed? 
                        // "Active data... constantly maintained". It implies ALL active open wishes.
                        // Assuming volume is manageable for "Open" wishes.
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
                <div className="flex flex-col gap-4">
                    <WishCardList 
                        wishes={historyWishes} 
                        currentUserId={currentUserId}
                        emptyMessage="活動記録はありません"
                        emptyIcon={<ClipboardList size={48} className="text-slate-300 mb-2" />}
                        onOpenProfile={onOpenProfile}
                        onActionComplete={handleActionComplete}
                    />
                    
                    {/* Load More Button for History */}
                    {involvedArchiveHasMore && (
                        <button 
                            onClick={handleLoadMoreHistory}
                            disabled={isHistoryLoading}
                            className="w-full py-3 text-xs font-bold text-slate-500 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors disabled:opacity-50"
                        >
                            {isHistoryLoading ? "読み込み中..." : "さらに読み込む"}
                        </button>
                    )}
                </div>
                )}
            </div>
        </div>
    </div>
  );
};