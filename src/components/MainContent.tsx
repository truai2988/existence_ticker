import React from 'react';
import { HomeView } from './HomeView';
import { ProfileView } from './ProfileView';
import { JournalView } from './JournalView';
import { AdminDashboard } from './AdminDashboard';
import { RadianceView } from './RadianceView';
import { FlowView } from './FlowView';
import { GiftView } from './GiftView';
import { AppViewMode } from '../types';

interface MainContentProps {
    viewMode: AppViewMode;
    setViewMode: (mode: AppViewMode) => void;
    currentUserId: string;
    onGoHome: () => void;
}

export const MainContent: React.FC<MainContentProps> = ({ viewMode, setViewMode, currentUserId, onGoHome }) => {
    switch (viewMode) {
        case 'home':
            return (
                <HomeView 
                    onOpenFlow={() => setViewMode('flow')} 
                    onOpenRequest={() => setViewMode('give')}
                    onOpenGift={() => setViewMode('gift')}
                    onOpenProfile={() => setViewMode('profile')}
                />
            );
        case 'profile':
            return (
                <ProfileView 
                    onClose={onGoHome} 
                    onOpenAdmin={() => setViewMode('admin')} 
                />
            );
        case 'history':
            return <JournalView onClose={onGoHome} />;
        case 'flow':
            return <FlowView onClose={onGoHome} currentUserId={currentUserId} />;
        case 'give':
             return <RadianceView onClose={onGoHome} currentUserId={currentUserId} />;
        case 'gift':
             return <GiftView onClose={onGoHome} />;
        case 'admin':
             return <AdminDashboard onClose={onGoHome} />;
        default:
            return null;
    }
};