/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Wish } from '../types';
import { db } from '../lib/firebase';
import { collection, query, orderBy, where, onSnapshot } from 'firebase/firestore';
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
    // Active Data (Real-time)
    wishes: Wish[];
    userActiveWishes: Wish[];
    involvedActiveWishes: Wish[];
    
    isLoading: boolean;
    error: Error | null;
}

const WishesContext = createContext<WishesContextType | undefined>(undefined);

export const WishesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    // Real-time Active Data
    const [wishes, setWishes] = useState<Wish[]>([]); // Global Active
    const [userActiveWishes, setUserActiveWishes] = useState<Wish[]>([]); // My Active
    const [involvedActiveWishes, setInvolvedActiveWishes] = useState<Wish[]>([]); // My Involved Active



    // Global Loading State (Initial Real-time setup)
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);



    // --- Real-time Subscriptions (Active Data) ---
    useEffect(() => {
        if (!db) return;

        // 1. Global Feed (Open Only)
        const qFeed = query(
            collection(db, 'wishes'),
            where('status', '==', 'open'),
            orderBy('created_at', 'desc')
        );

        const unsubFeed = onSnapshot(qFeed, (snap) => {
            const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Wish));
            // Filter out 0 Lm
            const valid = data.filter(w => getMillis(w.created_at) + (w.cost || 0) * 3600 * 1000 > Date.now());
            setWishes(valid);
            setIsLoading(false);
        }, (err) => {
            console.error("Feed subscription error:", err);
            setError(err as Error);
            setIsLoading(false);
        });

        return () => unsubFeed();
    }, []);

    useEffect(() => {
        if (!db || !user) {
            setUserActiveWishes([]);
            setInvolvedActiveWishes([]);
            return;
        }

        // 2. My Active Wishes (Requester: Open/InProgress/Review)
        // Note: Firestore 'in' query allows up to 10 values.
        const qUserActive = query(
            collection(db, 'wishes'),
            where('requester_id', '==', user.uid),
            where('status', 'in', ['open', 'in_progress', 'review_pending'])
        );
        
        const unsubUser = onSnapshot(qUserActive, (snap) => {
             const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Wish));
             // Sort client-side
             setUserActiveWishes(data.sort((a,b) => getMillis(b.created_at) - getMillis(a.created_at)));
        });

        // 3. Involved Active Wishes (Helper: InProgress/Review/Open(Applied))
        // This is tricky for "Applied". For now, we track where helper_id == me OR applicants contains me.
        // Simplified: Helper Only for now to avoid complexity, or use separate listeners.
        // "Active" from FlowView definition: 
        //   - Pending (Applied): status='open' AND applicants contains me
        //   - Active (Helper): helper_id=me AND (in_progress OR review_pending)
        
        // A. Helper Active
        const qHelperActive = query(
            collection(db, 'wishes'),
            where('helper_id', '==', user.uid),
            where('status', 'in', ['in_progress', 'review_pending'])
        );

        // B. Applied (Pending)
        // Note: 'array-contains' and 'in' cannot be combined easily in some cases depending on index.
        const qApplied = query(
            collection(db, 'wishes'),
            where('status', '==', 'open'),
            where('applicant_ids', 'array-contains', user.uid)
        );

        // Merge logic for involved
        let helperCache: Wish[] = [];
        let applicantCache: Wish[] = [];

        const updateInvolvedState = (newData: Wish[], type: 'helper' | 'applicant') => {
            if (type === 'helper') helperCache = newData;
            else applicantCache = newData;

            const merged = [...helperCache, ...applicantCache];
            // Dedupe just in case
            const unique = Array.from(new Map(merged.map(item => [item.id, item])).values());
            setInvolvedActiveWishes(unique.sort((a,b) => getMillis(b.created_at) - getMillis(a.created_at)));
        };

        const unsubHelper = onSnapshot(qHelperActive, (snap) => {
             updateInvolvedState(snap.docs.map(d => ({id:d.id, ...d.data()} as Wish)), 'helper');
        });
        const unsubApplied = onSnapshot(qApplied, (snap) => {
             updateInvolvedState(snap.docs.map(d => ({id:d.id, ...d.data()} as Wish)), 'applicant');
        });

        return () => {
            unsubUser();
            unsubHelper();
            unsubApplied();
        };

    }, [user]);

    return (
        <WishesContext.Provider value={{ 
            wishes, // Global Active
            userActiveWishes, 
            involvedActiveWishes,
            
            isLoading, 
            error
        }}>
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
