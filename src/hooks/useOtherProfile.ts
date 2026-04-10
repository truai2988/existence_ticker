import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { UserProfile } from '../types';
import { getMillis } from '../logic/worldPhysics';

// Global cache for profiles to drastically reduce Firestore reads
const profileCache = new Map<string, UserProfile>();
const fetchPromises = new Map<string, Promise<UserProfile | null>>();

export const useOtherProfile = (userId: string | null) => {
    // Initialize immediately if present in cache
    const [profile, setProfile] = useState<UserProfile | null>(userId ? (profileCache.get(userId) || null) : null);
    const [loading, setLoading] = useState(!profile && !!userId);

    useEffect(() => {
        if (!userId || !db) {
            setProfile(null);
            setLoading(false);
            return;
        }

        if (profileCache.has(userId)) {
            setProfile(profileCache.get(userId)!);
            setLoading(false);
            return;
        }

        let isMounted = true;
        setLoading(true);

        const fetchProfile = async () => {
            if (!fetchPromises.has(userId)) {
                const promise = (async () => {
                    try {
                        if (!db) return null;
                        const ref = doc(db, 'users', userId);
                        const snap = await getDoc(ref);
                        if (snap.exists()) {
                            const data = snap.data();
                            const normalized = {
                                id: snap.id,
                                ...data,
                                last_updated: getMillis(data.last_updated),
                                cycle_started_at: getMillis(data.cycle_started_at),
                                created_at: getMillis(data.created_at),
                            } as UserProfile;
                            profileCache.set(userId, normalized);
                            return normalized;
                        }
                    } catch (err) {
                        console.error("Profile fetch error:", err);
                    }
                    return null;
                })();
                fetchPromises.set(userId, promise);
            }

            const data = await fetchPromises.get(userId);
            if (isMounted) {
                setProfile(data || null);
                setLoading(false);
            }
        };

        fetchProfile();

        return () => {
            isMounted = false;
        };
    }, [userId]);

    return { profile, loading };
};
