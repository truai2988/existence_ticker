import React, { useState } from 'react';
import { Home, History as HistoryIcon, User, Menu, X, Shield, Sprout, Edit2 } from 'lucide-react';
import { AppViewMode } from '../types';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuthHook';

interface HeaderNavigationProps {
    currentTab: AppViewMode;
    onTabChange: (tab: AppViewMode) => void;
    onOpenOnboarding?: () => void;
}

export const HeaderNavigation: React.FC<HeaderNavigationProps> = ({ currentTab, onTabChange, onOpenOnboarding }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { isAdmin } = useAuth();



    const handleTabChange = (tab: "home" | "history" | "profile") => {
        onTabChange(tab);
        setIsMenuOpen(false);
    };

    return (
        <>
            {/* Desktop: Icon Navigation (md以上) - Scaled for Tablet */}
            <nav className="hidden md:flex items-end gap-6 h-12">
                {/* PC Admin Entrance - Restricted to Profile Page, Far Left */}
                {/* Profile Actions Group (Admin & Edit) */}
                {(currentTab === "profile" || currentTab === "profile_edit") && (
                    <div className="flex items-end gap-2">
                        {/* PC Admin Entrance */}
                        {isAdmin && (
                            <button
                                onClick={() => onTabChange("admin")}
                                className={`px-2 pt-5 pb-0 transition-colors text-red-500 hover:text-red-700 animate-in fade-in duration-500`}
                                aria-label="管理コンソール"
                            >
                                <Shield size={28} strokeWidth={2} />
                            </button>
                        )}

                        {/* Profile Edit Action */}
                        {currentTab === "profile" && (
                            <button
                                onClick={() => onTabChange("profile_edit")}
                                className={`px-2 pt-5 pb-0 transition-colors text-slate-400 hover:text-slate-600 animate-in fade-in duration-300`}
                                aria-label="プロフィール編集"
                            >
                                <Edit2 size={28} strokeWidth={2} />
                            </button>
                        )}
                    </div>
                )}

                <button
                    onClick={onOpenOnboarding}
                    className="px-2 pt-5 pb-0 text-slate-400 hover:text-green-600 transition-colors"
                    aria-label="ガイド"
                    title="お裾分けの目安とお作法"
                >
                    <Sprout size={28} strokeWidth={2} />
                </button>

                <button
                    onClick={() => handleTabChange("home")}
                    className={`px-2 pt-5 pb-0 transition-colors ${
                        currentTab === "home" ? "text-slate-900" : "text-slate-600 hover:text-slate-800"
                    }`}
                    aria-label="ホーム"
                >
                    <Home size={28} strokeWidth={2} />
                </button>

                <button
                    onClick={() => handleTabChange("history")}
                    className={`px-2 pt-5 pb-0 transition-colors ${
                        currentTab === "history" ? "text-slate-900" : "text-slate-600 hover:text-slate-800"
                    }`}
                    aria-label="履歴"
                >
                    <HistoryIcon size={28} strokeWidth={2} />
                </button>

                <button
                    onClick={() => handleTabChange("profile")}
                    className={`px-2 pt-5 pb-0 transition-colors ${
                        currentTab === "profile" || currentTab === "profile_edit" ? "text-slate-900" : "text-slate-600 hover:text-slate-800"
                    }`}
                    aria-label="プロフィール"
                >
                    <User size={28} strokeWidth={2} />
                </button>

            </nav>

            {/* Mobile: Hamburger Menu & Sprout */}
            <div className="md:hidden flex items-center gap-3 relative z-50 h-full">
                 {/* Mobile Admin Entrance - Left of Edit/Menu */}
                 {isAdmin && (currentTab === "profile" || currentTab === "profile_edit") && !isMenuOpen && (
                    <button
                        onClick={() => onTabChange("admin")}
                        className="text-red-500 hover:text-red-700 transition-colors animate-in fade-in"
                        aria-label="管理コンソール"
                    >
                        <Shield size={24} strokeWidth={1.5} />
                    </button>
                )}

                 {/* Mobile Edit Action */}
                 {currentTab === "profile" && !isMenuOpen && (
                    <button
                        onClick={() => onTabChange("profile_edit")}
                        className="text-slate-400 hover:text-slate-600 transition-colors animate-in fade-in"
                        aria-label="プロフィール編集"
                    >
                        <Edit2 size={24} strokeWidth={1.5} />
                    </button>
                )}

                <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="p-1 -mr-1 text-slate-500 hover:text-slate-800 transition-colors scale-110"
                    aria-label="メニュー"
                >
                    {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>

                <AnimatePresence>
                    {isMenuOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute right-0 top-full mt-2 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-100 p-2 z-50 min-w-[200px] overflow-hidden"
                        >
                            {/* Brand Area in Popover */}
                            <div className="px-5 pt-5 pb-4 mb-2 border-b border-slate-50">
                                <div className="text-3xl font-light tracking-tighter text-slate-800 leading-none mb-1 font-['Inter']">
                                    ET
                                </div>
                                <div className="text-xs text-slate-400 font-light tracking-[0.4em] uppercase">
                                    Existence Ticker
                                </div>
                            </div>
                            
                            <button
                                onClick={() => {
                                    onOpenOnboarding?.();
                                    setIsMenuOpen(false);
                                }}
                                className="w-full px-5 py-3 text-left flex items-center gap-3 transition-colors rounded-xl text-slate-500 hover:bg-slate-50/50 hover:text-green-600"
                            >
                                <Sprout size={20} strokeWidth={2} />
                                <span className="text-sm tracking-[0.1em] font-light">ガイドをみる</span>
                            </button>
                            
                            <button
                                onClick={() => handleTabChange("home")}
                                className={`w-full px-5 py-3 text-left flex items-center gap-3 transition-colors rounded-xl ${
                                    currentTab === "home" ? "text-slate-900 bg-slate-50" : "text-slate-500 hover:bg-slate-50/50"
                                }`}
                            >
                                <Home size={20} strokeWidth={currentTab === "home" ? 2 : 1.5} />
                                <span className="text-sm tracking-[0.1em] font-light">ホーム</span>
                            </button>
                            <button
                                onClick={() => handleTabChange("history")}
                                className={`w-full px-5 py-3 text-left flex items-center gap-3 transition-colors rounded-xl ${
                                    currentTab === "history" ? "text-slate-900 bg-slate-50" : "text-slate-500 hover:bg-slate-50/50"
                                }`}
                            >
                                <HistoryIcon size={20} strokeWidth={currentTab === "history" ? 2 : 1.5} />
                                <span className="text-sm tracking-[0.1em] font-light">履歴</span>
                            </button>
                            <button
                                onClick={() => handleTabChange("profile")}
                                className={`w-full px-5 py-3 text-left flex items-center gap-3 transition-colors rounded-xl ${
                                    currentTab === "profile" ? "text-slate-900 bg-slate-50" : "text-slate-500 hover:bg-slate-50/50"
                                }`}
                            >
                                <User size={20} strokeWidth={currentTab === "profile" ? 2 : 1.5} />
                                <span className="text-sm tracking-[0.1em] font-light">プロフィール</span>
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </>
    );
};

