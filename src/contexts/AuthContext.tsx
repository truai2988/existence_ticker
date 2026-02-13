import { useEffect, useState, useMemo, ReactNode } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { AuthContext } from './AuthContextDefinition';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [isRegistering, setIsRegistering] = useState(false);
    // Global flag is now managed directly on window object in useAuthHook

    useEffect(() => {
        if (!auth) {
            setLoading(false);
            return;
        }

        console.log("[AuthProvider] Initializing Singleton Listener...");
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            console.log("[AuthProvider] Auth state changed:", currentUser ? `User: ${currentUser.uid}` : "No user");
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
        loading, 
        isRegistering, 
        setIsRegistering 
    }), [user, loading, isRegistering]);

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};
