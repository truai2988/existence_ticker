import { CreateWishInput } from '../types';
import { db } from '../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { useWishesContext } from '../contexts/WishesContext';
import { useAuth } from './useAuthHook';

export const useWishes = () => {
    const { user } = useAuth();
    const context = useWishesContext();

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
        ...context, // Expose all context values (wishes, active/archive lists, loaders)
        createWish
    };
};