import { createContext } from "react";
import { WalletStatus } from "../types/wallet";

// Types
export interface WalletContextType {
    balance: number;
    committedLm: number;
    availableLm: number;
    status: WalletStatus;
    pay: (amount: number) => Promise<boolean>;
    performRebirthReset: () => Promise<{ success: boolean; newBalance?: number }>;
    isLoading: boolean;
}

// Context
export const WalletContext = createContext<WalletContextType | undefined>(undefined);
