import { useAuth } from "./useAuthHook";
import { useProfile } from "./useProfile";
import { useWallet } from "./useWallet";
import { useMemo } from "react";
import { User } from 'firebase/auth';
import { UserProfile } from '../types';

// The 3 Discrete Views of Existence
export type StartupView = 
  | 'LOADING'   // White Void (Booting / Checking)
  | 'GATE'      // Entrance (Unauthenticated)
  | 'APP';      // The World (Main Application)

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

    // 2. The Deterministic State Machine
    return useMemo((): StartupResult => {
        // PHASE 1: LOADING
        if (authLoading || profileLoading) {
            return {
                view: 'LOADING' as StartupView,
                appMode: 'NORMAL' as AppMode,
                data: { user: null, profile: null, isAdmin: false },
                actions: { signOut, deleteAccount }
            };
        }

        // PHASE 2: AUTHENTICATION CHECK
        if (!user) {
            return {
                view: 'GATE' as StartupView,
                appMode: 'NORMAL' as AppMode,
                data: { user: null, profile: null, isAdmin: false },
                actions: { signOut, deleteAccount }
            };
        }

        // PHASE 3: GHOST / PENDING PROFILE
        if (!profile) {
            // If it's a known ghost or we're in the middle of registering
            // stay in LOADING to avoid showing GATE or broken APP
            return {
                view: 'LOADING' as StartupView,
                appMode: 'NORMAL' as AppMode,
                data: { 
                    user, 
                    profile: null, 
                    isAdmin,
                    message: (isRegistering || (window as { __isRegistering?: boolean }).__isRegistering) ? "新しい存在を刻んでいます..." : "接続を確認しています..."
                },
                actions: { signOut, deleteAccount }
            };
        }

        // PHASE 4: EXISTENCE (The App)
        const appMode: AppMode = walletStatus === 'RITUAL_READY' ? 'RITUAL' : 'NORMAL';

        return {
            view: 'APP' as StartupView,
            appMode,
            data: { user, profile, isAdmin, message: undefined },
            actions: { signOut, deleteAccount }
        };

    }, [
        authLoading, profileLoading,
        user, profile, isAdmin,
        walletStatus,
        isRegistering,
        signOut, deleteAccount
    ]);
};
