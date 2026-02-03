import React from 'react';
import { Home, History, User } from 'lucide-react';
import { motion } from 'framer-motion';

type Tab = 'home' | 'history' | 'profile';

interface FooterProps {
    currentTab: Tab;
    onTabChange: (tab: Tab) => void;
}

export const Footer: React.FC<FooterProps> = ({ currentTab, onTabChange }) => {
    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-slate-200 h-16 pb-safe z-50">
            <div className="flex justify-around items-center h-full max-w-md mx-auto">
                {/* Home Tab */}
                <button 
                    onClick={() => onTabChange('home')}
                    className={`flex flex-col items-center justify-center p-2 transition-colors relative ${currentTab === 'home' ? 'text-slate-900' : 'text-slate-400'}`}
                >
                    <Home size={24} strokeWidth={currentTab === 'home' ? 2.5 : 2} />
                    <span className="text-[11px] font-bold mt-1">ホーム</span>
                    {currentTab === 'home' && (
                        <motion.div layoutId="activeTab" className="absolute top-0 w-8 h-0.5 bg-slate-900 rounded-full" />
                    )}
                </button>

                {/* History Tab */}
                <button 
                    onClick={() => onTabChange('history')}
                    className={`flex flex-col items-center justify-center p-2 transition-colors relative ${currentTab === 'history' ? 'text-slate-900' : 'text-slate-400'}`}
                >
                    <History size={24} strokeWidth={currentTab === 'history' ? 2.5 : 2} />
                    <span className="text-[11px] font-bold mt-1">履歴</span>
                    {currentTab === 'history' && (
                        <motion.div layoutId="activeTab" className="absolute top-0 w-8 h-0.5 bg-slate-900 rounded-full" />
                    )}
                </button>

                {/* Profile Tab */}
                <button 
                    onClick={() => onTabChange('profile')}
                    className={`flex flex-col items-center justify-center p-2 transition-colors relative ${currentTab === 'profile' ? 'text-slate-900' : 'text-slate-400'}`}
                >
                    <User size={24} strokeWidth={currentTab === 'profile' ? 2.5 : 2} />
                    <span className="text-[11px] font-bold mt-1">自分</span>
                    {currentTab === 'profile' && (
                        <motion.div layoutId="activeTab" className="absolute top-0 w-8 h-0.5 bg-slate-900 rounded-full" />
                    )}
                </button>
            </div>
        </nav>
    );
};
