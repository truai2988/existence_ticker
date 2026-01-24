import React from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import QRCode from "react-qr-code";

interface QrDisplayModalProps {
  onClose: () => void;
  userId?: string;
}

export const QrDisplayModal: React.FC<QrDisplayModalProps> = ({ onClose, userId = "user-id-mock-for-mvp" }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-md animate-fade-in">
        <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="flex flex-col items-center gap-6 relative w-full max-w-sm"
        >
             <button onClick={onClose} className="absolute -top-12 right-0 p-2 text-gray-500 hover:text-white z-10">
                <X size={24} />
            </button>

            <h3 className="text-gold-200 text-sm tracking-widest uppercase">あなたの存在 (光)</h3>
            
            <div className="p-6 bg-gray-900/80 rounded-2xl border border-gold-400/30 shadow-[0_0_50px_rgba(251,192,45,0.15)] relative">
                {/* Glow effect behind QR */}
                <div className="absolute inset-0 bg-gold-400/10 blur-xl rounded-xl"></div>
                <div className="relative z-10 bg-white p-2 rounded-lg">
                    <QRCode 
                        value={userId} 
                        size={200}
                        fgColor="#000000"
                        bgColor="#FFFFFF"
                    />
                </div>
            </div>
            
            <p className="text-xs text-gray-400 max-w-xs text-center font-serif leading-relaxed">
                この輝きを、誰かが見つけるのを待っています。<br/>
                <span className="text-gold-500/50">ID: {userId}</span>
            </p>

            <button onClick={onClose} className="text-gray-500 text-sm hover:text-white mt-4 border border-white/10 px-6 py-2 rounded-full">
                閉じる
            </button>
        </motion.div>
    </div>
  );
};
