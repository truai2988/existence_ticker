import { useEffect, useState, useMemo, ReactNode } from 'react';
import { User, onIdTokenChanged } from 'firebase/auth';
import { onSnapshot, doc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { AuthContext } from './AuthContextDefinition';
import { ADMIN_UIDS } from '../constants';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);
    const [isRegistering, setIsRegistering] = useState(false);

    useEffect(() => {
        if (!auth || !db) {
            setLoading(false);
            return;
        }

        let unsubscribeFirestore: (() => void) | null = null;

        const unsubscribeAuth = onIdTokenChanged(auth, async (currentUser) => {
            if (unsubscribeFirestore) {
                unsubscribeFirestore();
                unsubscribeFirestore = null;
            }

            if (currentUser) {
                // Simplified: Admin is either hardcoded (Emergency) or in DB (Live)
                const isSuperAdmin = ADMIN_UIDS.includes(currentUser.uid);

                const userRef = doc(db!, 'users', currentUser.uid);
                unsubscribeFirestore = onSnapshot(userRef, (snap) => {
                    const isDocAdmin = snap.exists() && snap.data()?.role === 'admin';
                    setIsAdmin(isSuperAdmin || isDocAdmin);
                });

                // Initial sync for the super admin/static check
                setIsAdmin(isSuperAdmin);
            } else {
                setIsAdmin(false);
            }
            
            setUser(currentUser);
            setLoading(false);
        }, (error) => {
            console.error("[AuthProvider] Auth error:", error);
            setLoading(false);
        });

        return () => {
            unsubscribeAuth();
            if (unsubscribeFirestore) unsubscribeFirestore();
        };
    }, []);

    const contextValue = useMemo(() => ({ 
        user, 
        isAdmin,
        loading, 
        isRegistering, 
        setIsRegistering 
    }), [user, isAdmin, loading, isRegistering]);

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};
