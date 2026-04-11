/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useState, useMemo, useCallback, ReactNode } from 'react';
import { Wish } from '../types';
import { db } from '../lib/firebase';
import { collection, query, orderBy, where, onSnapshot, limit } from 'firebase/firestore';
import { useAuth } from '../hooks/useAuthHook';
import { getMillis, calculateDecayedValue, toMilli } from '../logic/worldPhysics';


interface WishesContextType {
    // Active Data (Real-time)
    wishes: Wish[];
    userActiveWishes: Wish[];
    involvedActiveWishes: Wish[];
    
    isLoading: boolean;
    error: Error | null;

    // Optimistic Actions
    addOptimisticWish: (wish: Wish) => void;
    removeOptimisticWish: (wishId: string) => void;
    updateOptimisticWish: (wishId: string, updates: Partial<Wish>) => void;
}

const WishesContext = createContext<WishesContextType | undefined>(undefined);

// Firestore ドキュメントを Wish 型へ変換するヘルパー（重複コードを排除）
const mapWish = (docSnap: { id: string; data: () => Record<string, unknown> }): Wish => {
    const raw = docSnap.data();
    return {
        ...raw,
        id: docSnap.id,
        created_at: getMillis(raw.created_at as Parameters<typeof getMillis>[0]),
        accepted_at: raw.accepted_at ? getMillis(raw.accepted_at as Parameters<typeof getMillis>[0]) : undefined,
        fulfilled_at: raw.fulfilled_at ? getMillis(raw.fulfilled_at as Parameters<typeof getMillis>[0]) : undefined,
        cancelled_at: raw.cancelled_at ? getMillis(raw.cancelled_at as Parameters<typeof getMillis>[0]) : undefined,
    } as Wish;
};

export const WishesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    // Real-time Active Data
    const [wishes, setWishes] = useState<Wish[]>([]); // Global Active
    const [userActiveWishes, setUserActiveWishes] = useState<Wish[]>([]); // My Active
    const [involvedActiveWishes, setInvolvedActiveWishes] = useState<Wish[]>([]); // My Involved Active

    // --- Optimistic Logic ---
    const [optimisticWishes, setOptimisticWishes] = useState<Wish[]>([]);

    const addOptimisticWish = (wish: Wish) => {
        setOptimisticWishes(prev => [wish, ...prev]);
        // セーフティネット：何らかの通信エラー等でクリア処理が呼ばれなかった場合でも、
        // 15秒後に自動的に幻影を消去する（システムトラブルによるフリーズ永続化防止）
        setTimeout(() => {
            setOptimisticWishes(prev => prev.filter(w => w.id !== wish.id));
        }, 15000);
    };

    const removeOptimisticWish = (wishId: string) => {
        setOptimisticWishes(prev => prev.filter(w => w.id !== wishId));
    };

    const updateOptimisticWish = (wishId: string, updates: Partial<Wish>) => {
        setOptimisticWishes(prev => prev.map(w => w.id === wishId ? { ...w, ...updates } : w));
    };

    // Merge Real + Optimistic
    // Note: Deduplicate by ID to prefer Real data if both exist (e.g. after sync)
    const mergeOptimistic = useCallback((real: Wish[]) => {
        const realIds = new Set(real.map(r => r.id));
        const filteredOptimistic = optimisticWishes.filter(o => !realIds.has(o.id));
        return [...filteredOptimistic, ...real].sort((a,b) => getMillis(b.created_at) - getMillis(a.created_at));
    }, [optimisticWishes]);

    const mergedWishes = useMemo(() => mergeOptimistic(wishes), [wishes, mergeOptimistic]);
    const mergedUserActive = useMemo(() => mergeOptimistic(userActiveWishes), [userActiveWishes, mergeOptimistic]);
    const mergedInvolved = useMemo(() => mergeOptimistic(involvedActiveWishes), [involvedActiveWishes, mergeOptimistic]);



    // Global Loading State (Initial Real-time setup)
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);



    // --- Real-time Subscriptions (Active Data) ---
    useEffect(() => {
        if (!db) return;

        // Global Feed: limitを30に削減（課金オペレーション最小化）
        const qFeed = query(
            collection(db, 'wishes'),
            where('status', '==', 'open'),
            orderBy('created_at', 'desc'),
            limit(30)
        );

        const unsubFeed = onSnapshot(qFeed, (snap) => {
            const data = snap.docs.map(mapWish);
            const valid = data.filter(w => {
                const effectiveCost = w.cost !== undefined ? w.cost : 0;
                if (effectiveCost === 0) return true;
                const elapsedSec = ((Date.now() - w.created_at) / 1000) | 0;
                const currentMilli = calculateDecayedValue(toMilli(effectiveCost), elapsedSec);
                return currentMilli > 0;
            });
            setWishes(valid);
            setIsLoading(false);
        }, (err) => {
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
             const data = snap.docs.map(mapWish);
             setUserActiveWishes(data.sort((a,b) => b.created_at - a.created_at));
        }, () => {});

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
             updateInvolvedState(snap.docs.map(mapWish), 'helper');
        }, () => {});
        const unsubApplied = onSnapshot(qApplied, (snap) => {
             updateInvolvedState(snap.docs.map(mapWish), 'applicant');
        }, () => {});

        return () => {
            unsubUser();
            unsubHelper();
            unsubApplied();
        };

    }, [user]);

    const contextValue = useMemo(() => ({ 
        wishes: mergedWishes, // Global Active
        userActiveWishes: mergedUserActive, 
        involvedActiveWishes: mergedInvolved,
        
        addOptimisticWish,
        removeOptimisticWish,
        updateOptimisticWish,

        isLoading, 
        error
    }), [mergedWishes, mergedUserActive, mergedInvolved, isLoading, error]);

    return (
        <WishesContext.Provider value={contextValue}>
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
