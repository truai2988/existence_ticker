import { useContext } from "react";
import { WalletContext } from "../contexts/WalletContextDefinition";

/**
 * Hook to access the Wallet Context
 * Separated from WalletContext.tsx to enable Fast Refresh for components
 */
export const useWalletContext = () => {
    const context = useContext(WalletContext);
    if (!context) {
        throw new Error("useWalletContext must be used within a WalletProvider");
    }
    return context;
};
