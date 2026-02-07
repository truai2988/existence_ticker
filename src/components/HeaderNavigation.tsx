import React, { useState } from 'react';
import { Menu, Home, History, User } from 'lucide-react';
import { AppViewMode } from '../types';
import { DrawerMenu } from './DrawerMenu';

interface HeaderNavigationProps {
    currentTab: AppViewMode;
    onTabChange: (tab: "home" | "history" | "profile") => void;
}

export const HeaderNavigation: React.FC<HeaderNavigationProps> = ({ currentTab, onTabChange }) => {
    const [isdrawerOpen, setIsDrawerOpen] = useState(false);

    const navItems = [
        { id: "home", icon: Home, label: "ホーム" },
        { id: "history", icon: History, label: "履歴" },
        { id: "profile", icon: User, label: "自分" },
    ] as const;

    return (
        <>
            {/* Desktop Navigation (Hidden on Mobile) */}
            <nav className="hidden md:flex items-center gap-0">
                {navItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => onTabChange(item.id)}
                        className={`p-2 rounded-full transition-all group relative active:scale-95 ${
                            currentTab === item.id ? "bg-slate-100/30" : "hover:bg-blue-50/20"
                        }`}
                        title={item.label}
                    >
                        {/* Light bleeding effect */}
                        <span className="absolute inset-0 rounded-full bg-blue-400/0 group-hover:bg-blue-400/5 blur-md transition-all" />
                        <item.icon 
                            size={20} 
                            strokeWidth={currentTab === item.id ? 2.5 : 1.5}
                            className={`transition-colors ${
                                currentTab === item.id ? "text-slate-800" : "text-slate-400 group-hover:text-slate-600"
                            }`} 
                        />
                    </button>
                ))}
            </nav>

            {/* Mobile Navigation Trigger (Visible only on Mobile) */}
            <button
                onClick={() => setIsDrawerOpen(true)}
                className="md:hidden p-2 -mr-2 text-slate-400 hover:text-slate-600 transition-colors"
            >
                <Menu size={24} strokeWidth={1.5} />
            </button>

            {/* Mobile Drawer */}
            <DrawerMenu 
                isOpen={isdrawerOpen} 
                onClose={() => setIsDrawerOpen(false)}
                currentTab={currentTab}
                onTabChange={onTabChange}
            />
        </>
    );
};
