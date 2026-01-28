import React, { useState } from 'react';
import { X, Search, CheckCircle, ClipboardList } from 'lucide-react';
import { useWishes } from '../hooks/useWishes';

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
        return true;
    });

    // 2. Inbound Contracts (I accepted, I am helper)
    const myJobs = wishes.filter(w => w.helper_id === currentUserId && w.status !== 'open');
    
    return (
    <div className="fixed inset-0 z-[60] bg-slate-50 flex flex-col animate-fade-in">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 shrink-0 bg-white shadow-sm z-10">
            <div className="flex justify-between items-center mb-4">
                <div>
                     <h2 className="text-xl font-bold font-sans text-slate-900">みんなの願い (募集一覧)</h2>
                     <p className="text-xs text-slate-500 font-mono tracking-widest uppercase">The Marketplace</p>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                    <X className="text-slate-500" />
                </button>
            </div>

            {/* Tabs & Filters */}
            <div className="space-y-3">
                <div className="flex bg-slate-100 p-1 rounded-lg">
                    <button
                        onClick={() => setActiveTab('search')}
                        className={`flex-1 py-2.5 text-xs font-bold rounded-md transition-all flex items-center justify-center gap-2 ${
                            activeTab === 'search' ? 'bg-white text-blue-600 shadow-sm ring-1 ring-black/5' : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        <Search size={14} />
                        手伝いを探す
                    </button>
                    <button
                        onClick={() => setActiveTab('inbound')}
                        className={`flex-1 py-2.5 text-xs font-bold rounded-md transition-all flex items-center justify-center gap-2 ${
                            activeTab === 'inbound' ? 'bg-white text-green-600 shadow-sm ring-1 ring-black/5' : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        <CheckCircle size={14} />
                        引き受け中
                    </button>
                </div>
                
                {/* Filter Toggle (Only for Search Tab) */}
                {activeTab === 'search' && (
                    <div className="flex items-center justify-end px-1">
                        <label className="flex items-center gap-2 text-xs font-medium text-slate-500 cursor-pointer select-none">
                            <span>自分の募集を表示しない</span>
                            <div className="relative inline-flex items-center cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    className="sr-only peer" 
                                    checked={hideMyWishes}
                                    onChange={(e) => setHideMyWishes(e.target.checked)}
                                />
                                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-500"></div>
                            </div>
                        </label>
                    </div>
                )}
            </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-4 pb-24">
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
  );
};