import { useAuth } from "./useAuthHook";
import { useProfile } from "./useProfile";
import { useWallet } from "./useWallet";
import { useMemo, useRef } from "react";
import { User } from 'firebase/auth';
import { UserProfile } from '../types';

// LocalStorage key for tracking first-visit state
const HAS_VISITED_KEY = 'et_hasVisited';

// The 3 Discrete Views of Existence
export type StartupView = 
  | 'LOADING'   // White Void (Booting / Checking)
  | 'APP';      // The World (Main Application) — includes Guest Mode

// The Two Modes of the App
export type AppMode = 'NORMAL' | 'RITUAL';

interface StartupResult {
    view: StartupView;
    appMode: AppMode;
    data: {
        user: User | null;
        profile: UserProfile | null;
        isAdmin: boolean;
        message?: string;
        /** true when no user is authenticated (Guest browsing) */
        guestMode: boolean;
        /** true on the very first visit (no hasVisited in localStorage) */
        isFirstVisit: boolean;
    };
    actions: {
        signOut: () => Promise<void>;
        deleteAccount: () => Promise<void>;
    };
}

export const useStartupMachine = () => {
    // 1. Ingest raw signals
    const { user, isAdmin, loading: authLoading, signOut, deleteAccount, isRegistering } = useAuth();
    const { profile, isLoading: profileLoading } = useProfile();
    const { status: walletStatus } = useWallet(); 

    // Check first-visit state from localStorage (stable across renders)
    const isFirstVisit = !localStorage.getItem(HAS_VISITED_KEY);
    const hasRenderedApp = useRef(false);

    // 2. The Deterministic State Machine
    return useMemo((): StartupResult => {
        // PHASE 1: LOADING (Auth still resolving)
        if (authLoading) {
            return {
                view: 'LOADING' as StartupView,
                appMode: 'NORMAL' as AppMode,
                data: { user: null, profile: null, isAdmin: false, guestMode: false, isFirstVisit },
                actions: { signOut, deleteAccount }
            };
        }

        // PHASE 2: GUEST MODE (Unauthenticated → proceed to APP as guest)
        // Previously this was GATE; now we allow guests to browse Home
        if (!user) {
            hasRenderedApp.current = true;
            return {
                view: 'APP' as StartupView,
                appMode: 'NORMAL' as AppMode,
                data: { user: null, profile: null, isAdmin: false, guestMode: true, isFirstVisit },
                actions: { signOut, deleteAccount }
            };
        }

        // PHASE 3: AUTHENTICATED but profile loading
        if (profileLoading) {
            // If the user just logged in from Guest mode, we are already in APP.
            // Returning LOADING here would destroy the APP DOM (including Auth animations).
            // So we stay in APP if we've already rendered it once.
            return {
                view: hasRenderedApp.current ? 'APP' : 'LOADING' as StartupView,
                appMode: 'NORMAL' as AppMode,
                data: { user, profile: null, isAdmin: false, guestMode: false, isFirstVisit: false },
                actions: { signOut, deleteAccount }
            };
        }

        // PHASE 4: GHOST / PENDING PROFILE
        if (!profile) {
            // If we're actively registering, show the registration loading screen
            if (isRegistering || (window as { __isRegistering?: boolean }).__isRegistering) {
                return {
                    view: 'LOADING' as StartupView,
                    appMode: 'NORMAL' as AppMode,
                    data: { 
                        user, 
                        profile: null, 
                        isAdmin,
                        message: "新しい存在を刻んでいます...",
                        guestMode: false,
                        isFirstVisit: false,
                    },
                    actions: { signOut, deleteAccount }
                };
            }

            // While profile is actively loading for the first time, stay in LOADING
            if (profileLoading && !hasRenderedApp.current) {
                return {
                    view: 'LOADING' as StartupView,
                    appMode: 'NORMAL' as AppMode,
                    data: { 
                        user, 
                        profile: null, 
                        isAdmin,
                        message: "接続を確認しています...",
                        guestMode: false,
                        isFirstVisit: false,
                    },
                    actions: { signOut, deleteAccount }
                };
            }

            // Once profileLoading finishes (or if APP was already rendered), proceed to APP
            hasRenderedApp.current = true;
            return {
                view: 'APP' as StartupView,
                appMode: 'NORMAL' as AppMode,
                data: { 
                    user, 
                    profile: null, 
                    isAdmin,
                    message: undefined,
                    guestMode: false,
                    isFirstVisit: false,
                },
                actions: { signOut, deleteAccount }
            };
        }

        // PHASE 5: EXISTENCE (The App — fully authenticated)
        const appMode: AppMode = walletStatus === 'RITUAL_READY' ? 'RITUAL' : 'NORMAL';

        hasRenderedApp.current = true;
        
        return {
            view: 'APP' as StartupView,
            appMode,
            data: { user, profile, isAdmin, message: undefined, guestMode: false, isFirstVisit: false },
            actions: { signOut, deleteAccount }
        };

    }, [
        authLoading, profileLoading,
        user, profile, isAdmin,
        walletStatus,
        isRegistering,
        isFirstVisit,
        signOut, deleteAccount
    ]);
};

