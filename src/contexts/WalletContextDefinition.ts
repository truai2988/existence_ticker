import { createContext } from "react";
import { WalletStatus } from "../types/wallet";

// Types
export interface WalletContextType {
    balance: number;
    committedLm: number;
    availableLm: number;
    status: WalletStatus;
    pay: (amount: number) => Promise<boolean>;
    performRebirthReset: (options: { userInitiated: boolean }) => Promise<{ success: boolean; newBalance?: number }>;
    isLoading: boolean;
    globalNow: number;
    optimisticBalanceOffset: number;
    setOptimisticBalanceOffset: (val: number | ((prev: number) => number)) => void;
    optimisticCommittedOffset: number;
    setOptimisticCommittedOffset: (val: number | ((prev: number) => number)) => void;
}

// Context
export const WalletContext = createContext<WalletContextType | undefined>(undefined);
