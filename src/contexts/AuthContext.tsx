import { useEffect, useState, useMemo, ReactNode } from 'react';
import { User, onIdTokenChanged } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { AuthContext } from './AuthContextDefinition';

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
                    setIsAdmin(!!idTokenResult.claims.admin);
                } catch (e) {
                    console.error("[AuthProvider] Failed to fetch custom claims", e);
                    setIsAdmin(false);
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
