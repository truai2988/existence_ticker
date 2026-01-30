import React, { useState } from 'react';
import { X, CheckCircle, ClipboardList } from 'lucide-react';
import { useWishes } from '../hooks/useWishes';
import { calculateLifePoints } from '../utils/decay';

import { WishCardList } from './WishCardList';

interface FlowViewProps {
    onClose: () => void;
    currentUserId: string;
    onOpenProfile?: () => void;
}

type TabType = 'search' | 'inbound';

export const FlowView: React.FC<FlowViewProps> = ({ onClose, currentUserId, onOpenProfile }) => {
    const { wishes, loadMore, hasMore, isFetchingMore } = useWishes();
    const [activeTab, setActiveTab] = useState<TabType>('search');
    const [hideMyWishes, setHideMyWishes] = useState(false);

    // Filter Logic
    // 1. Search (All Open Wishes)
    const openWishes = wishes.filter(w => {
        if (w.status !== 'open') return false;
        if (hideMyWishes && w.requester_id === currentUserId) return false;
        
        // Filter out expired (0 value) wishes
        const currentValue = calculateLifePoints(w.cost || 0, w.created_at);
        if (currentValue <= 0) return false;

        return true;
    });

    // 2. Inbound Contracts (I accepted, I am helper)
    const myJobs = wishes.filter(w => w.helper_id === currentUserId && w.status !== 'open');
    
    return (

    <div className="fixed inset-0 z-[60] bg-slate-50 flex flex-col animate-fade-in w-full h-full">
        {/* Header Container (Full Width) */}
        <div className="w-full bg-white/80 backdrop-blur-md border-b border-slate-200 shrink-0 z-10">
            {/* Compact Header Content (Centered) */}
            <div className="max-w-md mx-auto pt-4 px-4">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h2 className="text-lg font-bold font-sans text-slate-900">みんなの願い (募集一覧)</h2>
                        <p className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">The Marketplace</p>
                    </div>
                    <div className="flex items-center gap-4">
                        {/* Toggle Switch (Only for Search Tab) */}
                        {activeTab === 'search' && (
                            <label className="flex items-center gap-2 cursor-pointer select-none group">
                                <span className="text-[10px] font-bold text-slate-400 group-hover:text-slate-600 transition-colors">自募集を隠す</span>
                                <div className="relative inline-flex items-center cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        className="sr-only peer" 
                                        checked={hideMyWishes}
                                        onChange={(e) => setHideMyWishes(e.target.checked)}
                                    />
                                    <div className="w-8 h-4 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-blue-500"></div>
                                </div>
                            </label>
                        )}
                        
                        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                            <X size={20} className="text-slate-400" />
                        </button>
                    </div>
                </div>

                {/* Simple Tabs */}
                <div className="flex gap-8">
                    <button
                        onClick={() => setActiveTab('search')}
                        className={`pb-3 text-xs font-bold transition-all relative ${
                            activeTab === 'search' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
                        }`}
                    >
                        手伝いを探す
                        {activeTab === 'search' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-500 rounded-t-full" />}
                    </button>
                    <button
                        onClick={() => setActiveTab('inbound')}
                        className={`pb-3 text-xs font-bold transition-all relative ${
                            activeTab === 'inbound' ? 'text-green-600' : 'text-slate-400 hover:text-slate-600'
                        }`}
                    >
                        引き受け中
                        <span className="ml-2 bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full text-[10px] tabular-nums">
                            {myJobs.length}
                        </span>
                        {activeTab === 'inbound' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-green-500 rounded-t-full" />}
                    </button>
                </div>
            </div>
        </div>

        {/* Content Container (Full Width) */}
        <div className="flex-1 overflow-y-auto no-scrollbar w-full">
            {/* Inner Content (Centered) */}
            <div className="max-w-md mx-auto p-4 pb-24 w-full">
                {activeTab === 'search' && (
                    <WishCardList 
                        wishes={openWishes} 
                        currentUserId={currentUserId}
                        emptyMessage="現在、募集中の依頼はありません"
                        emptyIcon={<ClipboardList size={48} className="text-slate-300 mb-2" />}
                        onLoadMore={loadMore}
                        hasMore={hasMore}
                        isFetchingMore={isFetchingMore}
                        onOpenProfile={onOpenProfile}
                    />
                )}

                {activeTab === 'inbound' && (
                    <WishCardList 
                        wishes={myJobs} 
                        currentUserId={currentUserId}
                        emptyMessage="現在、お引き受け中の依頼はありません"
                        emptyIcon={<CheckCircle size={48} className="text-slate-300 mb-2" />}
                        onOpenProfile={onOpenProfile}
                    />
                )}
            </div>
        </div>
    </div>
  );
};