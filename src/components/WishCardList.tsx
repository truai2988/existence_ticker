import { motion, AnimatePresence } from 'framer-motion';
import { WishCard } from './WishCard';
import { Wish, AppViewMode } from '../types';
import React, { useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface WishCardListProps {
    wishes: Wish[];
    currentUserId: string;
    emptyMessage?: string;
    emptyIcon?: React.ReactNode;
    subtitle?: string; // Optional subtitle for the list
    onLoadMore?: () => void;
    hasMore?: boolean;
    isFetchingMore?: boolean;
    onOpenProfile?: () => void;
    onActionComplete?: (action: 'applied' | 'withdrawn' | 'approved' | 'cancelled' | 'resigned' | 'completed' | 'cleanup') => void;
    viewType?: 'radiance' | 'flow';
    onTabChange?: (tab: AppViewMode) => void;
}

export const WishCardList: React.FC<WishCardListProps> = ({ 
    wishes, 
    currentUserId, 
    emptyMessage,
    emptyIcon,
    subtitle,
    onLoadMore,
    hasMore = false,
    isFetchingMore = false,
    onOpenProfile,
    onActionComplete,
    viewType = 'radiance',
    onTabChange
}) => {
    const { t: MESSAGES } = useLanguage();
    const sentinelRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!onLoadMore || !hasMore) return;

        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && !isFetchingMore) {
                onLoadMore();
            }
        }, { threshold: 0.5 });

        const currentSentinel = sentinelRef.current;
        if (currentSentinel) {
            observer.observe(currentSentinel);
        }

        return () => {
            if (currentSentinel) observer.unobserve(currentSentinel);
        };
    }, [onLoadMore, hasMore, isFetchingMore]);
    return (
        <div className="w-full flex-col flex min-h-[200px]">
            {subtitle && (
                 <div className="flex items-center gap-2 pl-1 border-b border-slate-300 pb-1 mb-4 mt-2">
                    <span className="w-1 h-4 bg-amber-500/50 rounded-sm"></span>
                    <h3 className="text-sm font-bold text-slate-700 uppercase tracking-widest">
                        {subtitle}
                    </h3>
                </div>
            )}
            
            <AnimatePresence initial={false}>
                {wishes.length === 0 ? (
                    <motion.div
                        key="empty-state"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.4 }}
                        className="flex flex-col items-center justify-center py-20 px-6 border-2 border-dashed border-slate-300 rounded-3xl bg-white w-full my-4"
                    >
                        {emptyIcon}
                        <p className="text-slate-800 text-sm font-medium">{emptyMessage || MESSAGES.WISH.EMPTY_DEFAULT}</p>
                    </motion.div>
                ) : (
                    wishes.map((wish) => (
                        <motion.div
                            layout
                            key={wish.id}
                            initial={{ opacity: 0, height: 0, scale: 0.98 }}
                            animate={{ opacity: 1, height: 'auto', scale: 1 }}
                            exit={{ opacity: 0, height: 0, scale: 0.95, overflow: 'hidden' }}
                            transition={{ duration: 0.4, ease: "easeInOut" }}
                            className="w-full origin-top"
                        >
                            <div className="pb-4">
                                <WishCard 
                                    wish={wish} 
                                    currentUserId={currentUserId} 
                                    viewType={viewType}
                                    onOpenProfile={onOpenProfile}
                                    onActionComplete={onActionComplete}
                                    onTabChange={onTabChange}
                                />
                            </div>
                        </motion.div>
                    ))
                )}
            </AnimatePresence>

            {onLoadMore && hasMore && (
                <div 
                    ref={sentinelRef} 
                    className="w-full py-4 flex justify-center items-center"
                >
                    {isFetchingMore ? (
                        <Loader2 className="w-5 h-5 text-slate-700 animate-spin" />
                    ) : (
                        <span className="text-sm text-slate-700">{MESSAGES.WISH.BTN_LOAD_MORE}</span>
                    )}
                </div>
            )}
        </div>
    );
};
