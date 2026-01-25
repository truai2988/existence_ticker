import React, { useState } from 'react';
import { X, Search, CheckCircle, ClipboardList } from 'lucide-react';
import { useWishes } from '../hooks/useWishes';

import { WishCardList } from './WishCardList';

interface FlowViewProps {
    onClose: () => void;
    currentUserId: string;
}

type TabType = 'search' | 'inbound';

export const FlowView: React.FC<FlowViewProps> = ({ onClose, currentUserId }) => {
    const { wishes } = useWishes();
    // const { acceptWish } = useWishActions(); // No longer needed
    const [activeTab, setActiveTab] = useState<TabType>('search');

    // Filter Logic
    // 1. Search (All Open Wishes, excluding mine preferably, but showing all is fine too)
    const openWishes = wishes.filter(w => w.status === 'open');

    // 2. Inbound Contracts (I accepted, I am helper)
    const myJobs = wishes.filter(w => w.helper_id === currentUserId && w.status !== 'open');

    // 3. Gifts (Not implemented fully in data model yet, placeholder)
    
    return (
    <div className="fixed inset-0 z-[60] bg-slate-50 flex flex-col animate-fade-in">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 shrink-0 bg-white shadow-sm z-10">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold font-sans text-slate-900">募集一覧</h2>
                <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                    <X className="text-slate-500" />
                </button>
            </div>

            {/* Tabs */}
            <div className="flex bg-slate-100 p-1 rounded-lg">
                <button
                    onClick={() => setActiveTab('search')}
                    className={`flex-1 py-2.5 text-xs font-bold rounded-md transition-all flex items-center justify-center gap-2 ${
                        activeTab === 'search' ? 'bg-white text-blue-600 shadow-sm ring-1 ring-black/5' : 'text-slate-500 hover:text-slate-700'
                    }`}
                >
                    <Search size={14} />
                    募集を探す
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
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-4 pb-24">
            {activeTab === 'search' && (
                <WishCardList 
                    wishes={openWishes} 
                    currentUserId={currentUserId}
                    emptyMessage="現在、募集中の依頼はありません"
                    emptyIcon={<ClipboardList size={48} className="text-slate-300 mb-2" />}
                />
            )}

            {activeTab === 'inbound' && (
                <WishCardList 
                    wishes={myJobs} 
                    currentUserId={currentUserId}
                    emptyMessage="現在、お引き受け中の依頼はありません"
                    emptyIcon={<CheckCircle size={48} className="text-slate-300 mb-2" />}
                />
            )}
        </div>
    </div>
  );
};
