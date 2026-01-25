import React, { createContext, useContext, useState, ReactNode } from 'react';
import { PublicProfileModal } from '../components/PublicProfileModal';

interface UserViewContextType {
    openUserProfile: (userId: string) => void;
}

const UserViewContext = createContext<UserViewContextType | undefined>(undefined);

export const UserViewProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [viewingUserId, setViewingUserId] = useState<string | null>(null);

    const openUserProfile = (userId: string) => {
        setViewingUserId(userId);
    };

    return (
        <UserViewContext.Provider value={{ openUserProfile }}>
            {children}
            {viewingUserId && (
                <PublicProfileModal 
                    userId={viewingUserId} 
                    onClose={() => setViewingUserId(null)} 
                />
            )}
        </UserViewContext.Provider>
    );
};

export const useUserView = () => {
    const context = useContext(UserViewContext);
    if (!context) {
        throw new Error('useUserView must be used within a UserViewProvider');
    }
    return context;
};
