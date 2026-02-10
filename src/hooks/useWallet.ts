import { useWalletContext } from "./useWalletContext";

// Re-export types
export type { WalletStatus } from "../types/wallet";

export const useWallet = () => {
    return useWalletContext();
};
