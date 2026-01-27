import React, { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { X, Heart, ScanLine } from 'lucide-react';
import { ScannerView } from './ScannerView';
import { DonationModal } from './DonationModal';
import { useScanProcessor } from '../hooks/useScanProcessor';

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
        <div className="flex-1 flex flex-col pt-24 pb-safe min-h-full bg-slate-50 animate-fade-in">
            <div className="px-6 py-4 shrink-0 flex justify-between items-center">
                <div>
                     <h2 className="text-xl font-bold font-sans text-slate-900 flex items-center gap-2">
                        <Heart className="text-pink-500 fill-pink-50" />
                        直接贈る
                     </h2>
                     <p className="text-xs text-slate-500 font-mono tracking-widest uppercase">Pure Gift</p>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                    <X className="text-slate-500" />
                </button>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center p-6 gap-8">
                <div className="text-center space-y-2 max-w-xs">
                    <h3 className="text-lg font-bold text-slate-700">感謝を届ける</h3>
                    <p className="text-sm text-slate-500 leading-relaxed">
                        依頼を通さず、あなたのLmを<br/>
                        そのまま相手に贈ります。<br/>
                        見返りを求めない、純粋なエネルギーの散逸です。
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