import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Wish } from '../types';
import { db } from '../lib/firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';

interface WishesContextType {
    wishes: Wish[];
    isLoading: boolean;
    error: Error | null;
}

const WishesContext = createContext<WishesContextType | undefined>(undefined);

export const WishesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [wishes, setWishes] = useState<Wish[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!db) {
            setIsLoading(false);
            return;
        }

        const q = query(collection(db, 'wishes'), orderBy('created_at', 'desc'));
        
        console.log("[WishesProvider] Subscribing to wishes...");
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const wishesData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Wish[];
            setWishes(wishesData);
            setIsLoading(false);
            // console.log("[WishesProvider] Updated wishes:", wishesData.length);
        }, (err) => {
            console.error("Wishes sync error:", err);
            setError(err);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, []);

    return (
        <WishesContext.Provider value={{ wishes, isLoading, error }}>
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
