/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from 'react';
import { Wish } from '../types';
import { db } from '../lib/firebase';
import { collection, query, orderBy, getDocs, limit, startAfter, where } from 'firebase/firestore';
import { useAuth } from '../hooks/useAuthHook';

interface WishesContextType {
    wishes: Wish[];
    userWishes: Wish[];
    isLoading: boolean;
    isFetchingMore: boolean;
    error: Error | null;
    loadMore: () => void;
    hasMore: boolean;
    refresh: () => void;
}

const WishesContext = createContext<WishesContextType | undefined>(undefined);

export const WishesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [wishes, setWishes] = useState<Wish[]>([]);
    const [userWishes, setUserWishes] = useState<Wish[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const lastDocRef = useRef<unknown>(null);
    const [hasMore, setHasMore] = useState(true);
    const [isFetchingMore, setIsFetchingMore] = useState(false);

    const LIMIT = 20;

    const fetchUserWishes = useCallback(async () => {
        if (!db || !user) {
            setUserWishes([]);
            return;
        } 
        try {
            const q = query(
                collection(db, 'wishes'),
                where('requester_id', '==', user.uid),
                where('status', 'in', ['open', 'in_progress'])
            );
            const snapshot = await getDocs(q);
            const myWishes = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Wish[];
            console.log(`[WishesProvider] Loaded ${myWishes.length} personal wishes.`);
            setUserWishes(myWishes);
        } catch (e) {
            console.error("Failed to fetch user wishes", e);
        }
    }, [user]);

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

            if (!isInitial && lastDocRef.current) {
                q = query(
                    collection(db, 'wishes'), 
                    orderBy('created_at', 'desc'), 
                    startAfter(lastDocRef.current),
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
            lastDocRef.current = lastVisible;

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
    }, []); // No dependencies - stable reference

    // Initial Load
    useEffect(() => {
        fetchWishes(true);
    }, [fetchWishes]);

    // Fetch user wishes when user changes
    useEffect(() => {
        if (user) {
            fetchUserWishes();
        } else {
            setUserWishes([]);
        }
    }, [user, fetchUserWishes]);

    const loadMore = () => {
        if (!isLoading && !isFetchingMore && hasMore) {
            fetchWishes(false);
        }
    };

    const refresh = () => {
        lastDocRef.current = null;
        setHasMore(true);
        fetchWishes(true);
        fetchUserWishes();
    };

    return (
        <WishesContext.Provider value={{ wishes, userWishes, isLoading, error, loadMore, hasMore, isFetchingMore, refresh }}>
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
