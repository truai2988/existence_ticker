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

type TabType = 'active' | 'outbound';
type ModalState = 'none' | 'create_wish';

export const RadianceView: React.FC<RadianceViewProps> = ({ currentUserId, onTabChange }) => {
    const { 
        userActiveWishes
    } = useWishes();
    
    const [activeTab, setActiveTab] = useState<TabType>('active');
    const [modalState, setModalState] = useState<ModalState>('none');
    const [hasInitialized, setHasInitialized] = useState(false);

    // Filter Logic
    const myActiveWishes = userActiveWishes.filter(w => w.status === 'open');
    const myOutboundWishes = userActiveWishes.filter(w => (w.status === 'in_progress' || w.status === 'review_pending'));

    // Auto-select leftmost non-empty tab
    React.useEffect(() => {
        if (!hasInitialized && userActiveWishes.length > 0) {
            if (myActiveWishes.length > 0) {
                setActiveTab('active');
                setModalState('none');
            } else if (myOutboundWishes.length > 0) {
                setActiveTab('outbound');
                setModalState('none');
            }
            setHasInitialized(true);
        } else if (!hasInitialized && userActiveWishes.length === 0) {
            // Default to 'create_wish' if everything is empty
            setModalState('create_wish');
            setHasInitialized(true);
        }
    }, [userActiveWishes, myActiveWishes, myOutboundWishes, hasInitialized]);


    const handleActionComplete = (action: string) => {
        if (action === 'approved') setActiveTab('outbound');
        else if (action === 'completed' || action === 'cleanup' || action === 'withdrawn') setActiveTab('active');
    };

    return (
        <div className="flex-1 flex flex-col w-full h-full">
            {/* View Title Area (Subtle) */}
            <div className="border-b border-slate-100/50">
                <div className="max-w-2xl mx-auto px-6 py-4 md:py-6 flex items-center justify-between flex-nowrap gap-2">
                    <div className="min-w-0">
                        <div className="text-[10px] sm:text-xs font-light tracking-[0.4em] uppercase text-slate-300 leading-none mb-3 select-none">
                            Existence Ticker
                        </div>
                        <h2 className="text-lg min-[375px]:text-xl font-bold tracking-widest uppercase text-slate-900 truncate">
                            自分の願ったこと
                        </h2>
                        <p className="text-xs min-[375px]:text-sm text-slate-500 font-mono tracking-[0.2em] uppercase mt-1 truncate">My Wishes</p>
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
                <div className="max-w-2xl mx-auto px-6 flex items-center gap-6 overflow-x-auto no-scrollbar relative min-h-[52px]">
                    <button 
                        onClick={() => setModalState(modalState === 'create_wish' ? 'none' : 'create_wish')}
                        className={`relative py-3 text-sm font-bold transition-all shrink-0 focus:outline-none ${
                            modalState === 'create_wish'
                                ? 'text-indigo-800' 
                                : 'text-slate-400 hover:text-slate-500'
                        }`}
                    >
                        <span>新規作成</span>
                        {modalState === 'create_wish' && (
                            <motion.div 
                                layoutId="radiance-tab-underline"
                                className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-full"
                            />
                        )}
                    </button>

                    <button
                        onClick={() => { setActiveTab('active'); setModalState('none'); }}
                        className={`relative py-3 text-sm font-bold transition-all shrink-0 focus:outline-none ${
                            activeTab === 'active' && modalState !== 'create_wish'
                                ? 'text-blue-800' 
                                : myActiveWishes.length === 0 ? 'text-slate-200' : 'text-slate-400 hover:text-slate-500'
                        }`}
                    >
                        募集中 ({myActiveWishes.length})
                        {activeTab === 'active' && modalState !== 'create_wish' && (
                            <motion.div 
                                layoutId="radiance-tab-underline"
                                className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-full"
                            />
                        )}
                    </button>

                    <button
                        onClick={() => { setActiveTab('outbound'); setModalState('none'); }}
                        className={`relative py-3 text-sm font-bold transition-all shrink-0 focus:outline-none ${
                            activeTab === 'outbound' && modalState !== 'create_wish'
                                ? 'text-emerald-800' 
                                : myOutboundWishes.length === 0 ? 'text-slate-200' : 'text-slate-400 hover:text-slate-500'
                        }`}
                    >
                        進行中 ({myOutboundWishes.length})
                        {activeTab === 'outbound' && modalState !== 'create_wish' && (
                            <motion.div 
                                layoutId="radiance-tab-underline"
                                className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500 rounded-full"
                            />
                        )}
                    </button>
                    
                </div>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar bg-blue-50/20 w-full transition-colors duration-500">
                <div className="max-w-2xl mx-auto w-full px-6 py-4 pb-24 relative space-y-4">
                     {modalState === 'create_wish' ? (
                         <CreateWishModal onClose={() => setModalState('none')} />
                     ) : (
                         <div className="flex flex-col gap-4">
                             <WishCardList 
                                wishes={activeTab === 'active' ? myActiveWishes : myOutboundWishes} 
                                currentUserId={currentUserId} 
                                viewType="radiance"
                                emptyMessage="活動記録はありません。"
                                onActionComplete={handleActionComplete}
                                onTabChange={onTabChange}
                             />
                         </div>
                     )}
                </div>
            </div>
        </div>
    );
};