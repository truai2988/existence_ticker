import { useEffect, useState, ReactNode } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { AuthContext } from './AuthContextDefinition';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

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

    return (
        <AuthContext.Provider value={{ user, loading }}>
            {children}
        </AuthContext.Provider>
    );
};
