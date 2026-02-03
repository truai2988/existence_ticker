import React, { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { X, Heart, ScanLine } from 'lucide-react';
import { ScannerView } from './ScannerView';
import { DonationModal } from './DonationModal';

import { useScanProcessor } from '../hooks/useScanProcessor';
import { UserSubBar } from './UserSubBar';

interface GiftViewProps {
    onClose: () => void;
}

type ModalState = 'none' | 'scan' | 'gift_amount';

export const GiftView: React.FC<GiftViewProps> = ({ onClose }) => {
    const [modalState, setModalState] = useState<ModalState>('none'); 
    const [recipient, setRecipient] = useState<{ id: string, name: string } | null>(null);
    const { processScan } = useScanProcessor();

    const handleScanResult = async (scannedId: string) => {
        setModalState('none');
        const result = await processScan(scannedId);
        setRecipient(result.user);
        setModalState('gift_amount');
    };

    return (
        <div className="fixed inset-0 z-[60] bg-slate-50 flex flex-col w-full h-full">
            {/* Header Container */}
            <div className="w-full bg-white/80 backdrop-blur-md border-b border-slate-200 shrink-0 z-10 pt-safe">
                <div className="max-w-md mx-auto px-6 h-[90px] flex flex-col justify-start pt-3">
                    <div className="flex justify-between items-center w-full">
                        <div>
                             <h2 className="text-lg font-bold font-sans text-slate-900 flex items-center gap-2">
                                <Heart className="text-pink-500 fill-pink-50 w-5 h-5" />
                                直接贈る
                             </h2>
                             <p className="text-[11px] text-slate-500 font-mono tracking-widest uppercase">Pure Gift</p>
                        </div>
                        <div className="flex items-center gap-3">
                             <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                                 <X size={20} className="text-slate-400" />
                             </button>
                        </div>
                    </div>
                </div>
            </div>
            <UserSubBar />

            {/* Content Container */}
            <div className="flex-1 w-full overflow-y-auto">
                <div className="max-w-md mx-auto flex flex-col items-center pt-20 p-6 gap-8">
                    <div className="text-center space-y-4 max-w-xs bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                        <h3 className="text-lg font-bold text-slate-800">感謝を届ける</h3>
                        <p className="text-sm text-slate-500 leading-relaxed">
                            依頼を通さず、あなたのLmを<br/>
                            そのまま相手に贈ります。<br/>
                            <span className="text-xs mt-2 block text-slate-400">見返りを求めない、純粋なエネルギーの散逸です。</span>
                        </p>
                    </div>

                    <button 
                        onClick={() => setModalState('scan')}
                        className="w-full max-w-xs py-5 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-xl shadow-pink-200 hover:shadow-pink-300 hover:scale-[1.02] active:scale-[0.98] transition-all flex flex-col items-center gap-2"
                    >
                        <ScanLine size={32} />
                        <span className="font-bold text-lg">QRコードをスキャン</span>
                    </button>
                </div>
            </div>

            <AnimatePresence>
                {modalState === 'scan' && (
                    <ScannerView 
                        onClose={() => setModalState('none')}
                        onScan={handleScanResult}
                    />
                )}

                {modalState === 'gift_amount' && recipient && (
                    <DonationModal
                        targetUserName={recipient.name}
                        onSelectAmount={(amount) => {
                            alert(`Sent ${amount} to ${recipient.id}`);
                            onClose(); 
                        }}
                        onCancel={() => setModalState('none')} 
                    />
                )}
            </AnimatePresence>
        </div>
    );
};