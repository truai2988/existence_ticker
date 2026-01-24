import { db } from '../lib/firebase';
import { useAuth } from './useAuthHook';
import { doc, deleteDoc, collection, query, where, getDocs, setDoc, serverTimestamp } from 'firebase/firestore';

export const useDebug = () => {
    const { user } = useAuth();

    const resetAccount = async () => {
        if (!user || !db) return;
        
        if (!confirm("【警告】アカウントをリセットし、循環を再開しますか？\n残高は「2400 Pt」に設定され、これまでの記憶は消去されます。\nこの操作は取り消せません。")) return;

        try {
            console.log("Starting account reset...");

            // 1. Delete My Wishes
            const wishesRef = collection(db, 'wishes');
            // Delete sent wishes
            const qSent = query(wishesRef, where("requester_id", "==", user.uid));
            const sentSnapshot = await getDocs(qSent);
            const deletePromises = sentSnapshot.docs.map(d => deleteDoc(d.ref));
            await Promise.all(deletePromises);
            
            // 2. Reset User Profile to Initial State correctly
            // Instead of deleting (which might cause race conditions with onSnapshot), we forcibly overwrite
            const userRef = doc(db, 'users', user.uid);
            await setDoc(userRef, {
                id: user.uid,
                name: user.displayName || 'Anonymous',
                balance: 2400, // The Vessel Refilled
                xp: 0,
                warmth: 0,
                last_updated: serverTimestamp(),
                cycle_started_at: serverTimestamp() // New Cycle
            });

            alert("アカウントをリセットしました。\n器は満たされ（2400 Pt）、新たな循環が始まります。");
            window.location.reload();

        } catch (e) {
            console.error("Reset failed:", e);
            alert("リセットに失敗しました。");
        }
    };

    return { resetAccount };
};
