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
            // Clean up previous Firestore listener if user changes
            if (unsubscribeFirestore) {
                unsubscribeFirestore();
                unsubscribeFirestore = null;
            }

            if (currentUser) {
                // 1. Core Auth Claims Check & Emergency Access
                const updateAdminStatus = async (docRole?: string) => {
                    try {
                        const idTokenResult = await currentUser.getIdTokenResult();
                        const isSuperAdmin = ADMIN_UIDS.includes(currentUser.uid);
                        const isClaimAdmin = !!idTokenResult.claims.admin;
                        const isDocAdmin = docRole === 'admin';
                        
                        setIsAdmin(isClaimAdmin || isSuperAdmin || isDocAdmin);
                    } catch (e) {
                        console.error("[AuthProvider] Admin check failed:", e);
                        setIsAdmin(ADMIN_UIDS.includes(currentUser.uid) || docRole === 'admin');
                    }
                };

                // 2. Real-time Firestore Role Listener
                const userRef = doc(db!, 'users', currentUser.uid);
                unsubscribeFirestore = onSnapshot(userRef, (snap) => {
                    const role = snap.exists() ? snap.data()?.role : undefined;
                    updateAdminStatus(role);
                });

                // Initial check before snapshot returns
                updateAdminStatus();
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
