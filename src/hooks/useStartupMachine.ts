import { useAuth } from "./useAuthHook";
import { useProfile } from "./useProfile";
import { useWallet } from "./useWallet";
import { useSeasonalEvent, SeasonalEventData } from "./useSeasonalEvent";
import { useMemo, useState, useEffect } from "react";
import { User } from 'firebase/auth';
import { UserProfile } from '../types';
import { ADMIN_UIDS } from "../constants";

// The 4 Discrete Views of Existence (GHOST removed - brain handles it)
export type StartupView = 
  | 'LOADING'   // White Void (Booting / Checking)
  | 'GATE'      // Entrance (Unauthenticated)
  | 'EVENT'     // Seasonal Revelation
  | 'APP';      // The World (Main Application)

// The Two Modes of the App
export type AppMode = 'NORMAL' | 'RITUAL';

interface StartupResult {
    view: StartupView;
    appMode: AppMode;
    data: {
        user: User | null;
        profile: UserProfile | null;
        eventData: SeasonalEventData | null;
        message?: string;
    };
    actions: {
        signOut: () => Promise<void>;
        completeEvent: () => Promise<void>;
        deleteAccount: () => Promise<void>;
    };
}

export const useStartupMachine = () => {
    // 1. Ingest all raw signals from sensors (no judgment)
    const { user, loading: authLoading, signOut, deleteAccount, isRegistering } = useAuth();
    const { profile, isLoading: profileLoading } = useProfile();
    const { status: walletStatus } = useWallet(); 
    const { eventData, isChecking: eventChecking, completeEvent } = useSeasonalEvent();

    // 2. Brain-exclusive state: GHOST detection
    const [isGhostGracePeriod, setIsGhostGracePeriod] = useState(false);

    // 3. GHOST Detection Logic (Passive Observation)
    useEffect(() => {
        // Condition: Auth loaded, Profile loaded, user exists, but profile is null
        // CRITICAL PROTECTION: 
        // 1. Only anonymous users can be considered ghosts (registered users always have profiles, even if slow to load)
        // 2. Admin users are NEVER purged even if anonymous (extra safety)
        const isGhostDetected = 
            !authLoading && 
            !profileLoading && 
            user && 
            !profile && 
            user.isAnonymous &&
            !ADMIN_UIDS.includes(user.uid);
        
        if (isGhostDetected) {
            console.log(`[StateMachine] Ghost detected (UID: ${user.uid}, Anonymous: ${user.isAnonymous}) - Passive state initiated.`);
            setIsGhostGracePeriod(true); // Re-using state to signal ghost presence to UI
        } else {
            setIsGhostGracePeriod(false);
        }
        
    }, [authLoading, profileLoading, user, profile]);

    // 4. The Deterministic State Machine
    // We derive the current visual state purely from the inputs.
    // Order of operations is CRITICAL.
    
    return useMemo((): StartupResult => {
        // PHASE 1: LOADING
        // If any core system is loading, show LOADING
        if (authLoading || profileLoading || eventChecking) {
            return {
                view: 'LOADING' as StartupView,
                appMode: 'NORMAL' as AppMode,
                data: { 
                    user: null, 
                    profile: null, 
                    eventData: null,
                    message: authLoading ? "魂を呼び覚ましています..." : 
                             profileLoading ? "記憶を辿っています..." : "世界を整えています..."
                },
                actions: { signOut, completeEvent, deleteAccount }
            };
        }

        // PHASE 2: AUTHENTICATION CHECK
        // Loading is done. Do we have a user?
        if (!user) {
            return {
                view: 'GATE' as StartupView,
                appMode: 'NORMAL' as AppMode,
                data: { user: null, profile: null, eventData: null, message: undefined },
                actions: { signOut, completeEvent, deleteAccount }
            };
        }

        // PHASE 3: GHOST GRACE PERIOD
        // We have user but no profile - if timer is active, stay in LOADING
        if (!profile && isGhostGracePeriod) {
            return {
                view: 'LOADING' as StartupView,
                appMode: 'NORMAL' as AppMode,
                data: { 
                    user, 
                    profile: null, 
                    eventData: null,
                    message: "アカウントの状態を確認しています..."
                },
                actions: { signOut, completeEvent, deleteAccount }
            };
        }

        // PHASE 4: SEASONAL INTERVENTION
        // Profile exists. Is there a mandatory event?
        if (eventData && profile) {
            return {
                view: 'EVENT' as StartupView,
                appMode: 'NORMAL' as AppMode,
                data: { user, profile, eventData, message: undefined },
                actions: { signOut, completeEvent, deleteAccount }
            };
        }

        // PHASE 5: EXISTENCE (The App)
        // All checks passed. We are ready to render the world.
        
        if (!profile) {
            // Edge case: profile is null but no timer
            // This happens during active registration or if profile sync is slow.
            return {
                view: 'LOADING' as StartupView,
                appMode: 'NORMAL' as AppMode,
                data: { 
                    user, 
                    profile: null, 
                    eventData: null,
                    message: (isRegistering || (window as any).__isRegistering) ? "新しい存在を刻んでいます..." : "再接続を待っています..."
                },
                actions: { signOut, completeEvent, deleteAccount }
            };
        }

        const appMode: AppMode = walletStatus === 'RITUAL_READY' ? 'RITUAL' : 'NORMAL';

        return {
            view: 'APP' as StartupView,
            appMode,
            data: { user, profile, eventData: null, message: undefined },
            actions: { signOut, completeEvent, deleteAccount }
        };

    }, [
        authLoading, profileLoading, eventChecking,
        user, profile,
        eventData,
        walletStatus,
        isGhostGracePeriod,
        isRegistering,
        signOut, completeEvent, deleteAccount
    ]);
};
