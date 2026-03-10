import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

export const useAdminRole = (user: User | null) => {
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        if (!user || !db) {
            setIsAdmin(false);
            return;
        }

        let unsubscribeFirestore: (() => void) | null = null;

        // 1. Live Profile Role
        const userRef = doc(db, 'users', user.uid);
        unsubscribeFirestore = onSnapshot(userRef, (snap) => {
            setIsAdmin(snap.exists() && snap.data()?.role === 'admin');
        }, () => {});

        return () => {
            if (unsubscribeFirestore) unsubscribeFirestore();
        };
    }, [user]);

    return isAdmin;
};
