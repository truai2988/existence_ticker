import { createContext, useContext } from 'react';
import { User } from 'firebase/auth';

export interface AuthContextType {
    user: User | null;
    loading: boolean;
    isRegistering: boolean; // Flag to prevent ghost profile purge during registration
}

export const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    isRegistering: false
});

export const useAuthContext = () => useContext(AuthContext);
