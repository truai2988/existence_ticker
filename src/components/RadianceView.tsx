import React, { useState } from 'react';
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

    // Filter Logic
    const myActiveWishes = userActiveWishes.filter(w => w.status === 'open');
    const myOutboundWishes = userActiveWishes.filter(w => (w.status === 'in_progress' || w.status === 'review_pending'));
    const myPastWishes = userArchiveWishes;

    React.useEffect(() => {
        if (activeTab === 'past') {
            loadUserArchive(true);
        }
    }, [activeTab, loadUserArchive]);

    const handleLoadMoreArchive = async () => {
        setIsArchiveLoading(true);
        await loadUserArchive(false);
        setIsArchiveLoading(false);
    };

    const handleActionComplete = (action: string) => {
        if (action === 'approved') setActiveTab('outbound');
        else if (action === 'completed' || action === 'cleanup') setActiveTab('past');
    };

    return (
        <div className="fixed inset-0 z-[60] bg-slate-50 flex flex-col w-full h-full">
            {/* Header Container */}
            <div className="w-full bg-white/80 backdrop-blur-md border-b-2 border-blue-400 shrink-0 pt-safe shadow-sm">
                <div className="max-w-md mx-auto px-6 h-[110px] flex flex-col justify-between">
                    <div className="flex items-center justify-between w-full pt-3">
                        <div>
                            <h2 className="text-lg font-bold font-sans text-slate-900">自分の願ったこと</h2>
                        </div>
                        <div className="flex items-center gap-4">
                            <button 
                                onClick={() => setModalState(modalState === 'create_wish' ? 'none' : 'create_wish')}
                                className={`flex items-center justify-center gap-2 px-3.5 py-1.5 min-w-[124px] rounded-full text-xs font-bold transition-all shadow-sm active:scale-95 border focus:outline-none focus:ring-0 ${
                                    modalState === 'create_wish'
                                        ? 'bg-blue-600 text-white border-transparent'
                                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                }`}
                            >
                                <Megaphone size={14} className={modalState === 'create_wish' ? 'text-white/80' : 'text-slate-400'} />
                                <span>新規作成</span>
                            </button>
                            <button onClick={onClose} className="w-10 h-10 flex items-center justify-center hover:bg-slate-100 rounded-full transition-colors text-slate-400 focus:outline-none focus:ring-0">
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    <div className="flex items-end w-full overflow-hidden pb-2">
                        <div className="flex gap-1.5 pb-2 w-full justify-between sm:justify-start sm:gap-4">
                            <button
                                onClick={() => { setActiveTab('active'); setModalState('none'); }}
                                disabled={activeTab === 'active' && modalState !== 'create_wish'}
                                className={`px-3 py-1.5 text-xs font-bold transition-all whitespace-nowrap rounded-full flex items-center focus:outline-none focus:ring-0 ${
                                    activeTab === 'active' && modalState !== 'create_wish'
                                        ? 'bg-blue-100 text-blue-700 border border-blue-200 cursor-default pointer-events-none' 
                                        : 'text-slate-400 hover:bg-white hover:text-slate-600 cursor-pointer'
                                }`}
                            >
                                募集中
                                <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-xs tabular-nums ${
                                    activeTab === 'active' && modalState !== 'create_wish' ? 'bg-white/80 text-blue-700 shadow-sm' : 'bg-slate-100 text-slate-500'
                                }`}>
                                    {myActiveWishes.length}
                                </span>
                            </button>
                            <div className="flex items-center"><ChevronRight size={14} className="text-slate-300" /></div>
                            <button
                                onClick={() => { setActiveTab('outbound'); setModalState('none'); }}
                                disabled={activeTab === 'outbound' && modalState !== 'create_wish'}
                                className={`px-3 py-1.5 text-xs font-bold transition-all whitespace-nowrap rounded-full flex items-center focus:outline-none focus:ring-0 ${
                                    activeTab === 'outbound' && modalState !== 'create_wish'
                                        ? 'bg-blue-100 text-blue-700 border border-blue-200 cursor-default pointer-events-none' 
                                        : 'text-slate-400 hover:bg-white hover:text-slate-600 cursor-pointer'
                                }`}
                            >
                                進行中
                                <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-xs tabular-nums ${
                                    activeTab === 'outbound' && modalState !== 'create_wish' ? 'bg-white/80 text-blue-700 shadow-sm' : 'bg-slate-100 text-slate-500'
                                }`}>
                                    {myOutboundWishes.length}
                                </span>
                            </button>
                            <div className="flex items-center"><ChevronRight size={14} className="text-slate-300" /></div>
                            <button
                                onClick={() => { setActiveTab('past'); setModalState('none'); }}
                                disabled={activeTab === 'past' && modalState !== 'create_wish'}
                                className={`px-3 py-1.5 text-xs font-bold transition-all whitespace-nowrap rounded-full flex items-center focus:outline-none focus:ring-0 ${
                                    activeTab === 'past' && modalState !== 'create_wish'
                                        ? 'bg-slate-200 text-slate-700 border border-slate-300 cursor-default pointer-events-none' 
                                        : 'text-slate-400 hover:bg-white hover:text-slate-600 cursor-pointer'
                                }`}
                            >
                                過去の記録
                                <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-xs tabular-nums ${
                                    activeTab === 'past' && modalState !== 'create_wish' ? 'bg-white/80 text-slate-700 shadow-sm' : 'bg-slate-100 text-slate-500'
                                }`}>
                                    {myPastWishes.length}
                                </span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <UserSubBar />

            <div className="flex-1 overflow-y-auto no-scrollbar bg-blue-50/20 w-full transition-colors duration-500">
                <div className="max-w-md mx-auto px-6 py-4 pb-24 w-full">
                     {modalState === 'create_wish' ? (
                         <CreateWishModal onClose={() => setModalState('none')} />
                     ) : (
                         <div className="flex flex-col gap-4">
                             <WishCardList 
                                wishes={activeTab === 'active' ? myActiveWishes : activeTab === 'outbound' ? myOutboundWishes : myPastWishes} 
                                currentUserId={currentUserId} 
                                viewType="radiance"
                                emptyMessage="活動記録はありません。"
                                onActionComplete={handleActionComplete}
                             />
                             {activeTab === 'past' && userArchiveHasMore && (
                                <button onClick={handleLoadMoreArchive} disabled={isArchiveLoading} className="w-full py-3 text-xs font-bold text-slate-500 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors disabled:opacity-50">
                                    {isArchiveLoading ? "読み込み中..." : "さらに読み込む"}
                                </button>
                             )}
                         </div>
                     )}
                </div>
            </div>
        </div>
    );
};