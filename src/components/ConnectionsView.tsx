import React, { useState } from 'react';
import { Menu } from 'lucide-react';
import { useWishes } from '../hooks/useWishes';
import { WishCardList } from './WishCardList';
import { AppViewMode } from '../types';
import { SideDrawer } from './SideDrawer';
import { useLanguage } from '../contexts/LanguageContext';
import { getMillis } from '../logic/worldPhysics';

interface ConnectionsViewProps {
    currentUserId: string;
    onTabChange?: (mode: AppViewMode) => void;
    onOpenOnboarding?: () => void;
}

export const ConnectionsView: React.FC<ConnectionsViewProps> = ({ currentUserId, onTabChange, onOpenOnboarding }) => {
    const { t: MESSAGES } = useLanguage();
    const { 
        userActiveWishes,
        involvedActiveWishes
    } = useWishes();
    
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    // Merge and deduplicate active connections
    const connections = React.useMemo(() => {
        const map = new Map();
        userActiveWishes.forEach(w => map.set(w.id, w));
        involvedActiveWishes.forEach(w => map.set(w.id, w));
        const merged = Array.from(map.values());
        // Sort historically (newest first based on creation time, or perhaps we want it based on last updated. We'll use created_at for consistency)
        return merged.sort((a, b) => getMillis(b.created_at) - getMillis(a.created_at));
    }, [userActiveWishes, involvedActiveWishes]);

    return (
        <div className="flex-1 flex flex-col w-full h-full relative group/connections">
            {/* Header */}
            <div className="pt-safe w-full sticky top-0 z-30 bg-[#F9F8F4]/80 backdrop-blur-md border-b border-slate-200/50 shadow-sm shadow-slate-100/50">
                <div className="w-full max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
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
                            <h2 className="text-xl font-serif font-medium text-slate-900 truncate leading-tight uppercase" style={{fontFamily: "'Noto Serif JP', serif"}}>{MESSAGES.HOME.BTN_RESPOND}</h2>
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
              currentTab="connections"
              onTabChange={(tab: AppViewMode) => onTabChange?.(tab)}
              onOpenOnboarding={onOpenOnboarding || (() => {})}
            />

            <div className="flex-1 overflow-y-auto no-scrollbar w-full transition-colors duration-500">
                <div className="max-w-2xl mx-auto w-full px-6 py-6 pb-24 relative space-y-4">
                     <div className="flex flex-col gap-4">
                         <WishCardList 
                            wishes={connections} 
                            currentUserId={currentUserId} 
                            viewType="radiance"
                            emptyMessage={MESSAGES.HOME.TXT_NO_HISTORY}
                            onActionComplete={() => {}}
                            onTabChange={onTabChange}
                         />
                     </div>
                </div>
            </div>
        </div>
    );
};
