import React from 'react';
import { motion } from 'framer-motion';
import { WishCard } from './WishCard';
import { Wish } from '../types';
import { useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';

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
}

export const WishCardList: React.FC<WishCardListProps> = ({ 
    wishes, 
    currentUserId, 
    emptyMessage = "No wishes found.",
    emptyIcon,
    subtitle,
    onLoadMore,
    hasMore = false,
    isFetchingMore = false,
    onOpenProfile
}) => {
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
    if (wishes.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 px-6 border-2 border-dashed border-slate-200 rounded-3xl bg-white/50">
                {emptyIcon}
                <p className="text-slate-400 text-sm font-medium">{emptyMessage}</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {subtitle && (
                 <div className="flex items-center gap-2 pl-1 border-b border-slate-200 pb-1 mb-2 mt-2">
                    <span className="w-1 h-4 bg-amber-500/50 rounded-sm"></span>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                        {subtitle}
                    </h3>
                </div>
            )}
            
            {wishes.map((wish, index) => (
                <motion.div
                    key={wish.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="w-full max-w-[350px] mx-auto"
                >
                    <WishCard 
                        wish={wish} 
                        currentUserId={currentUserId} 
                        onOpenProfile={onOpenProfile}
                    />
                </motion.div>
            ))}

            {onLoadMore && hasMore && (
                <div 
                    ref={sentinelRef} 
                    className="w-full py-4 flex justify-center items-center"
                >
                    {isFetchingMore ? (
                        <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
                    ) : (
                        <span className="text-xs text-slate-300">Load More...</span>
                    )}
                </div>
            )}
        </div>
    );
};
