import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useWishes } from '../hooks/useWishes';
import { WishCardList } from './WishCardList';
import { CreateWishModal } from './CreateWishModal';
import { AppViewMode } from '../types';
import { Menu } from 'lucide-react';
import { SideDrawer } from './SideDrawer';
import { useLanguage } from '../contexts/LanguageContext';

interface RadianceViewProps {
    currentUserId: string;
    onTabChange?: (mode: AppViewMode) => void;
    onOpenOnboarding?: () => void;
}

type TabType = 'active' | 'outbound';
type ModalState = 'none' | 'create_wish';

export const RadianceView: React.FC<RadianceViewProps> = ({ currentUserId, onTabChange, onOpenOnboarding }) => {
    const { t: MESSAGES } = useLanguage();
    const { 
        userActiveWishes
    } = useWishes();
    
    const [activeTab, setActiveTab] = useState<TabType>('active');
    const [modalState, setModalState] = useState<ModalState>('none');
    const [hasInitialized, setHasInitialized] = useState(false);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

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
        <div className="flex-1 flex flex-col w-full h-full relative">
            {/* Header */}
            <div className="pt-safe">
                <div className="max-w-2xl mx-auto px-6 py-4 md:py-6 flex items-center justify-between">
                     <div className="flex items-center gap-3 min-w-0">
                        {/* Logo: ホームへ戻るボタン */}
                        <button
                            onClick={() => onTabChange?.('home')}
                            aria-label={MESSAGES.HOME.ARIA_BACK_HOME}
                            className="shrink-0 focus:outline-none active:scale-95 transition-transform"
                        >
                            <img
                                src="/logo.png"
                                alt="Existence Ticker"
                                className="w-10 h-10 rounded-lg shadow-sm border border-slate-300/40 object-cover hover:opacity-80 transition-opacity"
                            />
                        </button>
                        {/* Text Group */}
                        <div className="flex flex-col min-w-0 justify-center">
                            <h2 className="text-xl sm:text-2xl font-light tracking-[0.2em] sm:tracking-[0.4em] text-slate-900 truncate leading-tight uppercase" style={{fontFamily: "'Noto Serif JP', serif"}}>{MESSAGES.HOME.LBL_WISH}</h2>
                        </div>
                    </div>
                    <div className="flex h-12 items-center gap-3 shrink-0">
                        <button
                          onClick={() => setIsDrawerOpen(true)}
                          className="p-3 -mr-3 text-slate-700 hover:text-slate-900 transition-colors active:scale-95"
                          aria-label={MESSAGES.HOME.ARIA_OPEN_MENU}
                        >
                          <Menu size={24} strokeWidth={1.5} />
                        </button>
                    </div>
                </div>
            </div>

            <SideDrawer
              isOpen={isDrawerOpen}
              onClose={() => setIsDrawerOpen(false)}
              currentTab="give"
              onTabChange={(tab: AppViewMode) => onTabChange?.(tab)}
              onOpenOnboarding={onOpenOnboarding || (() => {})}
            />

            {/* Tab Navigation (Premium Glassmorphism) */}
            <div className="bg-white/40 backdrop-blur-2xl border-b border-white/20 sticky top-0 z-30">
                <div className="max-w-2xl mx-auto px-6 flex items-center gap-8 overflow-x-auto no-scrollbar relative min-h-[52px]">
                    <button 
                        onClick={() => setModalState(modalState === 'create_wish' ? 'none' : 'create_wish')}
                        className={`relative py-3 text-sm font-bold transition-all shrink-0 focus:outline-none tracking-widest ${
                            modalState === 'create_wish'
                                ? 'text-amber-700' 
                                : 'text-slate-700 hover:text-slate-700'
                        }`}
                    >
                        <span>{MESSAGES.HOME.BTN_NEW_WISH}</span>
                        {modalState === 'create_wish' && (
                            <motion.div 
                                layoutId="radiance-tab-underline"
                                className="absolute bottom-0 left-0 right-0 h-[3px] bg-amber-400 rounded-full"
                            />
                        )}
                    </button>

                    <button
                        onClick={() => { setActiveTab('active'); setModalState('none'); }}
                        className={`relative py-3 text-sm font-bold transition-all shrink-0 focus:outline-none tracking-widest ${
                            activeTab === 'active' && modalState !== 'create_wish'
                                ? 'text-indigo-800' 
                                : myActiveWishes.length === 0 ? 'text-slate-700' : 'text-slate-700 hover:text-slate-700'
                        }`}
                    >
                        {MESSAGES.HOME.TAB_SEARCHING} <span className="text-xs opacity-90 ml-1">({myActiveWishes.length})</span>
                        {activeTab === 'active' && modalState !== 'create_wish' && (
                            <motion.div 
                                layoutId="radiance-tab-underline"
                                className="absolute bottom-0 left-0 right-0 h-[3px] bg-indigo-400 rounded-full"
                            />
                        )}
                    </button>

                    <button
                        onClick={() => { setActiveTab('outbound'); setModalState('none'); }}
                        className={`relative py-3 text-sm font-bold transition-all shrink-0 focus:outline-none tracking-widest ${
                            activeTab === 'outbound' && modalState !== 'create_wish'
                                ? 'text-emerald-800' 
                                : myOutboundWishes.length === 0 ? 'text-slate-700' : 'text-slate-700 hover:text-slate-700'
                        }`}
                    >
                        {MESSAGES.HOME.TAB_IN_PROGRESS} <span className="text-xs opacity-90 ml-1">({myOutboundWishes.length})</span>
                        {activeTab === 'outbound' && modalState !== 'create_wish' && (
                            <motion.div 
                                layoutId="radiance-tab-underline"
                                className="absolute bottom-0 left-0 right-0 h-[3px] bg-emerald-400 rounded-full"
                            />
                        )}
                    </button>
                    
                </div>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar w-full transition-colors duration-500">
                <div className="max-w-2xl mx-auto w-full px-6 py-6 pb-24 relative space-y-4">
                     {modalState === 'create_wish' ? (
                         <CreateWishModal onClose={() => setModalState('none')} />
                     ) : (
                         <div className="flex flex-col gap-4">
                             <WishCardList 
                                wishes={activeTab === 'active' ? myActiveWishes : myOutboundWishes} 
                                currentUserId={currentUserId} 
                                viewType="radiance"
                                emptyMessage={MESSAGES.HOME.TXT_NO_HISTORY}
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
