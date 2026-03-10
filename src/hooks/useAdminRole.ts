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
        let unsubscribeSuperAdmin: (() => void) | null = null;
        let unsubscribeGlobalSettings: (() => void) | null = null;

        // Sync signals: isDoc (DB/Live) + isDynamicSuper (DB/Secure) + isGlobalSuper (UI/Config)
        let isDynamicSuper = false;
        let isDocAdmin = false;
        let isGlobalSuper = false;

        const updateAdminState = () => {
            // Fallback to global settings ensures users listed in UI always have access
            setIsAdmin(isDocAdmin || isDynamicSuper || isGlobalSuper);
        };

        // 1. Live Profile Role
        const userRef = doc(db, 'users', user.uid);
        unsubscribeFirestore = onSnapshot(userRef, (snap) => {
            isDocAdmin = snap.exists() && (snap.data()?.role === 'admin' || snap.data()?.role === 'super_admin');
            updateAdminState();
        }, () => {});

        // 2. Super Admin Status (UID keyed - Security Rules Source)
        const superRef = doc(db, 'super_admins', user.uid);
        unsubscribeSuperAdmin = onSnapshot(superRef, (snap) => {
            isDynamicSuper = snap.exists() && snap.data()?.is_super === true;
            updateAdminState();
        }, () => {});

        // 3. Global Settings (UI List Source - Fallback for consistency)
        const globalRef = doc(db, 'system_settings', 'global');
        unsubscribeGlobalSettings = onSnapshot(globalRef, (snap) => {
            const ids = snap.data()?.super_admin_ids as string[] | undefined;
            isGlobalSuper = !!ids && ids.includes(user.uid);
            updateAdminState();
        }, () => {});

        // Initial check
        updateAdminState();

        return () => {
            if (unsubscribeFirestore) unsubscribeFirestore();
            if (unsubscribeSuperAdmin) unsubscribeSuperAdmin();
            if (unsubscribeGlobalSettings) unsubscribeGlobalSettings();
        };
    }, [user]);

    return isAdmin;
};
