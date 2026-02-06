/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from 'react';
import { Wish } from '../types';
import { db } from '../lib/firebase';
import { collection, query, orderBy, getDocs, limit, startAfter, where } from 'firebase/firestore';
import { useAuth } from '../hooks/useAuthHook';

// --- Global Helpers ---
const getMillis = (ts: unknown): number => {
    if (!ts) return 0;
    if (typeof ts === 'string') return new Date(ts).getTime();
    if (typeof ts === 'object' && ts !== null && 'toMillis' in ts && typeof (ts as { toMillis: () => number }).toMillis === 'function') {
        return (ts as { toMillis: () => number }).toMillis();
    }
    if (typeof ts === 'object' && ts !== null && 'seconds' in ts) {
        return (ts as { seconds: number }).seconds * 1000;
    }
    return 0;
};

interface WishesContextType {
    wishes: Wish[];         // World Feed (Open only)
    userWishes: Wish[];     // Private Storage (My Requests)
    involvedWishes: Wish[]; // Private Storage (My Responsibilities as Helper)
    isLoading: boolean;
    isFetchingMore: boolean;
    error: Error | null;
    loadMore: () => void;
    hasMore: boolean;
    isUserWishesLoading: boolean;
    isInvolvedWishesLoading: boolean;
    refresh: () => void;
}

const WishesContext = createContext<WishesContextType | undefined>(undefined);

export const WishesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [wishes, setWishes] = useState<Wish[]>([]);
    const [userWishes, setUserWishes] = useState<Wish[]>([]);
    const [involvedWishes, setInvolvedWishes] = useState<Wish[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUserWishesLoading, setIsUserWishesLoading] = useState(true);
    const [isInvolvedWishesLoading, setIsInvolvedWishesLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const lastDocRef = useRef<unknown>(null);
    const [hasMore, setHasMore] = useState(true);
    const [isFetchingMore, setIsFetchingMore] = useState(false);

    const LIMIT = 20;

    const fetchUserWishes = useCallback(async () => {
        if (!db || !user) {
            setUserWishes([]);
            setIsUserWishesLoading(false);
            return;
        } 
        try {
            setIsUserWishesLoading(true);
            // "Private Storage" (蔵): No Limit, All Statuses
            const q = query(
                collection(db, 'wishes'),
                where('requester_id', '==', user.uid)
            );
            const snapshot = await getDocs(q);
            const myWishes = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Wish[];
            
            // Client-side sort to avoid index requirement
            const sorted = myWishes.sort((a, b) => getMillis(b.created_at) - getMillis(a.created_at));

            console.log(`[WishesProvider] Loaded ${sorted.length} personal wishes (Requester).`);
            setUserWishes(sorted);
        } catch (e) {
            console.error("Failed to fetch user wishes", e);
        } finally {
            setIsUserWishesLoading(false);
        }
    }, [user]);

    const fetchInvolvedWishes = useCallback(async () => {
        if (!db || !user) {
            setInvolvedWishes([]);
            setIsInvolvedWishesLoading(false);
            return;
        }
        try {
            setIsInvolvedWishesLoading(true);
            // Helper side: I am the helper or I applied.
            // Using two queries because of limited OR support in Firestore for arrays vs fields.
            const qHelper = query(
                collection(db, 'wishes'),
                where('helper_id', '==', user.uid)
            );
            
            // Note: This requires applicant_ids field which we'll add.
            // For now, if it doesn't exist, this will return empty.
            const qApplicant = query(
                collection(db, 'wishes'),
                where('applicant_ids', 'array-contains', user.uid)
            );

            const [snapH, snapA] = await Promise.all([getDocs(qHelper), getDocs(qApplicant)]);
            
            const results = [...snapH.docs, ...snapA.docs];
            // Deduplicate
            const unique = Array.from(new Map(results.map(d => [d.id, { id: d.id, ...d.data() }])).values()) as Wish[];
            
            const sorted = unique.sort((a, b) => getMillis(b.created_at) - getMillis(a.created_at));

            console.log(`[WishesProvider] Loaded ${sorted.length} involved wishes (Helper).`);
            setInvolvedWishes(sorted);
        } catch (e) {
            console.error("Failed to fetch involved wishes", e);
        } finally {
            setIsInvolvedWishesLoading(false);
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

            // "World Stream" (川): Simple orderBy (No where) to avoid index requirement
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
            fetchInvolvedWishes();
        } else {
            setUserWishes([]);
            setInvolvedWishes([]);
        }
    }, [user, fetchUserWishes, fetchInvolvedWishes]);

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
        fetchInvolvedWishes();
    };

    return (
        <WishesContext.Provider value={{ wishes, userWishes, involvedWishes, isLoading, isUserWishesLoading, isInvolvedWishesLoading, error, loadMore, hasMore, isFetchingMore, refresh }}>
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
