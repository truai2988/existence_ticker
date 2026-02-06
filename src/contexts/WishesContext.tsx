/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { Wish } from '../types';
import { db } from '../lib/firebase';
import { collection, query, orderBy, getDocs, limit, startAfter, where, onSnapshot } from 'firebase/firestore';
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
    
    // Archive Data (Lazy)
    userArchiveWishes: Wish[];
    involvedArchiveWishes: Wish[];
    
    loadUserArchive: (isInitial?: boolean) => void;
    loadInvolvedArchive: (isInitial?: boolean) => void;
    
    userArchiveHasMore: boolean;
    involvedArchiveHasMore: boolean;
    
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

    const ARCHIVE_LIMIT = 10;


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


    // --- Lazy Archive Logic (Pagination) ---
    // User Archive: requester_id == me AND status in [fulfilled, cancelled, expired]
    // Involved Archive: helper_id == me AND status in [fulfilled, cancelled, expired] OR decayed/expired logic?
    // For simplicity and "Rule of 10", let's define "loadArchive" to act on the *current view context*.
    // But WishesContext is global. 
    // Let's provide a generic "fetchUserArchive" and "fetchInvolvedArchive" or just "fetchArchive" that takes a mode.
    // Spec says: "History tab or 'Load More'".
    
    // Actually, `FlowView` (Involved History) and `RadianceView` (My History) are separate.
    // We should probably keep simpler state processing here or robust hooks.
    // Let's implement `loadUserArchive` and `loadInvolvedArchive` separately to be safe.
    
    // WAIT: The previously merged "involvedWishes" contained everything.
    // Now we split "Active" (Realtime) and "Archive" (Lazy).
    
    // Let's keep `archiveWishes` as a generic bucket? No, they might conflict if user switches views fast.
    // Let's use specific buckets.
    const [userArchiveWishes, setUserArchiveWishes] = useState<Wish[]>([]);
    const [involvedArchiveWishes, setInvolvedArchiveWishes] = useState<Wish[]>([]);

    const [userArchiveCursor, setUserArchiveCursor] = useState<unknown>(null);
    const [involvedArchiveCursor, setInvolvedArchiveCursor] = useState<unknown>(null);

    const [userArchiveHasMore, setUserArchiveHasMore] = useState(true);
    const [involvedArchiveHasMore, setInvolvedArchiveHasMore] = useState(true);

    const loadUserArchive = useCallback(async (isInitial = false) => {
        if (!user || !db) return;
        if (!isInitial && !userArchiveHasMore) return;

        try {
            // My Past: requester_id == me AND status IN [fulfilled, cancelled, expired]
            // Note: 'in' query supports up to 10.
            let q = query(
                collection(db, 'wishes'),
                where('requester_id', '==', user.uid),
                where('status', 'in', ['fulfilled', 'cancelled', 'expired']),
                orderBy('created_at', 'desc'),
                limit(ARCHIVE_LIMIT)
            );

            if (!isInitial && userArchiveCursor) {
                q = query(q, startAfter(userArchiveCursor));
            }

            const snap = await getDocs(q);
            const data = snap.docs.map(d => ({id:d.id, ...d.data()} as Wish));

            if (isInitial) {
                setUserArchiveWishes(data);
            } else {
                setUserArchiveWishes(prev => [...prev, ...data]);
            }

            setUserArchiveCursor(snap.docs[snap.docs.length - 1]);
            setUserArchiveHasMore(snap.docs.length === ARCHIVE_LIMIT);

        } catch (e) {
            console.error("User Archive Load Error", e);
        }
    }, [user, userArchiveCursor, userArchiveHasMore]);

    const loadInvolvedArchive = useCallback(async (isInitial = false) => {
        if (!user || !db) return;
        if (!isInitial && !involvedArchiveHasMore) return;

        try {
            // Involved Past: helper_id == me AND status IN [fulfilled, cancelled, expired]
            // (Applicants don't see history usually per previous logic, or strictly helpers)
            let q = query(
                collection(db, 'wishes'),
                where('helper_id', '==', user.uid),
                where('status', 'in', ['fulfilled', 'cancelled', 'expired']),
                orderBy('created_at', 'desc'),
                limit(ARCHIVE_LIMIT)
            );

            if (!isInitial && involvedArchiveCursor) {
                q = query(q, startAfter(involvedArchiveCursor));
            }

            const snap = await getDocs(q);
            const data = snap.docs.map(d => ({id:d.id, ...d.data()} as Wish));

             if (isInitial) {
                setInvolvedArchiveWishes(data);
            } else {
                setInvolvedArchiveWishes(prev => [...prev, ...data]);
            }

            setInvolvedArchiveCursor(snap.docs[snap.docs.length - 1]);
            setInvolvedArchiveHasMore(snap.docs.length === ARCHIVE_LIMIT);

        } catch (e) {
             console.error("Involved Archive Load Error", e);
        }
    }, [user, involvedArchiveCursor, involvedArchiveHasMore]);


    return (
        <WishesContext.Provider value={{ 
            wishes, // Global Active
            userActiveWishes, 
            involvedActiveWishes,
            
            userArchiveWishes,
            involvedArchiveWishes,
            
            loadUserArchive,
            loadInvolvedArchive,
            
            userArchiveHasMore,
            involvedArchiveHasMore,

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
