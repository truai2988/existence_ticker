import { useAuth } from "./useAuthHook";
import { useProfile } from "./useProfile";
import { useWallet } from "./useWallet";
import { useSeasonalEvent } from "./useSeasonalEvent";
import { useMemo } from "react";

// The 5 Discrete Views of Existence
export type StartupView = 
  | 'LOADING'   // White Void (Booting / Checking)
  | 'GATE'      // Entrance (Unauthenticated)
  | 'GHOST'     // Error State (Authenticated but No Profile)
  | 'EVENT'     // Seasonal Revelation
  | 'APP';      // The World (Main Application)

// The Two Modes of the App
export type AppMode = 'NORMAL' | 'RITUAL';

export const useStartupMachine = () => {
    // 1. Ingest all raw signals
    const { user, loading: authLoading, signOut, deleteAccount } = useAuth();
    const { profile, isLoading: profileLoading } = useProfile();
    const { status: walletStatus } = useWallet(); 
    // note: walletStatus already handles 'INITIALIZING' and 'GHOST' internally based on profile/user, 
    // but the machine will make its own authoritative decision to be explicit.
    const { eventData, isChecking: eventChecking, completeEvent } = useSeasonalEvent();

    // 2. The Deterministic State Machine
    // We derive the current visual state purely from the inputs.
    // Order of operations is CRITICAL.
    
    return useMemo(() => {
        // STATE 1: BOOT & LOADING
        // If any core system is loading, we show White Void.
        // We prioritize this to prevent "FOUC" (Flash of Unstyled Content) or "FOC" (Flash of Content).
        if (authLoading || profileLoading || eventChecking) {
            return {
                view: 'LOADING' as StartupView,
                appMode: 'NORMAL' as AppMode, // Default
                data: { user: null, profile: null, eventData: null },
                actions: { signOut, completeEvent, deleteAccount }
            };
        }

        // STATE 2: AUTHENTICATION CHECK
        // Loading is done. Do we have a user?
        if (!user) {
            return {
                view: 'GATE' as StartupView,
                appMode: 'NORMAL' as AppMode,
                data: { user: null, profile: null, eventData: null },
                actions: { signOut, completeEvent, deleteAccount }
            };
        }

        // STATE 3: PROFILE INTEGRITY CHECK (Paradox Resolution)
        // We have a User, but do we have a Profile?
        // Note: useProfile would have returned isLoading=true if it was still fetching.
        // So if we are here, loading is done.
        if (!profile) {
            // AUTHENTICATED BUT NO PROFILE -> GHOST
            return {
                view: 'GHOST' as StartupView,
                appMode: 'NORMAL' as AppMode,
                data: { user, profile: null, eventData: null },
                actions: { signOut, completeEvent, deleteAccount }
            };
        }

        // STATE 4: SEASONAL INTERVENTION
        // Profile exists. Is there a mandatory event?
        // The events are specific revelations that override the daily routine.
        if (eventData) {
            return {
                view: 'EVENT' as StartupView,
                appMode: 'NORMAL' as AppMode, // Irrelevant for event but required for type
                data: { user, profile, eventData },
                actions: { signOut, completeEvent, deleteAccount }
            };
        }

        // STATE 5: EXISTENCE (The App)
        // All checks passed. We are ready to render the world.
        // Determine the "Mode" of the world based on Wallet Status.
        
        // RITUAL_READY takes precedence: The world awaits the ritual.
        const appMode: AppMode = walletStatus === 'RITUAL_READY' ? 'RITUAL' : 'NORMAL';

        return {
            view: 'APP' as StartupView,
            appMode,
            data: { user, profile, eventData: null },
            actions: { signOut, completeEvent, deleteAccount }
        };

    }, [
        authLoading, profileLoading, eventChecking, // Loading flags
        user, profile,                              // Data existence
        eventData,                                  // Events
        walletStatus,                               // Business Logic status
        signOut, completeEvent, deleteAccount       // Dependencies
    ]);
};
