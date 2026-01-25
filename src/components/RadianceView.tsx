import React, { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { X, Send, Type } from 'lucide-react';
import { useWishes } from '../hooks/useWishes';
import { WishCardList } from './WishCardList';

import { CreateWishModal } from './CreateWishModal';
import { ScannerView } from './ScannerView';
import { DonationModal } from './DonationModal';
import { CompleteWishModal } from './CompleteWishModal';
import { useScanProcessor } from '../hooks/useScanProcessor';
import { PendingWish } from '../types';

interface RadianceViewProps {
    onClose: () => void;
    currentUserId: string;
}

type TabType = 'active' | 'outbound';

// Sub-states for modal handling
type ModalState = 'none' | 'create_wish' | 'scan' | 'gift_amount' | 'settle_wish';

export const RadianceView: React.FC<RadianceViewProps> = ({ onClose, currentUserId }) => {
    const { wishes } = useWishes();
    // const { acceptWish } = useWishActions(); // No longer needed for list
    
    // UI State
    const [activeTab, setActiveTab] = useState<TabType>('active');
    const [modalState, setModalState] = useState<ModalState>('none');
    const [recipient, setRecipient] = useState<{ id: string, name: string } | null>(null);
    const [targetWish, setTargetWish] = useState<PendingWish | null>(null);
    
    const { processScan } = useScanProcessor();

    // Filter Logic
    // 1. My Active Stars (I requested, Status is Open)
    const myActiveWishes = wishes.filter(w => 
        w.requester_id === currentUserId && w.status === 'open'
    );
    // 2. Outbound Contracts (I requested, Status is In Progress or Fulfilled)
    //    Someone is helping me.
    const myOutboundWishes = wishes.filter(w => 
        w.requester_id === currentUserId && w.status !== 'open'
    );

    // Handlers
    // Handlers
    // Handlers


    const handleScanResult = async (scannedId: string) => {
        setModalState('none'); // Close scanner first
        const result = await processScan(scannedId);
        
        setRecipient(result.user);
        
        if (result.type === 'settle_wish' && result.wish) {
            setTargetWish(result.wish);
            setModalState('settle_wish');
        } else {
            setModalState('gift_amount');
        }
    };

    // Modal Components Renderers
    const renderModals = () => {
        return (
            <AnimatePresence>
                {/* Create Wish */}
                {modalState === 'create_wish' && (
                    <CreateWishModal onClose={() => setModalState('none')} />
                )}

                {/* Scan */}
                {modalState === 'scan' && (
                    <div className="fixed inset-0 z-[60] bg-slate-50">
                        <ScannerView 
                            onClose={() => setModalState('none')}
                            onScan={handleScanResult}
                        />
                        </div>
                )}

                {/* Gift Amount */}
                {modalState === 'gift_amount' && recipient && (
                    <DonationModal
                        targetUserName={recipient.name}
                        onSelectAmount={(amount) => {
                            alert(`Sent ${amount} to ${recipient.id}`);
                            setModalState('none');
                        }}
                        onCancel={() => setModalState('none')} 
                    />
                )}

                {/* Settle Wish */}
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
            </AnimatePresence>
        );
    };

    return (
        <div className="fixed inset-0 z-[60] bg-slate-50/95 backdrop-blur-md animate-fade-in flex flex-col pt-safe">
            {/* Header */}
            <div className="p-4 border-b border-slate-200 shrink-0 bg-white/50">
                <div className="flex justify-between items-center mb-4">
                    <div>
                         <h2 className="text-xl font-bold font-sans text-slate-900">依頼する</h2>
                         <p className="text-xs text-slate-500 font-mono tracking-widest uppercase">Request & Pay</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                        <X className="text-slate-500" />
                    </button>
                </div>

                {/* Primary Actions (Energy Output) */}
                <div className="grid grid-cols-2 gap-3 mb-2">
                    <button 
                        onClick={() => setModalState('create_wish')}
                        className="py-3 rounded-xl bg-amber-50 border border-amber-200 flex flex-col items-center justify-center gap-1 hover:bg-amber-100 transition-all group shadow-sm active:scale-[0.98]"
                    >
                         <Type className="text-amber-500 group-hover:scale-110 transition-transform" size={20} />
                         <span className="text-xs font-bold text-amber-700">お願いを伝える</span>
                    </button>

                    <button 
                        onClick={() => setModalState('scan')}
                         className="py-3 rounded-xl bg-blue-50 border border-blue-200 flex flex-col items-center justify-center gap-1 hover:bg-blue-100 transition-all group shadow-sm active:scale-[0.98]"
                    >
                         <Send className="text-blue-500 group-hover:scale-110 transition-transform" size={20} />
                         <span className="text-xs font-bold text-blue-700">Lmを贈る</span>
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
                    <button
                        onClick={() => setActiveTab('active')}
                        className={`flex-1 py-2 text-xs font-medium rounded-md transition-all ${
                            activeTab === 'active' ? 'bg-white text-slate-800 shadow-sm ring-1 ring-black/5' : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        依頼中 ({myActiveWishes.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('outbound')}
                        className={`flex-1 py-2 text-xs font-medium rounded-md transition-all ${
                            activeTab === 'outbound' ? 'bg-white text-slate-800 shadow-sm ring-1 ring-black/5' : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        進行中 ({myOutboundWishes.length})
                    </button>
                </div>
            </div>

            {/* Content List */}
            <div className="flex-1 overflow-y-auto no-scrollbar p-4 pb-24">
                 {activeTab === 'active' ? (
                     <WishCardList 
                        wishes={myActiveWishes} 
                        currentUserId={currentUserId} 
                        emptyMessage="現在、放流中の願いはありません。"
                        subtitle="MY STARS (OPEN)"
                     />
                 ) : (
                     <WishCardList 
                        wishes={myOutboundWishes} 
                        currentUserId={currentUserId} 
                        emptyMessage="進行中の外部委託はありません。"
                        subtitle="OUTBOUND CONTRACTS"
                     />
                 )}
            </div>

            {renderModals()}
        </div>
    );
};
