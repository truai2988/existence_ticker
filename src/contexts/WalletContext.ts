import { createContext } from "react";
import { WalletStatus } from "../types/wallet";

/**
 * Wallet Context Type Definition
 * Separated from WalletContext.tsx to enable Fast Refresh
 */
export interface WalletContextType {
    balance: number;
    committedLm: number;
    availableLm: number;
    status: WalletStatus;
    pay: (amount: number) => Promise<boolean>;
    performRebirthReset: () => Promise<{ success: boolean; newBalance?: number }>;
    isLoading: boolean;
}

/**
 * Wallet Context Definition
 * Context creation is separated from the Provider component
 */
export const WalletContext = createContext<WalletContextType | undefined>(undefined);

/**
 * Re-export WalletProvider from WalletContext.tsx
 * Vite resolves .ts before .tsx, so we need to re-export here
 */
export { WalletProvider } from "./WalletContext.tsx";
