import React, { useState } from 'react';
import { ClipboardList, Menu, Plus, X } from "lucide-react";
import { PREFECTURES } from '../data/prefectures';
import { useWishes } from '../hooks/useWishes';
import { useLocationData } from '../hooks/useLocationData';
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
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedPrefecture, setSelectedPrefecture] = useState("");
    const [selectedCity, setSelectedCity] = useState("");
    const { cities } = useLocationData(selectedPrefecture);

    // Reset city when prefecture changes
    React.useEffect(() => {
        setSelectedCity("");
    }, [selectedPrefecture]);

    // Explore (Active Global Feed)
    const exploreWishes = wishes.filter(w => {
        if (w.status !== 'open') return false;
        if (selectedPrefecture && w.requester_prefecture !== selectedPrefecture) return false;
        if (selectedCity && w.requester_city !== selectedCity) return false;
        if (w.applicants && w.applicants.some(a => a.id === currentUserId)) return false;
        const startMs = getMillis(w.created_at);
        const elapsedSec = ((Date.now() - startMs) / 1000) | 0;
        const currentValue = fromMilli(calculateDecayedValue(toMilli(w.cost || 0), elapsedSec));
        if ((w.cost || 0) > 0 && currentValue <= 0) return false;
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
            <div className="flex-1 overflow-y-auto no-scrollbar w-full transition-colors duration-500" data-scroll-container>
                <div className="max-w-2xl mx-auto w-full px-6 py-6 pb-safe-offset-24 relative space-y-6">

                    {/* ─── フィルター ＋ 新規作成ボタン ─── */}
                    <div className="pt-2 px-1 flex items-center justify-between gap-3">

                        {/* 新規作成ボタン（左） */}
                        <button
                            onClick={() => setIsFormOpen(true)}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-amber-900/90 text-white text-xs font-bold tracking-wide shadow-md shadow-amber-900/20 hover:bg-amber-900 active:scale-95 transition-all shrink-0"
                        >
                            <Plus size={14} strokeWidth={2.5} />
                            新規作成
                        </button>

                        {/* 地域フィルター（右寄せ） */}
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <select
                                    value={selectedPrefecture}
                                    onChange={(e) => setSelectedPrefecture(e.target.value)}
                                    className="appearance-none bg-transparent border-b border-slate-300/60 text-slate-700/80 text-xs font-serif tracking-widest pl-2 pr-5 py-1 focus:outline-none focus:border-amber-500/50 transition-colors cursor-pointer w-auto"
                                >
                                    <option value="">すべての空の下</option>
                                    {PREFECTURES.map(pref => (
                                        <option key={pref} value={pref}>{pref}</option>
                                    ))}
                                </select>
                                <svg className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                            </div>

                            {selectedPrefecture && (
                                <div className="relative animate-in fade-in slide-in-from-right-4 duration-300">
                                    <select
                                        value={selectedCity}
                                        onChange={(e) => setSelectedCity(e.target.value)}
                                        className="appearance-none bg-transparent border-b border-slate-300/60 text-slate-700/80 text-xs font-serif tracking-widest pl-2 pr-5 py-1 focus:outline-none focus:border-amber-500/50 transition-colors cursor-pointer w-auto"
                                    >
                                        <option value="">（市区町村エリア）</option>
                                        {cities.map(city => (
                                            <option key={city} value={city}>{city}</option>
                                        ))}
                                    </select>
                                    <svg className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ─── 新規作成モーダル ─── */}
                    {isFormOpen && (
                        <div
                            className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-6"
                            onClick={() => setIsFormOpen(false)}
                        >
                            {/* モーダル本体: flex-col で上下分割 */}
                            <div
                                className="bg-white w-full max-w-xl rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl flex flex-col max-h-[90vh]"
                                onClick={e => e.stopPropagation()}
                            >
                                {/* ヘッダー（スクロール外・shrink-0） */}
                                <div className="shrink-0 flex items-center justify-between px-6 pt-5 pb-3 border-b border-slate-100">
                                    <h3 className="text-base font-bold text-slate-900" style={{ fontFamily: "'Noto Serif JP', serif" }}>新しい願いを綴る</h3>
                                    <button
                                        onClick={() => setIsFormOpen(false)}
                                        className="p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>
                                {/* フォーム本体（スクロール領域） */}
                                <div className="flex-1 overflow-y-auto no-scrollbar px-6 pb-8">
                                    <WishInputForm onSuccess={() => setIsFormOpen(false)} />
                                </div>
                            </div>
                        </div>
                    )}

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
