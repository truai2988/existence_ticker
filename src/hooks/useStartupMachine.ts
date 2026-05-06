import { useAuth } from "./useAuthHook";
import { useProfile } from "./useProfile";
import { useWallet } from "./useWallet";
import { useMemo } from "react";
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
            return {
                view: 'APP' as StartupView,
                appMode: 'NORMAL' as AppMode,
                data: { user: null, profile: null, isAdmin: false, guestMode: true, isFirstVisit },
                actions: { signOut, deleteAccount }
            };
        }

        // PHASE 3: AUTHENTICATED but profile loading
        if (profileLoading) {
            return {
                view: 'LOADING' as StartupView,
                appMode: 'NORMAL' as AppMode,
                data: { user, profile: null, isAdmin: false, guestMode: false, isFirstVisit: false },
                actions: { signOut, deleteAccount }
            };
        }

        // PHASE 4: GHOST / PENDING PROFILE
        if (!profile) {
            // If it's a known ghost or we're in the middle of registering
            // stay in LOADING to avoid showing broken APP
            return {
                view: 'LOADING' as StartupView,
                appMode: 'NORMAL' as AppMode,
                data: { 
                    user, 
                    profile: null, 
                    isAdmin,
                    message: (isRegistering || (window as { __isRegistering?: boolean }).__isRegistering) ? "新しい存在を刻んでいます..." : "接続を確認しています...",
                    guestMode: false,
                    isFirstVisit: false,
                },
                actions: { signOut, deleteAccount }
            };
        }

        // PHASE 5: EXISTENCE (The App — fully authenticated)
        const appMode: AppMode = walletStatus === 'RITUAL_READY' ? 'RITUAL' : 'NORMAL';

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

