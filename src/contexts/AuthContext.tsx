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

        console.log("[AuthProvider] Initializing Singleton Listener (Token-Aware)...");
        const unsubscribe = onIdTokenChanged(auth, async (currentUser) => {
            console.log("[AuthProvider] Auth state or Token changed:", currentUser ? `User: ${currentUser.uid}` : "No user");
            
            if (currentUser) {
                try {
                    const idTokenResult = await currentUser.getIdTokenResult();
                    const adminClaim = !!idTokenResult.claims.admin;
                    console.log("[AuthProvider] Claims detected:", idTokenResult.claims);
                    console.log("[AuthProvider] isAdmin set to:", adminClaim);
                    setIsAdmin(adminClaim);
                } catch (e) {
                    console.error("[AuthProvider] Failed to fetch custom claims", e);
                    setIsAdmin(false);
                }
            } else {
                console.log("[AuthProvider] No user, setting isAdmin to false");
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
