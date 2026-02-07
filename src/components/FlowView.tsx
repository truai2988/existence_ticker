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
            <div className="w-full bg-white/80 backdrop-blur-md border-b-2 border-blue-400 shrink-0 z-10 pt-safe shadow-sm">
                <div className="max-w-md mx-auto px-6 h-[110px] flex flex-col justify-between">
                    {/* Header Content Row: Title Left, Actions Right */}
                    <div className="flex items-center justify-between w-full pt-3">
                        {/* Left: Title Block */}
                        <div>
                            <h2 className="text-lg font-bold font-sans text-slate-900 flex items-center gap-3">
                                みんなの願い
                            </h2>
                        </div>

                        {/* Right: Actions Block (Button + Close) */}
                        <div className="flex items-center gap-4">
                            <button 
                                onClick={() => setActiveTab('explore')}
                                className={`flex items-center justify-center gap-2 px-3.5 py-1.5 min-w-[124px] rounded-full text-xs font-bold transition-all shadow-sm active:scale-95 border focus:outline-none focus:ring-0 ${
                                    activeTab === 'explore' 
                                        ? 'bg-blue-600 text-white border-transparent shadow-blue-100' 
                                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                }`}
                            >
                                <ClipboardList size={14} className={activeTab === 'explore' ? 'text-white/80' : 'text-slate-400'} />
                                <span>願いをみる</span>
                            </button>

                            <button 
                                onClick={onClose} 
                                className="w-10 h-10 flex items-center justify-center hover:bg-slate-100 rounded-full transition-colors text-slate-400 focus:outline-none focus:ring-0"
                                aria-label="閉じる"
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Bottom Row: Tabs */}
                    <div className="flex items-end w-full overflow-hidden pb-2">
                        <div className="flex gap-1.5 pb-2 w-full justify-between sm:justify-start sm:gap-4">
                            <button
                                onClick={() => setActiveTab('pending')}
                                disabled={activeTab === 'pending'}
                                className={`px-3 py-1.5 text-xs font-bold transition-all whitespace-nowrap rounded-full flex items-center focus:outline-none focus:ring-0 ${
                                    activeTab === 'pending' 
                                        ? 'bg-amber-100 text-amber-700 border border-amber-200 cursor-default pointer-events-none' 
                                        : 'text-slate-400 hover:bg-white hover:text-slate-600 cursor-pointer'
                                }`}
                            >
                                返事待ち
                                <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-xs tabular-nums ${
                                    activeTab === 'pending' ? 'bg-white/80 text-amber-700 shadow-sm' : 'bg-slate-100 text-slate-500'
                                }`}>
                                    {pendingWishes.length}
                                </span>
                            </button>

                            <div className="flex items-center">
                                <ChevronRight size={14} className="text-slate-300" />
                            </div>

                            <button
                                onClick={() => setActiveTab('active')}
                                disabled={activeTab === 'active'}
                                className={`px-3 py-1.5 text-xs font-bold transition-all whitespace-nowrap rounded-full flex items-center focus:outline-none focus:ring-0 ${
                                    activeTab === 'active' 
                                        ? 'bg-emerald-100 text-emerald-700 border border-emerald-200 cursor-default pointer-events-none' 
                                        : 'text-slate-400 hover:bg-white hover:text-slate-600 cursor-pointer'
                                }`}
                            >
                                進行中
                                <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-xs tabular-nums ${
                                    activeTab === 'active' ? 'bg-white/80 text-emerald-700 shadow-sm' : 'bg-slate-100 text-slate-500'
                                }`}>
                                    {activeWishes.length}
                                </span>
                            </button>

                            <div className="flex items-center">
                                <ChevronRight size={14} className="text-slate-300" />
                            </div>

                            <button
                                onClick={() => setActiveTab('history')}
                                disabled={activeTab === 'history'}
                                className={`px-3 py-1.5 text-xs font-bold transition-all whitespace-nowrap rounded-full flex items-center focus:outline-none focus:ring-0 ${
                                    activeTab === 'history' 
                                        ? 'bg-slate-200 text-slate-700 border border-slate-300 cursor-default pointer-events-none' 
                                        : 'text-slate-400 hover:bg-white hover:text-slate-600 cursor-pointer'
                                }`}
                            >
                                過去の記録
                                <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-xs tabular-nums ${
                                    activeTab === 'history' ? 'bg-white/80 text-slate-700 shadow-sm' : 'bg-slate-100 text-slate-500'
                                }`}>
                                    {historyWishes.length}
                                </span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        <UserSubBar />
        
        {/* Content Container (Full Width) */}
        <div className="flex-1 overflow-y-auto no-scrollbar bg-blue-50/20 w-full transition-colors duration-500">
            {/* Inner Content (Centered) */}
            <div className="max-w-md mx-auto px-6 py-4 pb-24 w-full">
                
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

            {activeTab === 'history' && (
                <div className="flex flex-col gap-4">
                    <WishCardList 
                        wishes={historyWishes} 
                        currentUserId={currentUserId}
                        viewType="flow"
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