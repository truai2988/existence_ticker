import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useWishes } from '../hooks/useWishes';
import { WishCardList } from './WishCardList';
import { HeaderNavigation } from './HeaderNavigation';
import { CreateWishModal } from './CreateWishModal';
import { AppViewMode } from '../types';

interface RadianceViewProps {
    currentUserId: string;
    onTabChange?: (mode: AppViewMode) => void;
}

type TabType = 'active' | 'outbound' | 'past';
type ModalState = 'none' | 'create_wish';

export const RadianceView: React.FC<RadianceViewProps> = ({ currentUserId, onTabChange }) => {
    const { 
        userActiveWishes, 
        userArchiveWishes,
        loadUserArchive,
        userArchiveHasMore
    } = useWishes();
    
    const [activeTab, setActiveTab] = useState<TabType>('active');
    const [modalState, setModalState] = useState<ModalState>('create_wish');
    
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
        <div className="flex-1 flex flex-col w-full h-full">
            {/* View Title Area (Subtle) */}
            <div className="bg-white/50 border-b border-slate-100">
                <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div>
                        <h2 className="text-sm font-bold tracking-widest uppercase text-slate-400">
                            自分の願ったこと
                        </h2>
                        <p className="text-xs text-slate-300 font-mono tracking-[0.2em] uppercase">My Wishes</p>
                    </div>
                    <div className="flex items-center gap-2">
                        {onTabChange && (
                            <div className="shrink-0 ml-1">
                                <HeaderNavigation 
                                    currentTab="give" 
                                    onTabChange={(tab: AppViewMode) => onTabChange(tab)} 
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Tab Navigation (Subtle Flat Design) */}
            <div className="bg-blue-50/20">
                <div className="max-w-2xl mx-auto px-6 py-2 flex items-center gap-6 overflow-x-auto no-scrollbar relative min-h-[44px]">
                    <button 
                        onClick={() => setModalState(modalState === 'create_wish' ? 'none' : 'create_wish')}
                        className={`relative py-2 text-xs font-bold transition-all shrink-0 focus:outline-none ${
                            modalState === 'create_wish'
                                ? 'text-indigo-800' 
                                : 'text-slate-400 hover:text-slate-500'
                        }`}
                    >
                        <span>新規作成</span>
                        {modalState === 'create_wish' && (
                            <motion.div 
                                layoutId="radiance-tab-underline"
                                className="absolute -bottom-2 left-0 right-0 h-0.5 bg-indigo-500 rounded-full"
                            />
                        )}
                    </button>

                    <button
                        onClick={() => { setActiveTab('active'); setModalState('none'); }}
                        className={`relative py-2 text-xs font-bold transition-all shrink-0 focus:outline-none ${
                            activeTab === 'active' && modalState !== 'create_wish'
                                ? 'text-blue-800' 
                                : myActiveWishes.length === 0 ? 'text-slate-200' : 'text-slate-400 hover:text-slate-500'
                        }`}
                    >
                        募集中 ({myActiveWishes.length})
                        {activeTab === 'active' && modalState !== 'create_wish' && (
                            <motion.div 
                                layoutId="radiance-tab-underline"
                                className="absolute -bottom-2 left-0 right-0 h-0.5 bg-blue-500 rounded-full"
                            />
                        )}
                    </button>

                    <button
                        onClick={() => { setActiveTab('outbound'); setModalState('none'); }}
                        className={`relative py-2 text-xs font-bold transition-all shrink-0 focus:outline-none ${
                            activeTab === 'outbound' && modalState !== 'create_wish'
                                ? 'text-emerald-800' 
                                : myOutboundWishes.length === 0 ? 'text-slate-200' : 'text-slate-400 hover:text-slate-500'
                        }`}
                    >
                        進行中 ({myOutboundWishes.length})
                        {activeTab === 'outbound' && modalState !== 'create_wish' && (
                            <motion.div 
                                layoutId="radiance-tab-underline"
                                className="absolute -bottom-2 left-0 right-0 h-0.5 bg-emerald-500 rounded-full"
                            />
                        )}
                    </button>
                    
                    <button
                        onClick={() => { setActiveTab('past'); setModalState('none'); }}
                        className={`relative py-2 text-xs font-bold transition-all shrink-0 focus:outline-none ${
                            activeTab === 'past' && modalState !== 'create_wish'
                                ? 'text-slate-700' 
                                : myPastWishes.length === 0 ? 'text-slate-200' : 'text-slate-400 hover:text-slate-500'
                        }`}
                    >
                        過去の記録 ({myPastWishes.length})
                        {activeTab === 'past' && modalState !== 'create_wish' && (
                            <motion.div 
                                layoutId="radiance-tab-underline"
                                className="absolute -bottom-2 left-0 right-0 h-0.5 bg-slate-400 rounded-full"
                            />
                        )}
                    </button>
                </div>
            </div>

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