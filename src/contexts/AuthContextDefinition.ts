import { createContext, useContext } from 'react';
import { User } from 'firebase/auth';

export interface AuthContextType {
    user: User | null;
    isAdmin: boolean;
    loading: boolean;
    isRegistering: boolean;
    setIsRegistering: (val: boolean) => void;
}

export const AuthContext = createContext<AuthContextType>({
    user: null,
    isAdmin: false,
    loading: true,
    isRegistering: false,
    setIsRegistering: () => {},
});

export const useAuthContext = () => useContext(AuthContext);
