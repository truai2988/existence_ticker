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
                const data = snap.data();
                // console.log("Fetched Profile:", userId, data.name);
                setProfile({ id: snap.id, ...data } as UserProfile);
            } else {
                console.warn("Profile not found for:", userId);
                setProfile(null);
            }
            setLoading(false);
        }, (err) => {
            console.error("Profile fetch error:", err);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [userId]);

    return { profile, loading };
};
