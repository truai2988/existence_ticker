import React, { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { X, Megaphone, ChevronRight } from 'lucide-react';
import { useWishes } from '../hooks/useWishes';
import { WishCardList } from './WishCardList';
import { UserSubBar } from './UserSubBar';


import { CreateWishModal } from './CreateWishModal';

interface RadianceViewProps {
    onClose: () => void;
    currentUserId: string;
}

type TabType = 'active' | 'outbound' | 'past';
type ModalState = 'none' | 'create_wish';

export const RadianceView: React.FC<RadianceViewProps> = ({ onClose, currentUserId }) => {
    const { 
        userActiveWishes, 
        userArchiveWishes,
        loadUserArchive,
        userArchiveHasMore
    } = useWishes();
    
    const [activeTab, setActiveTab] = useState<TabType>('active');
    const [modalState, setModalState] = useState<ModalState>('none');
    
    const [isArchiveLoading, setIsArchiveLoading] = useState(false);

    // Filter Logic (using Private Storage: userActiveWishes)
    // 1. My Active Stars (My Open Requests)
    const myActiveWishes = userActiveWishes.filter(w => 
        w.status === 'open'
    );
    // 2. Outbound Contracts (My In-Progress Requests)
    const myOutboundWishes = userActiveWishes.filter(w => 
        (w.status === 'in_progress' || w.status === 'review_pending')
    );
    // 3. Past Records (Fulfilled, Cancelled, Expired) -> Lazy Loaded from userArchiveWishes
    const myPastWishes = userArchiveWishes;

    // Rule of 10: Load Archive only when tab is 'past'
    React.useEffect(() => {
        if (activeTab === 'past') {
            loadUserArchive(true); // Initial Load
        }
    }, [activeTab, loadUserArchive]);

    const handleLoadMoreArchive = async () => {
        setIsArchiveLoading(true);
        await loadUserArchive(false);
        setIsArchiveLoading(false);
    };

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

    const handleActionComplete = (action: 'applied' | 'withdrawn' | 'approved' | 'cancelled' | 'resigned' | 'completed' | 'cleanup') => {
        if (action === 'approved') {
            setActiveTab('outbound');
        } else if ((action === 'cancelled' && activeTab === 'outbound') || action === 'completed' || action === 'cleanup') {
            setActiveTab('past');
        }
    };

    return (
        <div className="fixed inset-0 z-[60] bg-slate-50/95 backdrop-blur-md flex flex-col w-full h-full">
            {/* Header Container */}
            <div className="w-full bg-white/80 backdrop-blur-md border-b border-slate-200 shrink-0 pt-safe">
                <div className="max-w-md mx-auto px-6 h-[90px] flex flex-col justify-start pt-3">
                    <div className="flex justify-between items-center w-full mb-2">
                        <div>
                             <h2 className="text-lg font-bold font-sans text-slate-900">自分のお願い</h2>
                        </div>
                        <div className="flex items-center gap-3">
                            <button 
                                onClick={() => setModalState('create_wish')}
                                className="flex items-center gap-2 px-4 h-9 bg-amber-500 text-white rounded-full text-xs font-bold hover:bg-amber-600 transition-all shadow-sm active:scale-95 border border-transparent"
                            >
                                <Megaphone size={14} className="fill-white/20" />
                                <span>新規作成</span>
                            </button>
                            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                                <X size={20} className="text-slate-400" />
                            </button>
                        </div>
                    </div>

                {/* Bottom Row: Tabs */}
                <div className="flex items-end w-full overflow-hidden">
                    {/* Simple Tabs */}
                    <div className="flex gap-2 pb-0.5 w-full justify-between sm:justify-start sm:gap-6">
                        <button
                            onClick={() => setActiveTab('active')}
                            className={`pb-1 text-[11px] font-bold transition-all relative ${
                                activeTab === 'active' ? 'text-amber-600' : 'text-slate-400 hover:text-slate-600'
                            }`}
                        >
                            募集中
                            <span className="ml-1 bg-amber-100/50 text-amber-700 px-1 py-0.5 rounded-full text-[11px] tabular-nums">
                                {myActiveWishes.length}
                            </span>
                            {activeTab === 'active' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-amber-500 rounded-t-full" />}
                        </button>
                        
                        <div className="flex items-center pb-2">
                            <ChevronRight size={14} className="text-slate-300" />
                        </div>

                        <button
                            onClick={() => setActiveTab('outbound')}
                            className={`pb-1 text-[11px] font-bold transition-all relative ${
                                activeTab === 'outbound' ? 'text-amber-600' : 'text-slate-400 hover:text-slate-600'
                            }`}
                        >
                            進行中
                            <span className="ml-1 bg-slate-100 text-slate-600 px-1 py-0.5 rounded-full text-[11px] tabular-nums">
                                {myOutboundWishes.length}
                            </span>
                            {activeTab === 'outbound' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-amber-500 rounded-t-full" />}
                        </button>

                        <div className="flex items-center pb-2">
                            <ChevronRight size={14} className="text-slate-300" />
                        </div>

                        <button
                            onClick={() => setActiveTab('past')}
                            className={`pb-1 text-[11px] font-bold transition-all relative ${
                                activeTab === 'past' ? 'text-amber-600' : 'text-slate-400 hover:text-slate-600'
                            }`}
                        >
                            過去の記録
                            <span className="ml-1 bg-slate-100 text-slate-600 px-1 py-0.5 rounded-full text-[11px] tabular-nums">
                                {myPastWishes.length}
                            </span>
                            {activeTab === 'past' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-amber-500 rounded-t-full" />}
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <UserSubBar />

            {/* List Content */}
            <div className="flex-1 overflow-y-auto no-scrollbar bg-slate-50 w-full">
                <div className="max-w-md mx-auto px-6 py-4 pb-24 h-full">
                     {activeTab === 'active' ? (
                         <WishCardList 
                            wishes={myActiveWishes} 
                            currentUserId={currentUserId} 
                            emptyMessage="現在、募集中のお願いはありません。"
                            onActionComplete={handleActionComplete}
                         />
                     ) : activeTab === 'outbound' ? (
                         <WishCardList 
                            wishes={myOutboundWishes} 
                            currentUserId={currentUserId} 
                            emptyMessage="現在、誰かが手伝ってくれている案件はありません。"
                            onActionComplete={handleActionComplete}
                         />
                     ) : (
                         <div className="flex flex-col gap-4">
                             <WishCardList 
                                wishes={myPastWishes} 
                                currentUserId={currentUserId} 
                                emptyMessage="過去の記録はありません。"
                                onActionComplete={handleActionComplete}
                             />
                             {/* Load More Button */}
                             {userArchiveHasMore && (
                                <button 
                                    onClick={handleLoadMoreArchive}
                                    disabled={isArchiveLoading}
                                    className="w-full py-3 text-xs font-bold text-slate-500 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors disabled:opacity-50"
                                >
                                    {isArchiveLoading ? "読み込み中..." : "さらに読み込む"}
                                </button>
                             )}
                         </div>
                     )}
                </div>
            </div>

            {renderModals()}
        </div>
    );
};