import { useWalletContext } from "../contexts/WalletContext";

// Re-export types
export type { WalletStatus } from "../contexts/WalletContext";

export const useWallet = () => {
    return useWalletContext();
};
