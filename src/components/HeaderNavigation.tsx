import { Home, History, User, Menu, X } from 'lucide-react';
import { AppViewMode } from '../types';
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

interface HeaderNavigationProps {
    currentTab: AppViewMode;
    onTabChange: (tab: "home" | "history" | "profile") => void;
}

export const HeaderNavigation: React.FC<HeaderNavigationProps> = ({ currentTab, onTabChange }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const handleTabChange = (tab: "home" | "history" | "profile") => {
        onTabChange(tab);
        setIsMenuOpen(false);
    };

    return (
        <>
            {/* Desktop: Icon Navigation (md以上) */}
            <nav className="hidden md:flex items-center gap-4">
                <button
                    onClick={() => onTabChange("home")}
                    className={`p-2 transition-colors ${
                        currentTab === "home" ? "text-slate-800" : "text-slate-400 hover:text-slate-600"
                    }`}
                    aria-label="ホーム"
                >
                    <Home size={20} strokeWidth={currentTab === "home" ? 2.5 : 2} />
                </button>

                <button
                    onClick={() => onTabChange("history")}
                    className={`p-2 transition-colors ${
                        currentTab === "history" ? "text-slate-800" : "text-slate-400 hover:text-slate-600"
                    }`}
                    aria-label="履歴"
                >
                    <History size={20} strokeWidth={currentTab === "history" ? 2.5 : 2} />
                </button>

                <button
                    onClick={() => onTabChange("profile")}
                    className={`p-2 transition-colors ${
                        currentTab === "profile" ? "text-slate-800" : "text-slate-400 hover:text-slate-600"
                    }`}
                    aria-label="プロフィール"
                >
                    <User size={20} strokeWidth={currentTab === "profile" ? 2.5 : 2} />
                </button>
            </nav>

            {/* Mobile: Hamburger Menu */}
            <div className="md:hidden relative">
                <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
                    aria-label="メニュー"
                >
                    {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
                </button>

                <AnimatePresence>
                    {isMenuOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute right-0 top-full mt-2 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-50 min-w-[140px]"
                        >
                            <button
                                onClick={() => handleTabChange("home")}
                                className={`w-full px-4 py-2 text-left flex items-center gap-2 transition-colors whitespace-nowrap ${
                                    currentTab === "home" ? "text-slate-900 bg-slate-50" : "text-slate-600 hover:bg-slate-50"
                                }`}
                            >
                                <Home size={18} strokeWidth={currentTab === "home" ? 2.5 : 2} />
                                <span className="text-sm font-medium">ホーム</span>
                            </button>
                            <button
                                onClick={() => handleTabChange("history")}
                                className={`w-full px-4 py-2 text-left flex items-center gap-2 transition-colors ${
                                    currentTab === "history" ? "text-slate-900 bg-slate-50" : "text-slate-600 hover:bg-slate-50"
                                }`}
                            >
                                <History size={18} strokeWidth={currentTab === "history" ? 2.5 : 2} />
                                <span className="text-sm font-medium">履歴</span>
                            </button>
                            <button
                                onClick={() => handleTabChange("profile")}
                                className={`w-full px-4 py-2 text-left flex items-center gap-2 transition-colors ${
                                    currentTab === "profile" ? "text-slate-900 bg-slate-50" : "text-slate-600 hover:bg-slate-50"
                                }`}
                            >
                                <User size={18} strokeWidth={currentTab === "profile" ? 2.5 : 2} />
                                <span className="text-sm font-medium">プロフィール</span>
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </>
    );
};

