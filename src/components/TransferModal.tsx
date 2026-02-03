import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Scan, QrCode, ArrowLeftRight, X, Sparkles, Star, Sun, Zap } from 'lucide-react';
import QRCode from "react-qr-code";
import { Scanner } from '@yudiel/react-qr-scanner';

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTransfer: (amount: number, target: string) => void;
  totalAvailable: number;
  initialTargetId?: string; // Optional: If opening from Wishes
}

interface IScanResult {
    rawValue: string;
    format?: string;
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

export const TransferModal: React.FC<TransferModalProps> = ({ isOpen, onClose, onTransfer, totalAvailable, initialTargetId }) => {
  const [mode, setMode] = useState<'menu' | 'give' | 'receive' | 'confirm' | 'success'>('menu');
  const [scannedData, setScannedData] = useState<string | null>(null);
  const [amount, setAmount] = useState<number>(0);
  const [feedback, setFeedback] = useState<{balance: number, mint: number, xp: number} | null>(null);
  const [sourceType, setSourceType] = useState<'balance' | 'mint' | 'mixed'>('mixed');

  // Reset state when opened
  useEffect(() => {
    if (isOpen) {
        if (initialTargetId) {
            setScannedData(initialTargetId);
            setMode('confirm');
        } else {
            setMode('menu');
            setScannedData(null);
        }
        setFeedback(null);
        setSourceType('mixed');
    }
  }, [isOpen, initialTargetId]);


  const handleScan = (detected: IScanResult[]) => {
    if (detected && detected.length > 0) {
        const value = detected[0].rawValue;
        if (value && !scannedData) {
            setScannedData(value);
            // Instead of auto-transfer, go to "Confirm/Select Amount" mode for P2P flow
            setMode('confirm');
        }
    }
  };

  const handlePresetSelect = (preset: PaymentPreset) => {
    // Dual-Source Logic Simulation
    const cost = preset.amount;
    const fromBalance = Math.min(totalAvailable, cost); // Deduct from balance first
    const fromMint = cost - fromBalance; // Mint the rest
    
    // Determine animation type
    if (fromMint === 0) setSourceType('balance');
    else if (fromBalance === 0) setSourceType('mint');
    else setSourceType('mixed'); // Mostly treated as balance visually + mint flash? Let's simplify: Dominant source?
    
    // Simplification for user requested "Distinct" feeling:
    // If ANY minting happens, it's a Creation act (White Flash).
    // If PURE balance, it's a Sacrifice act (Gold Flow).
    if (fromMint > 0) setSourceType('mint');
    else setSourceType('balance');

    setAmount(cost);
    setFeedback({
        balance: fromBalance,
        mint: fromMint,
        xp: Math.floor(fromBalance) // XP = Balance used
    });

    // Execute Transfer
    onTransfer(cost, scannedData || 'unknown');
    setMode('success');
  };


  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-sm relative overflow-hidden flex flex-col items-center"
      >
        <button onClick={onClose} className="absolute top-0 right-0 p-2 text-gray-500 hover:text-white z-10">
            <X size={24} />
        </button>

        <AnimatePresence mode='wait'>
            {/* MENU MODE */}
            {mode === 'menu' && (
                <motion.div 
                    key="menu"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="flex flex-col gap-6 w-full items-center"
                >
                    <h2 className="text-gold-100 text-xl font-thin tracking-widest uppercase">The Flow</h2>
                    
                    <button 
                        onClick={() => setMode('receive')}
                        className="w-full py-6 bg-gray-900/50 border border-gold-400/30 rounded-xl flex flex-col items-center gap-3 hover:bg-gold-900/20 transition-all group"
                    >
                        <QrCode className="w-8 h-8 text-gold-400 group-hover:scale-110 transition-transform" />
                        <span className="text-sm font-bold text-gray-300">存在を顕現させる</span>
                        <span className="text-xs text-gray-500">光を放つ (受け取る)</span>
                    </button>

                    <button 
                        onClick={() => setMode('give')}
                        className="w-full py-6 bg-gray-900/50 border border-white/10 rounded-xl flex flex-col items-center gap-3 hover:bg-white/5 transition-all group"
                    >
                        <Scan className="w-8 h-8 text-white group-hover:scale-110 transition-transform" />
                        <span className="text-sm font-bold text-gray-300">魂を探す</span>
                        <span className="text-xs text-gray-500">光を探す (贈る)</span>
                    </button>
                    
                    <div className="text-center mt-4">
                        <p className="text-xs text-gray-500 font-mono">所持エネルギー: {Math.floor(totalAvailable)} Pt</p>
                    </div>
                </motion.div>
            )}

            {/* RECEIVE MODE (QR Display) */}
            {mode === 'receive' && (
                <motion.div
                    key="receive"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center gap-6"
                >
                    <h3 className="text-gold-200 text-sm tracking-widest">あなたの光</h3>
                    <div className="p-4 bg-gray-900/80 rounded-xl border border-gold-400/30 shadow-[0_0_50px_rgba(251,192,45,0.15)] relative">
                        {/* Glow effect behind QR */}
                        <div className="absolute inset-0 bg-gold-400/10 blur-xl rounded-xl"></div>
                        <div className="relative z-10">
                            <QRCode 
                                value="user-id-mock-for-mvp" 
                                size={200}
                                fgColor="#FBBF24" // Gold 400
                                bgColor="transparent"
                            />
                        </div>
                    </div>
                    <p className="text-xs text-gray-400 max-w-xs text-center">
                        この輝きを、誰かが見つけるのを待っています。
                    </p>
                    <button onClick={() => setMode('menu')} className="text-gray-500 text-sm hover:text-white mt-4">
                        戻る
                    </button>
                </motion.div>
            )}

            {/* GIVE MODE (Scanner) */}
            {mode === 'give' && (
                <motion.div
                    key="give"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center gap-6 w-full"
                >
                    <h3 className="text-white text-sm tracking-widest animate-pulse">魂を探しています...</h3>
                    
                    <div className="w-64 h-64 border-2 border-gold-400/50 rounded-xl overflow-hidden relative shadow-[0_0_20px_rgba(251,192,45,0.2)]">
                         <Scanner 
                             onScan={(detected) => handleScan(detected as IScanResult[])}
                         />
                        {/* Custom Finder Overlay */}
                        <div className="absolute inset-0 border-2 border-gold-400 opacity-50 scale-75 animate-pulse"></div>
                    </div>

                    <div className="flex flex-col gap-2 items-center">
                        <p className="text-xs text-gray-500 text-center">
                            相手の「光」をフレームに収めてください。
                        </p>
                        {/* Debug/Manual Trigger for non-camera environments */}
                        <button 
                            onClick={() => handleScan([{rawValue: 'debug-target-user-id'}])}
                            className="mt-2 px-3 py-1 bg-gray-800 text-xs text-gray-500 rounded border border-gray-700 hover:text-white"
                        >
                            [DEBUG] 光を検知 (疑似スキャン)
                        </button>
                    </div>

                    <button onClick={() => setMode('menu')} className="text-gray-500 text-sm hover:text-white mt-4">
                        戻る
                    </button>
                </motion.div>
            )}

            {/* CONFIRM / PAYMENT MODE */}
            {mode === 'confirm' && (
                 <motion.div
                    key="confirm"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -20, opacity: 0 }}
                    className="text-center w-full"
                 >
                     <h3 className="text-lg font-serif text-white mb-2">感謝を贈る</h3>
                     <p className="text-xs text-gray-500 mb-8 font-mono">To: {scannedData}</p>

                     <div className="grid grid-cols-1 gap-4 mb-6">
                        {PRESETS.map(preset => (
                            <button
                                key={preset.id}
                                onClick={() => handlePresetSelect(preset)}
                                className="relative flex items-center justify-between p-4 rounded-xl border border-white/10 hover:border-gold-400/50 bg-white/5 hover:bg-white/10 transition-all group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`p-3 rounded-full bg-black border border-white/10 shadow-[0_0_10px_rgba(255,255,255,0.1)] ${preset.color} group-hover:scale-110 transition-transform duration-500`}>
                                        {preset.icon}
                                    </div>
                                    <div className="text-left">
                                        <span className="block text-sm font-medium text-gray-200">{preset.label}</span>
                                        <span className="text-[11px] text-gray-500">
                                            {preset.id === 'light' ? 'ささやかな感謝' : preset.id === 'medium' ? '心からの敬意' : '深い愛と祝福'}
                                        </span>
                                    </div>
                                </div>
                                <span className="font-mono text-gold-400">{preset.amount} Pt</span>
                            </button>
                        ))}
                     </div>
                     
                     <button onClick={() => setMode('menu')} className="text-gray-500 text-sm hover:text-white">
                        キャンセル
                     </button>
                 </motion.div>
            )}

            {/* SUCCESS MODE */}
            {mode === 'success' && (
                <motion.div 
                    key="success"
                    className="flex flex-col items-center text-center gap-6 w-full relative"
                >
                     {/* ANIMATION A: SACRIFICE (Gold Flow) */}
                     {sourceType === 'balance' && (
                         <div className="w-24 h-24 rounded-full bg-gold-400/10 flex items-center justify-center relative shadow-[0_0_30px_rgba(251,192,45,0.4)]">
                            <motion.div 
                                initial={{ scale: 0 }} animate={{ scale: 1.5, opacity: 0 }} transition={{ duration: 1.5, repeat: Infinity }}
                                className="absolute inset-0 border border-gold-400/50 rounded-full"
                            ></motion.div>
                            <ArrowLeftRight className="w-10 h-10 text-gold-400 relative z-10" />
                            {/* Particles */}
                            <div className="absolute inset-0 flex items-center justify-center">
                                <motion.div initial={{ y: 0, opacity: 1 }} animate={{ y: -50, opacity: 0 }} transition={{ duration: 1 }} className="absolute w-1 h-1 bg-gold-400 rounded-full"></motion.div>
                                <motion.div initial={{ x: 0, opacity: 1 }} animate={{ x: 50, opacity: 0 }} transition={{ duration: 1.2 }} className="absolute w-1 h-1 bg-gold-400 rounded-full"></motion.div>
                                <motion.div initial={{ x: 0, opacity: 1 }} animate={{ x: -50, opacity: 0 }} transition={{ duration: 0.8 }} className="absolute w-1 h-1 bg-gold-400 rounded-full"></motion.div>
                            </div>
                         </div>
                     )}

                     {/* ANIMATION B: CREATION (White Flash / Big Bang) */}
                     {sourceType === 'mint' && (
                         <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center relative shadow-[0_0_50px_rgba(255,255,255,0.8)]">
                            <motion.div 
                                initial={{ scale: 0, opacity: 1 }} animate={{ scale: 20, opacity: 0 }} transition={{ duration: 0.8, ease: "easeOut" }}
                                className="absolute inset-0 bg-white rounded-full z-0"
                            ></motion.div>
                            <Zap className="w-10 h-10 text-black relative z-10" />
                         </div>
                     )}

                     <h3 className={`text-2xl font-thin mb-2 tracking-widest ${sourceType === 'mint' ? 'text-white drop-shadow-[0_0_10px_white]' : 'text-gold-100'}`}>
                        {sourceType === 'mint' ? '新たな光の誕生' : '循環完了'}
                     </h3>
                     
                     {/* Feedback Toast */}
                     {feedback && (
                         <div className="mt-2 bg-gray-900/90 border border-white/10 rounded-lg p-4 w-full text-left space-y-2 relative overflow-hidden">
                            {/* Rank Up Highlight for Sacrifice */}
                            {sourceType === 'balance' && (
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-gold-500 via-white to-gold-500 animate-pulse"></div>
                            )}

                            <div className="flex justify-between items-center text-xs border-b border-white/5 pb-2 mb-2">
                                <span className="text-gray-400">Total Gift</span>
                                <span className={`font-mono text-sm font-bold ${sourceType === 'mint' ? 'text-white' : 'text-gold-400'}`}>{amount} Pt</span>
                            </div>
                            
                            {feedback.balance > 0 && (
                                <div className="flex justify-between items-center text-[11px]">
                                    <span className="text-gold-500">あなたの光 (Balance)</span>
                                    <span className="font-mono text-gold-500">-{feedback.balance}</span>
                                </div>
                            )}
                            {feedback.mint > 0 && (
                                <div className="flex justify-between items-center text-[11px]">
                                    <span className="text-blue-300">新たな光 (Mint)</span>
                                    <span className="font-mono text-blue-300">+{feedback.mint}</span>
                                </div>
                            )}

                            {/* Rank XP only visible/highlighted for Balance payment */}
                            {feedback.xp > 0 ? (
                                <div className="pt-2 mt-2 border-t border-dashed border-white/10 flex justify-between items-center">
                                    <span className="text-[11px] tracking-widest text-gray-400 uppercase">Contribution XP</span>
                                    <motion.span 
                                        initial={{ scale: 1 }} animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 2 }}
                                        className="text-xs font-bold text-green-400 flex items-center gap-1"
                                    >
                                        <Sparkles size={10} />
                                        +{feedback.xp} XP (Rank Up!)
                                    </motion.span>
                                </div>
                            ) : (
                                <div className="pt-2 mt-2 text-center text-[11px] text-gray-600 font-mono italic">
                                    作成された光は徳になりません
                                </div>
                            )}
                         </div>
                     )}
                     
                     <div className="flex flex-col items-center mt-4 gap-1">
                        <span className="text-xs text-gold-500/80 uppercase tracking-widest">残存エネルギー</span>
                        <span className="text-3xl font-thin text-gold-100 tabular-nums drop-shadow-[0_0_10px_rgba(251,192,45,0.5)]">
                            {Math.max(0, totalAvailable - (feedback?.balance || 0)).toLocaleString()}
                        </span>
                     </div>

                     <button onClick={onClose} className="mt-8 px-8 py-3 bg-white/5 border border-white/10 rounded-full text-xs text-gray-300 hover:bg-white/10 transition-colors">
                        閉じる
                     </button>
                </motion.div>
            )}


        </AnimatePresence>
      </motion.div>
    </div>
  );
};
