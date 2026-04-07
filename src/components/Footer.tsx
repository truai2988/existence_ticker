import { Home, History, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLanguage } from '../contexts/LanguageContext';

type Tab = 'home' | 'history' | 'profile';

interface FooterProps {
    currentTab: Tab;
    onTabChange: (tab: Tab) => void;
}

export const Footer: React.FC<FooterProps> = ({ currentTab, onTabChange }) => {
    const { t: MESSAGES } = useLanguage();
    return (
        <footer className="flex-shrink-0 w-full pb-safe border-t border-slate-300 bg-white/95 backdrop-blur-sm">
            <div className="w-full max-w-2xl mx-auto px-6 h-16 flex items-center justify-around">
                <button
                    onClick={() => onTabChange('home')}
                    className={`flex flex-col items-center justify-center p-2 transition-colors relative ${currentTab === 'home' ? 'text-slate-900' : 'text-slate-700'}`}
                >
                    <Home size={24} strokeWidth={currentTab === 'home' ? 2.5 : 2} />
                    <span className="text-xs font-bold mt-1">{MESSAGES.LAYOUT.TAB_HOME}</span>
                    {currentTab === 'home' && (
                        <motion.div layoutId="activeTab" className="absolute top-0 w-8 h-0.5 bg-slate-900 rounded-full" />
                    )}
                </button>
                <button
                    onClick={() => onTabChange('history')}
                    className={`flex flex-col items-center justify-center p-2 transition-colors relative ${currentTab === 'history' ? 'text-slate-900' : 'text-slate-700'}`}
                >
                    <History size={24} strokeWidth={currentTab === 'history' ? 2.5 : 2} />
                    <span className="text-xs font-bold mt-1">{MESSAGES.LAYOUT.TAB_HISTORY}</span>
                    {currentTab === 'history' && (
                        <motion.div layoutId="activeTab" className="absolute top-0 w-8 h-0.5 bg-slate-900 rounded-full" />
                    )}
                </button>
                <button
                    onClick={() => onTabChange('profile')}
                    className={`flex flex-col items-center justify-center p-2 transition-colors relative ${currentTab === 'profile' ? 'text-slate-900' : 'text-slate-700'}`}
                >
                    <User size={24} strokeWidth={currentTab === 'profile' ? 2.5 : 2} />
                    <span className="text-xs font-bold mt-1">{MESSAGES.LAYOUT.TAB_PROFILE}</span>
                    {currentTab === 'profile' && (
                        <motion.div layoutId="activeTab" className="absolute top-0 w-8 h-0.5 bg-slate-900 rounded-full" />
                    )}
                </button>
            </div>
        </footer>
    );
};
