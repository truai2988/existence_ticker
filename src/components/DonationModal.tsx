import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Star, Sun } from 'lucide-react';

interface DonationModalProps {
  targetUserName: string;
  onSelectAmount: (amount: number) => void;
  onCancel: () => void;
}

type PaymentPreset = {
    id: 'light' | 'medium' | 'heavy';
    amount: number;
    label: string;
    icon: React.ReactNode;
    color: string;
};

const PRESETS: PaymentPreset[] = [
    { id: 'light', amount: 100, label: '淡い光', icon: <Sparkles size={16} />, color: 'shadow-blue-500/50 hover:shadow-blue-500/80' },
    { id: 'medium', amount: 500, label: '確かな輝き', icon: <Star size={16} />, color: 'shadow-gold-500/50 hover:shadow-gold-500/80' },
    { id: 'heavy', amount: 1000, label: '太陽の恵み', icon: <Sun size={16} />, color: 'shadow-orange-500/50 hover:shadow-orange-500/80' },
];

export const DonationModal: React.FC<DonationModalProps> = ({ targetUserName, onSelectAmount, onCancel }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
        <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -20, opacity: 0 }}
        className="w-full max-w-sm relative bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-2xl flex flex-col gap-6"
        >
            <div className="text-center w-full">
                <h3 className="text-lg font-serif text-white mb-2">感謝を贈る</h3>
                <p className="text-xs text-gray-500 mb-6 font-mono">To: {targetUserName}</p>

                <div className="grid grid-cols-1 gap-4 mb-6">
                {PRESETS.map(preset => (
                    <button
                        key={preset.id}
                        onClick={() => onSelectAmount(preset.amount)}
                        className="relative flex items-center justify-between p-4 rounded-xl border border-white/10 hover:border-gold-400/50 bg-white/5 hover:bg-white/10 transition-all group"
                    >
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-full bg-black border border-white/10 shadow-[0_0_10px_rgba(255,255,255,0.1)] ${preset.color} group-hover:scale-110 transition-transform duration-500`}>
                                {preset.icon}
                            </div>
                            <div className="text-left">
                                <span className="block text-sm font-medium text-gray-200">{preset.label}</span>
                                <span className="text-[10px] text-gray-500">
                                    {preset.id === 'light' ? 'ささやかな感謝' : preset.id === 'medium' ? '心からの敬意' : '深い愛と祝福'}
                                </span>
                            </div>
                        </div>
                        <span className="font-mono text-gold-400">{preset.amount} Pt</span>
                    </button>
                ))}
                </div>
                
                <button onClick={onCancel} className="text-gray-500 text-sm hover:text-white w-full py-2">
                キャンセル
                </button>
            </div>
        </motion.div>
    </div>
  );
};
