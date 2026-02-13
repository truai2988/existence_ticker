import { Home, History, User, Menu, X, Shield } from 'lucide-react';
import { AppViewMode } from '../types';
import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuthHook';

interface HeaderNavigationProps {
    currentTab: AppViewMode;
    onTabChange: (tab: AppViewMode) => void;
}

export const HeaderNavigation: React.FC<HeaderNavigationProps> = ({ currentTab, onTabChange }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { user, isAdmin } = useAuth();

    // Silent Sync: Refresh token globally when menu is interacted with (Mobile)
    // AND once on mount (for PC users who don't have a hamburger)
    useEffect(() => {
        if ((isMenuOpen || !window.matchMedia("(max-width: 768px)").matches) && user) {
            console.log("[HeaderNavigation] Silent Sync: Refreshing ID token...");
            user.getIdToken(true).catch(e => console.error("Claim sync failed", e));
        }
    }, [isMenuOpen, user]);

    const handleTabChange = (tab: "home" | "history" | "profile") => {
        onTabChange(tab);
        setIsMenuOpen(false);
    };

    return (
        <>
            {/* Desktop: Icon Navigation (md以上) - Scaled for Tablet */}
            <nav className="hidden md:flex items-end gap-6 h-12">
                <button
                    onClick={() => onTabChange("home")}
                    className={`px-2 pt-5 pb-0 transition-colors ${
                        currentTab === "home" ? "text-slate-900" : "text-slate-600 hover:text-slate-800"
                    }`}
                    aria-label="ホーム"
                >
                    <Home size={28} strokeWidth={currentTab === "home" ? 2.5 : 2} />
                </button>

                <button
                    onClick={() => onTabChange("history")}
                    className={`px-2 pt-5 pb-0 transition-colors ${
                        currentTab === "history" ? "text-slate-900" : "text-slate-600 hover:text-slate-800"
                    }`}
                    aria-label="履歴"
                >
                    <History size={28} strokeWidth={currentTab === "history" ? 2.5 : 2} />
                </button>

                <button
                    onClick={() => onTabChange("profile")}
                    className={`px-2 pt-5 pb-0 transition-colors ${
                        currentTab === "profile" ? "text-slate-900" : "text-slate-600 hover:text-slate-800"
                    }`}
                    aria-label="プロフィール"
                >
                    <User size={28} strokeWidth={currentTab === "profile" ? 2.5 : 2} />
                </button>

                {/* PC Admin Entrance (Hidden until synced) */}
                {isAdmin && (
                    <button
                        onClick={() => onTabChange("admin")}
                        className={`px-2 pt-5 pb-0 transition-colors text-red-500 hover:text-red-600 animate-in fade-in duration-500`}
                        aria-label="管理コンソール"
                    >
                        <Shield size={28} strokeWidth={2.5} />
                    </button>
                )}
            </nav>

            {/* Mobile: Hamburger Menu */}
            <div className="md:hidden flex h-12 items-end">
                <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="p-2 -mb-1 text-slate-600 hover:text-slate-900 transition-colors"
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
                                <div className="text-[8px] text-slate-400 font-light tracking-[0.4em] uppercase">
                                    Existence Ticker
                                </div>
                            </div>

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
                                <History size={20} strokeWidth={currentTab === "history" ? 2 : 1.5} />
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

                            {/* Mobile Admin Entrance */}
                            {isAdmin && (
                                <button
                                    onClick={() => {
                                        onTabChange("admin");
                                        setIsMenuOpen(false);
                                    }}
                                    className="w-full px-5 py-3 text-left flex items-center gap-3 transition-colors rounded-xl text-red-500 bg-red-50/30 hover:bg-red-50/50 mt-2 border border-red-100"
                                >
                                    <Shield size={20} strokeWidth={2} />
                                    <span className="text-sm tracking-[0.1em] font-bold">管理コンソール</span>
                                </button>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </>
    );
};

