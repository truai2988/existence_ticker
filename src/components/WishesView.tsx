import React, { useState } from 'react';
import { ClipboardList, Menu } from "lucide-react";
import { useWishes } from '../hooks/useWishes';
import { calculateDecayedValue, getMillis, toMilli, fromMilli } from '../logic/worldPhysics';
import { WishCardList } from './WishCardList';
import { WishInputForm } from './WishInputForm';
import { AppViewMode } from '../types';
import { SideDrawer } from './SideDrawer';
import { useLanguage } from '../contexts/LanguageContext';

interface WishesViewProps {
    currentUserId: string;
    onOpenProfile?: () => void;
    onTabChange?: (mode: AppViewMode) => void;
    onOpenOnboarding?: () => void;
}

export const WishesView: React.FC<WishesViewProps> = ({ currentUserId, onOpenProfile, onTabChange, onOpenOnboarding }) => {
    const { wishes } = useWishes();
    const { t: MESSAGES } = useLanguage();
    
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    // Explore (Active Global Feed)
    const exploreWishes = wishes.filter(w => {
        if (w.status !== 'open') return false;
        if (w.applicants && w.applicants.some(a => a.id === currentUserId)) return false;
        const startMs = getMillis(w.created_at);
        const elapsedSec = ((Date.now() - startMs) / 1000) | 0;
        const currentValue = fromMilli(calculateDecayedValue(toMilli(w.cost || 0), elapsedSec));
        if (currentValue <= 0) return false;
        return true;
    });

    return (
        <div className="flex-1 flex flex-col w-full h-full animate-fade-in group/flow">
            {/* Header */}
            <div className="pt-safe w-full sticky top-0 z-30 bg-[#F9F8F4]/80 backdrop-blur-md border-b border-slate-200/50 shadow-sm shadow-slate-100/50">
                <div className="w-full max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
                     <div className="flex items-center gap-3 min-w-0">
                        {/* Logo: ホームへ戻るボタン */}
                        <button
                            onClick={() => onTabChange?.('home')}
                            aria-label={MESSAGES.LAYOUT.RETURN_HOME}
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
                            <h2 className="text-xl font-serif font-medium text-slate-900 truncate leading-tight uppercase" style={{fontFamily: "'Noto Serif JP', serif"}}>{MESSAGES.HOME.BTN_REQUEST}</h2>
                        </div>
                    </div>
                    <div className="flex h-12 items-center gap-3 shrink-0">
                        <button
                          onClick={() => setIsDrawerOpen(true)}
                          className="p-3 -mr-3 text-slate-700 hover:text-slate-900 transition-colors active:scale-95"
                          aria-label={MESSAGES.LAYOUT.OPEN_MENU}
                        >
                          <Menu size={24} strokeWidth={1.5} />
                        </button>
                    </div>
                </div>
            </div>

            <SideDrawer
              isOpen={isDrawerOpen}
              onClose={() => setIsDrawerOpen(false)}
              currentTab="wishes"
              onTabChange={(tab: AppViewMode) => onTabChange?.(tab)}
              onOpenOnboarding={onOpenOnboarding || (() => {})}
            />
            
            {/* Content Container */}
            <div className="flex-1 overflow-y-auto no-scrollbar w-full transition-colors duration-500">
                <div className="max-w-2xl mx-auto w-full px-6 py-6 pb-24 relative space-y-6">
                    
                    {/* Inline Input Form */}
                    <div className="bg-[#F9F8F4] -mx-6 px-6 -mt-6 pt-6 pb-4 border-b border-white/20 sticky top-0 z-20 shadow-sm shadow-slate-200/20">
                        <WishInputForm />
                    </div>

                    <div className="pt-2">
                        <WishCardList 
                            wishes={exploreWishes} 
                            currentUserId={currentUserId}
                            viewType="flow"
                            emptyMessage={MESSAGES.FLOW.EMPTY_EXPLORE}
                            emptyIcon={<ClipboardList size={48} className="text-slate-700 mb-2" />}
                            onOpenProfile={onOpenProfile}
                            onActionComplete={() => {}}
                            onTabChange={onTabChange}
                        />
                    </div>

                </div>
            </div>
        </div>
    );
};
