import { useEffect, useState, useMemo, ReactNode } from 'react';
import { User, onIdTokenChanged } from 'firebase/auth';
import { onSnapshot, doc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { AuthContext } from './AuthContextDefinition';
import { ADMIN_EMAILS } from '../constants';

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
        let unsubscribeSuperAdmin: (() => void) | null = null;

        const unsubscribeAuth = onIdTokenChanged(auth, async (currentUser) => {
            if (unsubscribeFirestore) {
                unsubscribeFirestore();
                unsubscribeFirestore = null;
            }
            if (unsubscribeSuperAdmin) {
                unsubscribeSuperAdmin();
                unsubscribeSuperAdmin = null;
            }

            if (currentUser) {
                const userEmail = currentUser.email;
                const isHardcodedAdmin = userEmail ? ADMIN_EMAILS.includes(userEmail) : false;

                // Sync signals: isSuper (Email/Static) + isDoc (DB/Live) + isDynamicSuper (DB/Global)
                let isDynamicSuper = false;
                let isDocAdmin = false;

                const updateAdminState = () => {
                    setIsAdmin(isHardcodedAdmin || isDocAdmin || isDynamicSuper);
                };

                // 1. Live Profile Role
                const userRef = doc(db!, 'users', currentUser.uid);
                unsubscribeFirestore = onSnapshot(userRef, (snap) => {
                    isDocAdmin = snap.exists() && snap.data()?.role === 'admin';
                    updateAdminState();
                });

                // 2. Global Super Admin Status (survives user deletion)
                if (userEmail) {
                    const superRef = doc(db!, 'super_admins', userEmail);
                    unsubscribeSuperAdmin = onSnapshot(superRef, (snap) => {
                        isDynamicSuper = snap.exists() && snap.data()?.is_super === true;
                        updateAdminState();
                    });
                }

                updateAdminState();
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
            if (unsubscribeSuperAdmin) unsubscribeSuperAdmin();
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
