import React from 'react';
import { motion } from 'framer-motion';
import { Gift, Heart, Sparkles, User, X } from 'lucide-react';
import { UNIT_LABEL } from '../constants';

interface DonationModalProps {
  targetUserName: string;
  onSelectAmount: (amount: number) => void;
  onCancel: () => void;
}

type PaymentPreset = {
    id: 'light' | 'medium' | 'heavy';
    amount: number;
    label: string;
    subLabel: string;
    icon: React.ReactNode;
    color: string;
    bg: string;
};

const PRESETS: PaymentPreset[] = [
    { 
        id: 'light', 
        amount: 100, 
        label: '軽いお礼', 
        subLabel: 'ささやかな感謝',
        icon: <Gift size={18} />, 
        color: 'text-amber-500',
        bg: 'bg-amber-100'
    },
    { 
        id: 'medium', 
        amount: 500, 
        label: 'しっかりしたお礼', 
        subLabel: '心からの敬意',
        icon: <Heart size={18} />, 
        color: 'text-pink-500',
        bg: 'bg-pink-100'
    },
    { 
        id: 'heavy', 
        amount: 1000, 
        label: '特別な感謝', 
        subLabel: '深い愛と祝福',
        icon: <Sparkles size={18} />, 
        color: 'text-purple-500',
        bg: 'bg-purple-100'
    },
];

export const DonationModal: React.FC<DonationModalProps> = ({ targetUserName, onSelectAmount, onCancel }) => {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
        {/* Backdrop */}
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" onClick={onCancel}></div>
        
        <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            className="w-full max-w-sm relative z-10 bg-white rounded-2xl p-6 shadow-2xl flex flex-col gap-6"
        >
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-slate-50 rounded-full text-slate-400">
                        <Gift size={20} />
                    </div>
                    <span className="font-bold text-slate-800">Lmを贈る</span>
                </div>
                <button onClick={onCancel} className="p-2 text-slate-400 hover:bg-slate-50 rounded-full transition-colors">
                    <X size={20} />
                </button>
            </div>

            <div className="w-full">
                {/* Recipient Info */}
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl mb-6 border border-slate-100">
                    <div className="p-2 bg-white rounded-full shadow-sm">
                        <User size={16} className="text-slate-500" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">宛先</span>
                        <span className="text-sm font-bold text-slate-700">{targetUserName}</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-3 mb-4">
                {PRESETS.map(preset => (
                    <button
                        key={preset.id}
                        onClick={() => onSelectAmount(preset.amount)}
                        className="relative flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-md hover:bg-white bg-white transition-all group active:scale-[0.99]"
                    >
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-full flex items-center justify-center ${preset.bg} ${preset.color}`}>
                                {preset.icon}
                            </div>
                            <div className="text-left flex flex-col">
                                <span className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                                    {preset.label}
                                </span>
                                <span className="text-[10px] text-slate-500">
                                    {preset.subLabel}
                                </span>
                            </div>
                        </div>
                        <span className="font-mono font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                            {preset.amount} <span className="text-[10px] font-sans text-slate-400">{UNIT_LABEL}</span>
                        </span>
                    </button>
                ))}
                </div>
                
                <p className="text-center text-[10px] text-slate-400">
                    選択すると即座に送金されます
                </p>
            </div>
        </motion.div>
    </div>
  );
};
