import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, History, User, X } from 'lucide-react';
import { AppViewMode } from '../types';

interface DrawerMenuProps {
    isOpen: boolean;
    onClose: () => void;
    currentTab: AppViewMode;
    onTabChange: (tab: "home" | "history" | "profile") => void;
}

export const DrawerMenu: React.FC<DrawerMenuProps> = ({ 
    isOpen, 
    onClose, 
    currentTab, 
    onTabChange 
}) => {
    
    // Menu Items Definition
    const menuItems = [
        { id: "home", label: "ホーム", icon: Home, activeModes: ["home"] },
        { id: "history", label: "履歴", icon: History, activeModes: ["history"] },
        { id: "profile", label: "自分", icon: User, activeModes: ["profile", "profile_edit"] },
    ] as const;

    const handleNavigation = (id: "home" | "history" | "profile") => {
        onTabChange(id);
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-slate-900/10 backdrop-blur-sm z-50"
                    />

                    {/* Drawer Content */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed inset-y-0 right-0 w-[280px] bg-white z-50 shadow-2xl flex flex-col pt-safe"
                    >
                        {/* Brand Area */}
                        <div className="px-8 pt-8 pb-4">
                            <h1 className="text-4xl font-serif font-light tracking-tighter text-slate-800 mb-1">
                                ET
                            </h1>
                            <p className="text-xs text-slate-400 font-sans tracking-[0.3em] uppercase font-medium">
                                Existence Ticker
                            </p>
                        </div>

                        {/* Custom Close Button Area */}
                        <div className="flex justify-end p-6">
                            <button 
                                onClick={onClose}
                                className="p-2 rounded-full hover:bg-slate-50 transition-colors text-slate-400"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Menu Links */}
                        <nav className="flex-1 px-8 py-4 flex flex-col gap-8">
                            {menuItems.map((item) => {
                                const isActive = (item.activeModes as readonly string[]).includes(currentTab) || item.id === currentTab;
                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => handleNavigation(item.id)}
                                        className={`group flex items-center gap-6 text-left transition-all ${
                                            isActive ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
                                        }`}
                                    >
                                        <item.icon 
                                            size={24} 
                                            strokeWidth={isActive ? 2 : 1.5}
                                            className={`${isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'} transition-colors`} 
                                        />
                                        <span className={`text-xl font-serif tracking-widest font-normal ${isActive ? 'text-blue-600' : 'text-slate-800'}`}>
                                            {item.label}
                                        </span>
                                    </button>
                                );
                            })}
                        </nav>

                        {/* Footer / Brand (Optional) */}
                        <div className="p-8 text-center">
                            <p className="text-xs text-slate-300 font-mono tracking-widest uppercase opacity-50">
                                Existence Ticker
                            </p>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
