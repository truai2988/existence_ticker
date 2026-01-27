import React, { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { X, Megaphone } from 'lucide-react';
import { useWishes } from '../hooks/useWishes';
import { WishCardList } from './WishCardList';

import { CreateWishModal } from './CreateWishModal';
// import { DonationModal } from './DonationModal'; // Removed unused import
import { CompleteWishModal } from './CompleteWishModal';
// import { useScanProcessor } from '../hooks/useScanProcessor'; // Removed unused import
import { PendingWish } from '../types';

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
    
    // Unused state removed to fix build error
    // const [recipient, setRecipient] = useState<{ id: string, name: string } | null>(null);
    // const [targetWish, setTargetWish] = useState<PendingWish | null>(null);
    
    // Scan processor reserved for settlement logic if needed, but primary scan is now in GiftView

    // Filter Logic
    // 1. My Active Stars (My Open Requests)
    const myActiveWishes = wishes.filter(w => 
        w.requester_id === currentUserId && w.status === 'open'
    );
    // 2. Outbound Contracts (My In-Progress Requests)
    const myOutboundWishes = wishes.filter(w => 
        w.requester_id === currentUserId && w.status !== 'open'
    );

    const renderModals = () => {
        return (
            <AnimatePresence>
                {/* Create Wish */}
                {modalState === 'create_wish' && (
                    <CreateWishModal onClose={() => setModalState('none')} />
                )}

                {/* Settle Wish - Logic placeholder, currently unreachable so vars removed
                 {modalState === 'settle_wish' && recipient && targetWish && (
                    <CompleteWishModal
                        wishTitle={targetWish.title}
                        helperName={recipient.name}
                        preset={targetWish.preset}
                        cost={targetWish.cost}
                        onConfirm={() => {
                            alert('感謝を伝えました: 報酬が支払われました');
                            setModalState('none');
                        }}
                        onCancel={() => setModalState('none')}
                    />
                )}
                */}
            </AnimatePresence>
        );
    };

    return (
        <div className="fixed inset-0 z-[60] bg-slate-50/95 backdrop-blur-md animate-fade-in flex flex-col pt-safe">
            {/* Header */}
            <div className="p-4 shrink-0 bg-white/50 border-b border-slate-100">
                <div className="flex justify-between items-center mb-4">
                    <div>
                         <h2 className="text-xl font-bold font-sans text-slate-900">自分のお願い</h2>
                         <p className="text-xs text-slate-500 font-mono tracking-widest uppercase">My Wishes Hub</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                        <X className="text-slate-500" />
                    </button>
                </div>

                {/* UNIFIED CONTAINER: The "Wish Box" */}
                <div className="bg-amber-50/50 rounded-3xl border border-amber-100/50 p-1 shadow-sm overflow-hidden relative">
                    
                    {/* 1. Main Action Button (Top) */}
                    <div className="p-4 pb-2">
                        <button 
                            onClick={() => setModalState('create_wish')}
                            className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-400 flex items-center justify-center gap-3 text-white shadow-lg shadow-orange-200 hover:shadow-orange-300 transition-all active:scale-[0.98]"
                        >
                            <Megaphone className="text-white" size={24} />
                            <span className="text-lg font-bold tracking-wide">新しいお願いを伝える</span>
                        </button>
                    </div>

                    {/* 2. Status Tabs (Bottom - Connected) */}
                    <div className="flex gap-1 p-1 bg-white/40 rounded-b-2xl mx-1 mb-1">
                        <button
                            onClick={() => setActiveTab('active')}
                            className={`flex-1 py-3 text-xs font-bold rounded-xl transition-all flex flex-col items-center gap-1 ${
                                activeTab === 'active' ? 'bg-white text-amber-700 shadow-sm ring-1 ring-amber-100' : 'text-slate-400 hover:text-amber-600 hover:bg-white/50'
                            }`}
                        >
                            <span>募集中のお願い</span>
                            <span className="text-[10px] font-mono opacity-80 bg-amber-100/50 px-2 py-0.5 rounded-full text-amber-800">{myActiveWishes.length}</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('outbound')}
                            className={`flex-1 py-3 text-xs font-bold rounded-xl transition-all flex flex-col items-center gap-1 ${
                                activeTab === 'outbound' ? 'bg-white text-amber-700 shadow-sm ring-1 ring-amber-100' : 'text-slate-400 hover:text-amber-600 hover:bg-white/50'
                            }`}
                        >
                            <span>手伝ってもらい中</span>
                            <span className="text-[10px] font-mono opacity-80 bg-amber-100/50 px-2 py-0.5 rounded-full text-amber-800">{myOutboundWishes.length}</span>
                        </button>
                    </div>

                </div>
            </div>

            {/* List Content */}
            <div className="flex-1 overflow-y-auto no-scrollbar p-4 pb-24 bg-slate-50">
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

            {renderModals()}
        </div>
    );
};