import React, { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { X, Megaphone } from 'lucide-react';
import { useWishes } from '../hooks/useWishes';
import { WishCardList } from './WishCardList';

import { CreateWishModal } from './CreateWishModal';
// import { DonationModal } from './DonationModal'; 
// import { CompleteWishModal } from './CompleteWishModal'; // Removed unused
// import { useScanProcessor } from '../hooks/useScanProcessor'; 
// import { PendingWish } from '../types'; // Removed unused

interface RadianceViewProps {
    onClose: () => void;
    currentUserId: string;
}

type TabType = 'active' | 'outbound';
type ModalState = 'none' | 'create_wish' | 'gift_amount' | 'settle_wish';

export const RadianceView: React.FC<RadianceViewProps> = ({ onClose, currentUserId }) => {
    const { wishes } = useWishes();
    
    const [activeTab, setActiveTab] = useState<TabType>('active');
    const [modalState, setModalState] = useState<ModalState>('none');
    
    // Filter Logic
    // 1. My Active Stars (My Open Requests)
    const myActiveWishes = wishes.filter(w => 
        w.requester_id === currentUserId && w.status === 'open'
    );
    // 2. Outbound Contracts (My In-Progress Requests)
    const myOutboundWishes = wishes.filter(w => 
        w.requester_id === currentUserId && w.status === 'in_progress'
    );

    const renderModals = () => {
        return (
            <AnimatePresence>
                {/* Create Wish */}
                {modalState === 'create_wish' && (
                    <CreateWishModal onClose={() => setModalState('none')} />
                )}
            </AnimatePresence>
        );
    };

    return (
        <div className="fixed inset-0 z-[60] bg-slate-50/95 backdrop-blur-md animate-fade-in flex flex-col pt-safe w-full h-full">
            {/* Header Container */}
            <div className="w-full bg-white/80 backdrop-blur-md border-b border-slate-200 shrink-0">
                <div className="max-w-md mx-auto pt-4 px-4">
                    <div className="flex justify-between items-center mb-4">
                        <div>
                             <h2 className="text-lg font-bold font-sans text-slate-900">自分のお願い</h2>
                             <p className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">My Wishes Hub</p>
                        </div>
                        <div className="flex gap-3">
                            <button 
                                onClick={() => setModalState('create_wish')}
                                className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-full text-xs font-bold hover:bg-amber-600 transition-all shadow-sm active:scale-95"
                            >
                                <Megaphone size={14} className="fill-white/20" />
                                <span>新規作成</span>
                            </button>
                            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                                <X size={20} className="text-slate-400" />
                            </button>
                        </div>
                    </div>

                    {/* Simple Tabs */}
                    <div className="flex gap-8">
                        <button
                            onClick={() => setActiveTab('active')}
                            className={`pb-3 text-xs font-bold transition-all relative ${
                                activeTab === 'active' ? 'text-amber-600' : 'text-slate-400 hover:text-slate-600'
                            }`}
                        >
                            募集中
                            <span className="ml-2 bg-amber-100/50 text-amber-700 px-1.5 py-0.5 rounded-full text-[10px] tabular-nums">
                                {myActiveWishes.length}
                            </span>
                            {activeTab === 'active' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-amber-500 rounded-t-full" />}
                        </button>
                        <button
                            onClick={() => setActiveTab('outbound')}
                            className={`pb-3 text-xs font-bold transition-all relative ${
                                activeTab === 'outbound' ? 'text-amber-600' : 'text-slate-400 hover:text-slate-600'
                            }`}
                        >
                            進行中
                            <span className="ml-2 bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full text-[10px] tabular-nums">
                                {myOutboundWishes.length}
                            </span>
                            {activeTab === 'outbound' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-amber-500 rounded-t-full" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* List Content */}
            <div className="flex-1 overflow-y-auto no-scrollbar bg-slate-50 w-full">
                <div className="max-w-md mx-auto p-4 pb-24 h-full">
                     {activeTab === 'active' ? (
                         <WishCardList 
                            wishes={myActiveWishes} 
                            currentUserId={currentUserId} 
                            emptyMessage="現在、募集中のお願いはありません。"
                            subtitle="OPEN REQUESTS"
                         />
                     ) : (
                         <WishCardList 
                            wishes={myOutboundWishes} 
                            currentUserId={currentUserId} 
                            emptyMessage="現在、誰かが手伝ってくれている案件はありません。"
                            subtitle="IN PROGRESS"
                         />
                     )}
                </div>
            </div>

            {renderModals()}
        </div>
    );
};