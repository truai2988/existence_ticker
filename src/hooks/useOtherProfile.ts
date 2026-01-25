import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { UserProfile } from '../types';

export const useOtherProfile = (userId: string | null) => {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!userId || !db) {
            setProfile(null);
            return;
        }

        setLoading(true);
        const ref = doc(db, 'users', userId);
        
        // Use snapshot for real-time updates if they are looking at it
        const unsubscribe = onSnapshot(ref, (snap) => {
            if (snap.exists()) {
                setProfile({ id: snap.id, ...snap.data() } as UserProfile);
            } else {
                setProfile(null);
            }
            setLoading(false);
        }, (err) => {
            console.error(err);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [userId]);

    return { profile, loading };
};
