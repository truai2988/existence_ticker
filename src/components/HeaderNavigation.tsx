import React, { useState } from 'react';
import { Home, History as HistoryIcon, User, Menu, X, Shield, Sprout, Edit2, Droplets, Sparkles } from 'lucide-react';
import { AppViewMode } from '../types';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuthHook';

interface HeaderNavigationProps {
    currentTab: AppViewMode;
    onTabChange: (tab: AppViewMode) => void;
    onOpenOnboarding?: () => void;
}

const NavButton: React.FC<{ icon: React.ElementType, label: string, active: boolean, onClick: () => void }> = ({ icon: Icon, label, active, onClick }) => (
    <button
        onClick={onClick}
        className={`px-2 pt-5 pb-0 transition-colors flex flex-col items-center group relative ${
            active ? "text-slate-900" : "text-slate-400 hover:text-slate-600"
        }`}
        aria-label={label}
    >
        <Icon size={28} strokeWidth={active ? 2.5 : 2} />
        {active && (
            <motion.div layoutId="header-active-bar" className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-900 rounded-full" />
        )}
    </button>
);

export const HeaderNavigation: React.FC<HeaderNavigationProps> = ({ currentTab, onTabChange, onOpenOnboarding }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { isAdmin } = useAuth();



    const handleTabChange = (tab: AppViewMode) => {
        onTabChange(tab);
        setIsMenuOpen(false);
    };

    const navItems = [
        { id: 'home', label: 'ホーム', icon: Home },
        { id: 'flow', label: 'ご縁を授かる', icon: Droplets },
        { id: 'give', label: '想いを託す', icon: Sparkles },
        { id: 'history', label: '巡りの足跡', icon: HistoryIcon },
        { id: 'profile', label: '自分', icon: User },
    ] as const;

    // Helper for active check
    const isTabActive = (id: string) => {
        if (id === 'profile') return currentTab === 'profile' || currentTab === 'profile_edit';
        return currentTab === id;
    };

    return (
        <>
            {/* Desktop: Icon Navigation (md以上) */}
            <nav className="hidden md:flex items-end gap-6 h-12">

                {/* Profile Actions Group (Admin & Edit) */}
                {(currentTab === "profile" || currentTab === "profile_edit") && (
                    <div className="flex items-end gap-2">
                        {isAdmin && (
                            <button
                                onClick={() => onTabChange("admin")}
                                className="px-2 pt-5 pb-0 transition-colors text-red-500 hover:text-red-700 font-bold"
                                aria-label="管理コンソール"
                            >
                                <Shield size={28} strokeWidth={2} />
                            </button>
                        )}
                        {currentTab === "profile" && (
                            <button
                                onClick={() => onTabChange("profile_edit")}
                                className="px-2 pt-5 pb-0 transition-colors text-slate-400 hover:text-slate-600"
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
                >
                    <Sprout size={28} strokeWidth={2} />
                </button>

                {navItems.map((item) => (
                    <NavButton 
                        key={item.id}
                        icon={item.icon}
                        label={item.label}
                        active={isTabActive(item.id)}
                        onClick={() => handleTabChange(item.id as AppViewMode)}
                    />
                ))}
            </nav>

            {/* Mobile: Hamburger Menu */}
            <div className="md:hidden flex items-center gap-3 relative z-50 h-full">
                {isAdmin && (currentTab === "profile" || currentTab === "profile_edit") && !isMenuOpen && (
                    <button
                        onClick={() => onTabChange("admin")}
                        className="text-red-500 hover:text-red-700"
                    >
                        <Shield size={24} strokeWidth={1.5} />
                    </button>
                )}

                {currentTab === "profile" && !isMenuOpen && (
                    <button
                        onClick={() => onTabChange("profile_edit")}
                        className="text-slate-400 hover:text-slate-600"
                    >
                        <Edit2 size={24} strokeWidth={1.5} />
                    </button>
                )}

                <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="p-1 -mr-1 text-slate-500 hover:text-slate-800 scale-110"
                >
                    {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>

                <AnimatePresence>
                    {isMenuOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute right-0 top-full mt-2 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-100 p-2 z-50 min-w-[200px]"
                        >
                            <div className="px-5 pt-5 pb-4 mb-2 border-b border-slate-50">
                                <div className="text-3xl font-light tracking-tighter text-slate-800 leading-none mb-1 font-['Inter']">ET</div>
                                <div className="text-xs text-slate-400 font-light tracking-[0.4em] uppercase">Existence Ticker</div>
                            </div>
                            
                            <button
                                onClick={() => { onOpenOnboarding?.(); setIsMenuOpen(false); }}
                                className="w-full px-5 py-3 text-left flex items-center gap-3 rounded-xl text-slate-500 hover:bg-slate-50 hover:text-green-600"
                            >
                                <Sprout size={20} strokeWidth={2} />
                                <span className="text-sm tracking-[0.1em] font-light">ガイドをみる</span>
                            </button>
                            
                            {navItems.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => handleTabChange(item.id as AppViewMode)}
                                    className={`w-full px-5 py-3 text-left flex items-center gap-3 rounded-xl ${
                                        isTabActive(item.id) ? "text-slate-900 bg-slate-50" : "text-slate-500 hover:bg-slate-50"
                                    }`}
                                >
                                    <item.icon size={20} strokeWidth={isTabActive(item.id) ? 2 : 1.5} />
                                    <span className="text-sm tracking-[0.1em] font-light">{item.label}</span>
                                </button>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </>
    );
};

