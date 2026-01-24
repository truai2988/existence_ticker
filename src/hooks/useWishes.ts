import { useState, useEffect } from 'react';
import { Wish, CreateWishInput } from '../types';
import { db } from '../lib/firebase';
import { collection, addDoc, query, orderBy, onSnapshot } from 'firebase/firestore';
import { useAuth } from './useAuthHook';

export const useWishes = () => {
    const { user } = useAuth();
    const [wishes, setWishes] = useState<Wish[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!db) {
            setIsLoading(false);
            return;
        }

        const q = query(collection(db, 'wishes'), orderBy('created_at', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const wishesData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Wish[];
            setWishes(wishesData);
            setIsLoading(false);
        }, (error) => {
            console.error("Wishes sync error:", error);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const createWish = async (input: CreateWishInput) => {
        if (!user || !db) return { success: false };
        
        try {
            const newWishData = {
                requester_id: user.uid,
                content: input.content,
                gratitude_preset: input.tier,
                status: 'open',
                created_at: new Date().toISOString(), // Use string for client, serverTimestamp for backend if needed, but keeping simple for now
                // timestamp: serverTimestamp() // If we want server time sorting
            };
            
            const docRef = await addDoc(collection(db, 'wishes'), newWishData);
            return { success: true, id: docRef.id };
        } catch (e) {
            console.error(e);
            return { success: false, error: e };
        }
    };

    return {
        wishes,
        createWish,
        isLoading,
        error: null
    };
};