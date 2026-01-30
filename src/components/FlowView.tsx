import React, { useState } from 'react';
import { X, ClipboardList, Timer, PlayCircle } from 'lucide-react';
import { useWishes } from '../hooks/useWishes';
import { calculateLifePoints } from '../utils/decay';

import { WishCardList } from './WishCardList';

import { UserSubBar } from './UserSubBar';

interface FlowViewProps {
    onClose: () => void;
    currentUserId: string;
    onOpenProfile?: () => void;
}

type TabType = 'explore' | 'entries';

export const FlowView: React.FC<FlowViewProps> = ({ onClose, currentUserId, onOpenProfile }) => {
    const { wishes, loadMore, hasMore, isFetchingMore } = useWishes();
    const [activeTab, setActiveTab] = useState<TabType>('explore');
    
    // --- Filter Logic ---

    // 1. Explore (探す)
    // - Open Status
    // - Not My Wish
    // - Not Applied by Me
    // - Not Expired
    const exploreWishes = wishes.filter(w => {
        if (w.status !== 'open') return false;
        if (w.requester_id === currentUserId) return false;
        if (w.applicants && w.applicants.some(a => a.id === currentUserId)) return false; // Exclude applied
        
        const currentValue = calculateLifePoints(w.cost || 0, w.created_at);
        if (currentValue <= 0) return false;

        return true;
    });

    // 2. Entries (活動状況)
    // A. Applied (返事待ち)
    const appliedWishes = wishes.filter(w => 
        w.status === 'open' && 
        w.applicants && w.applicants.some(a => a.id === currentUserId)
    );

    // B. Working / History (進行中・完了)
    const activeWishes = wishes.filter(w => 
        w.helper_id === currentUserId && 
        (w.status === 'in_progress' || w.status === 'review_pending' || w.status === 'fulfilled')
    );
    
    // Combine for counts ?? No, keep sections separate.

    return (
        <div className="fixed inset-0 z-[60] bg-slate-50 flex flex-col w-full h-full">
            {/* Header Container (Full Width) */}
            <div className="w-full bg-white/80 backdrop-blur-md border-b border-slate-200 shrink-0 z-10 pt-safe">
            {/* Compact Header Content (Centered) */}
            <div className="max-w-md mx-auto px-6 h-[90px] flex flex-col justify-start pt-3">
                <div className="flex justify-between items-center w-full mb-2">
                    <div>
                        <h2 className="text-lg font-bold font-sans text-slate-900">募集中の願い</h2>
                        <p className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">みんなの広場</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                            <X size={20} className="text-slate-400" />
                        </button>
                    </div>
                </div>

                {/* Bottom Row: Tabs */}
                <div className="flex items-end w-full">
                    <div className="flex gap-8">
                        <button
                            onClick={() => setActiveTab('explore')}
                            className={`pb-1 text-xs font-bold transition-all relative ${
                                activeTab === 'explore' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
                            }`}
                        >
                            お願いを探す
                            {activeTab === 'explore' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-500 rounded-t-full" />}
                        </button>
                        <button
                            onClick={() => setActiveTab('entries')}
                            className={`pb-1 text-xs font-bold transition-all relative ${
                                activeTab === 'entries' ? 'text-green-600' : 'text-slate-400 hover:text-slate-600'
                            }`}
                        >
                            活動履歴
                            <span className="ml-2 bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full text-[10px] tabular-nums">
                                {appliedWishes.length + activeWishes.length}
                            </span>
                            {activeTab === 'entries' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-green-500 rounded-t-full" />}
                        </button>
                    </div>
                </div>
            </div>
        </div>
        <UserSubBar />
        
        {/* Content Container (Full Width) */}
        <div className="flex-1 overflow-y-auto no-scrollbar w-full">
            {/* Inner Content (Centered) */}
            <div className="max-w-md mx-auto p-4 pb-24 w-full">
                
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
                    />
                )}

                {activeTab === 'entries' && (
                    <div className="space-y-8">
                        {/* Section A: Applied */}
                        <div>
                            <div className="flex items-center gap-2 mb-3 px-1 text-slate-400">
                                <Timer size={14} />
                                <h3 className="text-xs font-bold uppercase tracking-wider">返事待ち</h3>
                                <span className="text-[10px] bg-slate-100 px-1.5 rounded-full">{appliedWishes.length}</span>
                            </div>
                            
                            {appliedWishes.length > 0 ? (
                                <WishCardList 
                                    wishes={appliedWishes} 
                                    currentUserId={currentUserId}
                                    onOpenProfile={onOpenProfile}
                                />
                            ) : (
                                <div className="p-6 text-center border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/50">
                                    <p className="text-xs text-slate-400">返事待ちの依頼はありません</p>
                                </div>
                            )}
                        </div>

                        {/* Section B: Active/History */}
                        <div>
                            <div className="flex items-center gap-2 mb-3 px-1 text-slate-400 border-t border-slate-100 pt-6">
                                <PlayCircle size={14} className="text-green-500" />
                                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">進行中・完了</h3>
                                <span className="text-[10px] bg-slate-100 px-1.5 rounded-full">{activeWishes.length}</span>
                            </div>

                            {activeWishes.length > 0 ? (
                                <WishCardList 
                                    wishes={activeWishes} 
                                    currentUserId={currentUserId}
                                    onOpenProfile={onOpenProfile}
                                />
                            ) : (
                                <div className="p-6 text-center border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/50">
                                    <p className="text-xs text-slate-400">進行中の依頼はありません</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};