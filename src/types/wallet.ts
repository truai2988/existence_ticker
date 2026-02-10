/**
 * Wallet Status Types
 * Separated from WalletContext to enable Fast Refresh for components
 */

export type WalletStatus = 'INITIALIZING' | 'ALIVE' | 'EMPTY' | 'RITUAL_READY' | 'GHOST';
