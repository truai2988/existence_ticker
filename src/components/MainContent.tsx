import React from 'react';
import { HomeView } from './HomeView';
import { ProfileView } from './ProfileView';
import { JournalView } from './JournalView';
import { AdminDashboard } from './AdminDashboard';
import { RadianceView } from './RadianceView';
import { FlowView } from './FlowView';
import { GiftView } from './GiftView';
import { AppViewMode } from '../types';
import { useProfile } from '../hooks/useProfile';

interface MainContentProps {
    viewMode: AppViewMode;
    setViewMode: (mode: AppViewMode) => void;
    currentUserId: string;
    onGoHome: () => void;
}

export const MainContent: React.FC<MainContentProps> = ({ viewMode, setViewMode, currentUserId, onGoHome }) => {
    const { profile } = useProfile();
    const showHeader = viewMode !== 'profile' && viewMode !== 'profile_edit';

    const renderContent = () => {
        switch (viewMode) {
            case 'home':
                return (
                    <HomeView 
                        onOpenFlow={() => setViewMode('flow')} 
                        onOpenRequest={() => setViewMode('give')}
                        onOpenGift={() => setViewMode('gift')}
                        onOpenProfileEdit={() => setViewMode('profile_edit')}
                    />
                );
            case 'profile':
                return (
                    <ProfileView 
                        onClose={onGoHome} 
                        onOpenAdmin={() => setViewMode('admin')} 
                    />
                );
            case 'profile_edit':
                return (
                    <ProfileView 
                        onClose={onGoHome} 
                        onOpenAdmin={() => setViewMode('admin')} 
                        initialEditMode={true}
                    />
                );
            case 'history':
                return <JournalView onClose={onGoHome} />;
            case 'flow':
                return (
                    <FlowView 
                        onClose={onGoHome} 
                        currentUserId={currentUserId} 
                        onOpenProfile={() => setViewMode('profile_edit')}
                    />
                );
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

    return (
        <>
            {showHeader && profile && (
                <div className="fixed inset-0 z-50 pointer-events-none flex justify-center items-start">
                    <div className="w-full max-w-md relative px-4">
                        <div className="absolute top-20 left-4 pointer-events-auto">
                            <p className="text-[10px] font-bold text-slate-400 tracking-wider uppercase leading-none mb-1">
                                Logged in as
                            </p>
                            <p className="text-sm font-black text-slate-700 leading-none tracking-tight">
                                {profile.name || "Anonymous"}
                            </p>
                        </div>
                    </div>
                </div>
            )}
            {renderContent()}
        </>
    );
};