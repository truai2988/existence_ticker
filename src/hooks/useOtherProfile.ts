import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { UserProfile } from '../types';
import { getMillis } from '../logic/worldPhysics';

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
                const normalized: UserProfile = {
                    id: snap.id,
                    ...data,
                    last_updated: getMillis(data.last_updated),
                    cycle_started_at: getMillis(data.cycle_started_at),
                    created_at: getMillis(data.created_at),
                } as UserProfile;
                setProfile(normalized);
            } else {
                console.warn("Profile not found for:", userId);
                setProfile(null);
            }
            setLoading(false);
        }, () => {
            // console.warn("Profile fetch error:", err);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [userId]);

    return { profile, loading };
};
