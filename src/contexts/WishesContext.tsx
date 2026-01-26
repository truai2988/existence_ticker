/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { Wish } from '../types';
import { db } from '../lib/firebase';
import { collection, query, orderBy, getDocs, limit, startAfter } from 'firebase/firestore';

interface WishesContextType {
    wishes: Wish[];
    isLoading: boolean;
    isFetchingMore: boolean;
    error: Error | null;
    loadMore: () => void;
    hasMore: boolean;
    refresh: () => void;
}

const WishesContext = createContext<WishesContextType | undefined>(undefined);

export const WishesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [wishes, setWishes] = useState<Wish[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const [lastDoc, setLastDoc] = useState<unknown>(null);
    const [hasMore, setHasMore] = useState(true);
    const [isFetchingMore, setIsFetchingMore] = useState(false);

    const LIMIT = 20;

    const fetchWishes = useCallback(async (isInitial = false) => {
        if (!db) return;
        
        try {
            if (isInitial) {
                setIsLoading(true);
            } else {
                setIsFetchingMore(true);
            }

            let q = query(
                collection(db, 'wishes'), 
                orderBy('created_at', 'desc'), 
                limit(LIMIT)
            );

            if (!isInitial && lastDoc) {
                q = query(
                    collection(db, 'wishes'), 
                    orderBy('created_at', 'desc'), 
                    startAfter(lastDoc),
                    limit(LIMIT)
                );
            }

            console.log(`[WishesProvider] Fetching wishes... (Initial: ${isInitial})`);
            const snapshot = await getDocs(q);
            
            const newWishes = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Wish[];

            if (isInitial) {
                setWishes(newWishes);
            } else {
                setWishes(prev => [...prev, ...newWishes]);
            }

            // Update Cursor
            const lastVisible = snapshot.docs[snapshot.docs.length - 1];
            setLastDoc(lastVisible);

            // Check if more exist
            if (snapshot.docs.length < LIMIT) {
                setHasMore(false);
            } else {
                setHasMore(true);
            }

        } catch (err) {
            console.error("Wishes fetch error:", err);
            setError(err as Error);
        } finally {
            setIsLoading(false);
            setIsFetchingMore(false);
        }
    }, [lastDoc]); // Dependencies: lastDoc updates when page changes

    // Initial Load
    useEffect(() => {
        fetchWishes(true);
    }, [fetchWishes]);

    const loadMore = () => {
        if (!isLoading && !isFetchingMore && hasMore) {
            fetchWishes(false);
        }
    };

    const refresh = () => {
        setLastDoc(null);
        setHasMore(true);
        fetchWishes(true);
    };

    return (
        <WishesContext.Provider value={{ wishes, isLoading, error, loadMore, hasMore, isFetchingMore, refresh }}>
            {children}
        </WishesContext.Provider>
    );
};

export const useWishesContext = () => {
    const context = useContext(WishesContext);
    if (context === undefined) {
        throw new Error('useWishesContext must be used within a WishesProvider');
    }
    return context;
};
