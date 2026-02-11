import { createContext, useContext } from 'react';
import { User } from 'firebase/auth';

export interface AuthContextType {
    user: User | null;
    loading: boolean;
    isRegistering: boolean;
    setIsRegistering: (val: boolean) => void;
}

export const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    isRegistering: false,
    setIsRegistering: () => {},
});

export const useAuthContext = () => useContext(AuthContext);
