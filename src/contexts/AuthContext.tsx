import { useEffect, useState, useMemo, ReactNode } from 'react';
import { User, onIdTokenChanged } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { AuthContext } from './AuthContextDefinition';
import { ADMIN_UIDS } from '../constants';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);
    const [isRegistering, setIsRegistering] = useState(false);

    useEffect(() => {
        if (!auth) {
            setLoading(false);
            return;
        }

        const unsubscribe = onIdTokenChanged(auth, async (currentUser) => {
            if (currentUser) {
                try {
                    const idTokenResult = await currentUser.getIdTokenResult();
                    const isSuperAdmin = ADMIN_UIDS.includes(currentUser.uid);
                    setIsAdmin(!!idTokenResult.claims.admin || isSuperAdmin);
                } catch (e) {
                    console.error("[AuthProvider] Failed to fetch custom claims", e);
                    const isSuperAdmin = ADMIN_UIDS.includes(currentUser.uid);
                    setIsAdmin(isSuperAdmin); 
                }
            } else {
                setIsAdmin(false);
            }
            
            setUser(currentUser);
            setLoading(false);
        }, (error) => {
            console.error("[AuthProvider] Auth error:", error);
            setLoading(false);
        });

        return () => unsubscribe();
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
