import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, Type } from 'lucide-react';
import { DonationModal } from './DonationModal';
import { ScannerView } from './ScannerView'; 
import { CreateWishModal } from './CreateWishModal';
import { AnimatePresence } from 'framer-motion';

interface GiveMenuProps {
    onClose: () => void;
    currentUserId: string;
}

export const GiveMenu: React.FC<GiveMenuProps> = ({ onClose, currentUserId }) => {
    // Suppress unused warning for now
    void currentUserId;
    const [subState, setSubState] = useState<'menu' | 'scan' | 'gift_amount' | 'create_wish'>('menu');
    const [recipient, setRecipient] = useState<{ id: string, name: string } | null>(null);

    // 1. Menu Selection
    if (subState === 'menu') {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in" onClick={onClose}>
                <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex gap-6 pointer-events-auto"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Make a Wish */}
                    <button 
                        onClick={() => setSubState('create_wish')}
                        className="w-40 h-40 rounded-2xl bg-slate-900 border border-slate-700 hover:border-gold-500/50 hover:bg-slate-800 flex flex-col items-center justify-center gap-4 group transition-all"
                    >
                        <div className="p-4 rounded-full bg-black border border-slate-800 group-hover:border-gold-400">
                             <Type className="text-gold-500" />
                        </div>
                        <span className="text-sm font-bold text-slate-300 group-hover:text-white">願いを放つ</span>
                        <span className="text-[10px] text-slate-500">Create Wish</span>
                    </button>

                    {/* Give Light (Gift) */}
                    <button 
                        onClick={() => setSubState('scan')}
                        className="w-40 h-40 rounded-2xl bg-slate-900 border border-slate-700 hover:border-blue-500/50 hover:bg-slate-800 flex flex-col items-center justify-center gap-4 group transition-all"
                    >
                        <div className="p-4 rounded-full bg-black border border-slate-800 group-hover:border-blue-400">
                             <Send className="text-blue-500" />
                        </div>
                        <span className="text-sm font-bold text-slate-300 group-hover:text-white">光を贈る</span>
                        <span className="text-[10px] text-slate-500">Direct Gift</span>
                    </button>
                </motion.div>
            </div>
        );
    }

    // 2. Scan to find Recipient (for Gift)
    if (subState === 'scan') {
        return (
            <ScannerView 
                onClose={onClose} 
                onScan={async (scannedId) => {
                    // Mock user lookup for now, or assume ID is valid
                    // In real app, we fetch user name here.
                    setRecipient({ id: scannedId, name: "Unknown Soul" });
                    setSubState('gift_amount');
                }} 
            />
        );
    }

    // 3. Amount Selection (DonationModal)
    if (subState === 'gift_amount' && recipient) {
        return (
            <DonationModal
                targetUserName={recipient.name}
                onSelectAmount={(amount) => {
                    // Trigger actual transfer in App or Context
                    // For now just alert and close
                    alert(`Stub: Transfering ${amount} to ${recipient.id}`);
                    onClose();
                }}
                onCancel={() => setSubState('menu')} 
            />
        );
    }
    
    // 4. Create Wish (Modal)
    if (subState === 'create_wish') {
        return (
            <AnimatePresence>
                <CreateWishModal onClose={onClose} />
            </AnimatePresence>
        );
    }

    return null;
};
