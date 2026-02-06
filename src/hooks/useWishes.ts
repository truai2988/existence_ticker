import { CreateWishInput } from '../types';
import { db } from '../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { useWishesContext } from '../contexts/WishesContext';
import { useAuth } from './useAuthHook';

export const useWishes = () => {
    const { user } = useAuth();
    const { wishes, userWishes, involvedWishes, isLoading, isFetchingMore, loadMore, hasMore, error } = useWishesContext();

    const createWish = async (input: CreateWishInput) => {
        if (!user || !db) return { success: false };
        
        try {
            const newWishData = {
                requester_id: user.uid,
                content: input.content,
                gratitude_preset: input.tier,
                status: 'open',
                created_at: new Date().toISOString(),
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
        userWishes,
        involvedWishes,
        createWish,
        isLoading,
        isFetchingMore,
        loadMore,
        hasMore,
        error
    };
};