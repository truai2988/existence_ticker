import { useAuth } from "./useAuthHook";
import { useProfile } from "./useProfile";
import { useWallet } from "./useWallet";
import { useSeasonalEvent, SeasonalEventData } from "./useSeasonalEvent";
import { useMemo, useState, useEffect, useRef } from "react";
import { User } from 'firebase/auth';
import { UserProfile } from '../types';

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

    // 2. Brain-exclusive state: GHOST detection timer
    const ghostTimerRef = useRef<NodeJS.Timeout | null>(null);
    const purgeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const [isGhostGracePeriod, setIsGhostGracePeriod] = useState(false);
    const [isGhostPurging, setIsGhostPurging] = useState(false);
    const [purgeMessage, setPurgeMessage] = useState<string | undefined>(undefined);

    // 3. GHOST Detection & Purge Logic (Brain's exclusive judgment)
    useEffect(() => {
        // Condition: Auth loaded, Profile loaded, user exists, but profile is null
        const isGhostDetected = !authLoading && !profileLoading && user && !profile && !isGhostPurging;
        
        // 1. Protection: If we are currently in the middle of a registration, NEVER purge.
        if (window.__isRegistering || isRegistering || !isGhostDetected) {
            if (ghostTimerRef.current) {
                clearTimeout(ghostTimerRef.current);
                ghostTimerRef.current = null;
            }
            if (isGhostGracePeriod) setIsGhostGracePeriod(false);
            return;
        }

        // Handle Grace Period start
        if (isGhostDetected && !isGhostGracePeriod && !ghostTimerRef.current) {
            console.warn("[StateMachine] GHOST suspected - starting 2s grace period");
            setIsGhostGracePeriod(true);
            
            ghostTimerRef.current = setTimeout(async () => {
                // Secondary check: Did registration start or profile arrive during the timeout?
                if (window.__isRegistering || isRegistering) {
                    setIsGhostGracePeriod(false);
                    ghostTimerRef.current = null;
                    return;
                }

                console.error("[StateMachine] GHOST confirmed - executing strict removal");
                setIsGhostGracePeriod(false);
                setIsGhostPurging(true);
                setPurgeMessage("システムを最適化中...");

                // Safety Timeout: If purge takes more than 10s, force logout
                const safety = setTimeout(async () => {
                    console.error("[StateMachine] Purge timed out - forcing sign out");
                    await signOut();
                    setIsGhostPurging(false);
                    setPurgeMessage(undefined);
                }, 10000);
                purgeTimeoutRef.current = safety;

                try {
                    sessionStorage.setItem('ghost_pured_feedback_needed', 'true');
                    await deleteAccount();
                } catch (error) {
                    console.error("[StateMachine] Failed to purge GHOST:", error);
                    await signOut();
                } finally {
                    setIsGhostPurging(false);
                    setPurgeMessage(undefined);
                    if (purgeTimeoutRef.current) clearTimeout(purgeTimeoutRef.current);
                    purgeTimeoutRef.current = null;
                    ghostTimerRef.current = null;
                }
            }, 2000);
        }

        return () => {
            // No automatic cleanup here to keep the async chain stable
        };
    }, [authLoading, profileLoading, user, profile, isGhostPurging, isGhostGracePeriod, isRegistering, deleteAccount, signOut]);

    // 4. The Deterministic State Machine
    // We derive the current visual state purely from the inputs.
    // Order of operations is CRITICAL.
    
    return useMemo((): StartupResult => {
        // PHASE 1: LOADING
        // If any core system is loading, OR we are purging a ghost, show LOADING
        if (authLoading || profileLoading || eventChecking || isGhostPurging) {
            return {
                view: 'LOADING' as StartupView,
                appMode: 'NORMAL' as AppMode,
                data: { 
                    user: null, 
                    profile: null, 
                    eventData: null,
                    message: authLoading ? "魂を呼び覚ましています..." : 
                             profileLoading ? "記憶を辿っています..." : 
                             isGhostPurging ? (purgeMessage || "修復を試みています...") : "世界を整えています..."
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
                    message: (isRegistering || window.__isRegistering) ? "新しい存在を刻んでいます..." : "再接続を待っています..."
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
        authLoading, profileLoading, eventChecking, isGhostPurging, // Loading flags
        user, profile,                                              // Data existence
        eventData,                                                  // Events
        walletStatus,                                               // Business Logic status
        isGhostGracePeriod,                                         // Brain's timer state
        purgeMessage,                                               // Purge message
        isRegistering,                                              // Registration status
        signOut, completeEvent, deleteAccount                       // Dependencies
    ]);
};