import { useAuth } from "./useAuthHook";
import { useProfile } from "./useProfile";
import { useWallet } from "./useWallet";
import { useSeasonalEvent } from "./useSeasonalEvent";
import { useMemo, useState, useEffect } from "react";

// The 4 Discrete Views of Existence (GHOST removed - brain handles it)
export type StartupView = 
  | 'LOADING'   // White Void (Booting / Checking)
  | 'GATE'      // Entrance (Unauthenticated)
  | 'EVENT'     // Seasonal Revelation
  | 'APP';      // The World (Main Application)

// The Two Modes of the App
export type AppMode = 'NORMAL' | 'RITUAL';

export const useStartupMachine = () => {
    // 1. Ingest all raw signals from sensors (no judgment)
    const { user, loading: authLoading, signOut, deleteAccount } = useAuth();
    const { profile, isLoading: profileLoading } = useProfile();
    const { status: walletStatus } = useWallet(); 
    const { eventData, isChecking: eventChecking, completeEvent } = useSeasonalEvent();

    // 2. Brain-exclusive state: GHOST detection timer
    const [ghostTimer, setGhostTimer] = useState<NodeJS.Timeout | null>(null);
    const [isGhostPurging, setIsGhostPurging] = useState(false);

    // 3. GHOST Detection & Purge Logic (Brain's exclusive judgment)
    useEffect(() => {
        // Condition: Auth loaded, Profile loaded, user exists, but profile is null
        // This is a GHOST state - but we give 2 seconds grace period
        if (!authLoading && !profileLoading && user && !profile && !isGhostPurging && !ghostTimer) {
            console.warn("[StateMachine] GHOST suspected - starting 2s grace period");
            
            const timer = setTimeout(async () => {
                console.error("[StateMachine] GHOST confirmed after 2s - purging Auth");
                setIsGhostPurging(true);
                try {
                    await deleteAccount();
                } catch (error) {
                    console.error("[StateMachine] Failed to purge GHOST:", error);
                }
            }, 2000);  // 2 second grace period
            
            setGhostTimer(timer);
        } else if (profile && ghostTimer) {
            // Profile found during grace period - cancel purge
            console.log("[StateMachine] Profile found - canceling GHOST purge");
            clearTimeout(ghostTimer);
            setGhostTimer(null);
        }

        return () => {
            if (ghostTimer) {
                clearTimeout(ghostTimer);
            }
        };
    }, [authLoading, profileLoading, user, profile, isGhostPurging, ghostTimer, deleteAccount]);

    // 4. The Deterministic State Machine
    // We derive the current visual state purely from the inputs.
    // Order of operations is CRITICAL.
    
    return useMemo(() => {
        // PHASE 1: LOADING
        // If any core system is loading, OR we are purging a ghost, show LOADING
        if (authLoading || profileLoading || eventChecking || isGhostPurging) {
            return {
                view: 'LOADING' as StartupView,
                appMode: 'NORMAL' as AppMode,
                data: { user: null, profile: null, eventData: null },
                actions: { signOut, completeEvent, deleteAccount }
            };
        }

        // PHASE 2: AUTHENTICATION CHECK
        // Loading is done. Do we have a user?
        if (!user) {
            return {
                view: 'GATE' as StartupView,
                appMode: 'NORMAL' as AppMode,
                data: { user: null, profile: null, eventData: null },
                actions: { signOut, completeEvent, deleteAccount }
            };
        }

        // PHASE 3: GHOST GRACE PERIOD
        // We have user but no profile - if timer is active, stay in LOADING
        if (!profile && ghostTimer) {
            return {
                view: 'LOADING' as StartupView,
                appMode: 'NORMAL' as AppMode,
                data: { user, profile: null, eventData: null },
                actions: { signOut, completeEvent, deleteAccount }
            };
        }

        // PHASE 4: SEASONAL INTERVENTION
        // Profile exists. Is there a mandatory event?
        if (eventData && profile) {
            return {
                view: 'EVENT' as StartupView,
                appMode: 'NORMAL' as AppMode,
                data: { user, profile, eventData },
                actions: { signOut, completeEvent, deleteAccount }
            };
        }

        // PHASE 5: EXISTENCE (The App)
        // All checks passed. We are ready to render the world.
        
        if (!profile) {
            // Edge case: profile is null but no timer (shouldn't happen)
            // Fall back to LOADING
            console.warn("[StateMachine] Unexpected state: no profile, no timer");
            return {
                view: 'LOADING' as StartupView,
                appMode: 'NORMAL' as AppMode,
                data: { user, profile: null, eventData: null },
                actions: { signOut, completeEvent, deleteAccount }
            };
        }

        const appMode: AppMode = walletStatus === 'RITUAL_READY' ? 'RITUAL' : 'NORMAL';

        return {
            view: 'APP' as StartupView,
            appMode,
            data: { user, profile, eventData: null },
            actions: { signOut, completeEvent, deleteAccount }
        };

    }, [
        authLoading, profileLoading, eventChecking, isGhostPurging, // Loading flags
        user, profile,                                              // Data existence
        eventData,                                                  // Events
        walletStatus,                                               // Business Logic status
        ghostTimer,                                                 // Brain's timer state
        signOut, completeEvent, deleteAccount                       // Dependencies
    ]);
};