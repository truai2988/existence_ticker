import React from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { HomeView } from './HomeView';
import { ProfileView } from './ProfileView';
import { JournalView } from './JournalView';
import { AdminDashboard } from './AdminDashboard';
import { RadianceView } from './RadianceView';
import { FlowView } from './FlowView';

import { SeasonalRevelation } from './SeasonalRevelation';
import { AppViewMode } from '../types';

interface MainContentProps {
    viewMode: AppViewMode;
    setViewMode: (mode: AppViewMode) => void;
    currentUserId: string;
    onGoHome: () => void;
}

export const MainContent: React.FC<MainContentProps> = ({ viewMode, setViewMode, currentUserId, onGoHome }) => {
    
    // Helper to wrap content in motion div for soft transitions
    const withTransition = (component: React.ReactNode, key: string) => (
        <motion.div
            key={key}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="w-full h-full"
        >
            {component}
        </motion.div>
    );

    const renderContent = () => {
        switch (viewMode) {
            case 'home':
                return withTransition(
                    <HomeView 
                        onOpenFlow={() => setViewMode('flow')} 
                        onOpenRequest={() => setViewMode('give')}
                    />,
                    'home'
                );
            case 'profile':
                return withTransition(
                    <ProfileView 
                        onClose={onGoHome} 
                        onOpenAdmin={() => setViewMode('admin')} 
                    />,
                    'profile'
                );
            case 'profile_edit':
                return withTransition(
                    <ProfileView 
                        onClose={onGoHome} 
                        onOpenAdmin={() => setViewMode('admin')} 
                        initialEditMode={true}
                    />,
                    'profile_edit'
                );
            case 'history':
                return withTransition(<JournalView onClose={onGoHome} />, 'history');
            case 'flow':
                return withTransition(
                    <FlowView 
                        onClose={onGoHome} 
                        currentUserId={currentUserId} 
                        onOpenProfile={() => setViewMode('profile_edit')}
                    />,
                    'flow'
                );
            case 'give':
                 return withTransition(<RadianceView onClose={onGoHome} currentUserId={currentUserId} />, 'give');

            case 'admin':
                 return withTransition(<AdminDashboard onClose={onGoHome} />, 'admin');
            default:
                return null;
        }
    };

    return (
        <div className="flex flex-col w-full min-h-full">
            <SeasonalRevelation />
            <div className="flex-1 w-full relative">
                <AnimatePresence mode="wait">
                    {renderContent()}
                </AnimatePresence>
            </div>
        </div>
    );
};