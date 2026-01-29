import React from 'react';
import { ExternalLink } from 'lucide-react';
import { UNIT_LABEL, LUNAR_CONSTANTS } from '../constants';

import { useWallet } from '../hooks/useWallet';

interface HeaderProps {
    onOpenWishHub?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenWishHub }) => {
    const { balance, availableLm, committedLm } = useWallet();
    
    // useWallet から返される値は既に減価適用済み
    const displayValue = balance;
    const displayAvailable = availableLm;
    const displayCommitted = committedLm;

    const isFullyCommitted = displayAvailable <= 0;
    
    // プログレスバーの割合計算（手持ち全体に対する比率）
    const availablePercent = Math.min(100, (displayAvailable / LUNAR_CONSTANTS.FULL_MOON_BALANCE) * 100);
    const committedPercent = Math.min(100, (displayCommitted / LUNAR_CONSTANTS.FULL_MOON_BALANCE) * 100);

    return (
        <header className="fixed top-0 left-0 right-0 bg-white/90 backdrop-blur-md pt-safe z-40 px-6 py-4 flex flex-col items-center justify-center border-b border-slate-100/50 shadow-sm">
             <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">
                 分かち合える Lm
             </span>
             
             {/* Main Display: Available Lm */}
             <div className="flex items-baseline gap-1">
                 <span className={`text-3xl font-mono font-bold tracking-tighter tabular-nums ${
                     isFullyCommitted ? 'text-orange-500' : 'text-slate-900'
                 }`}>
                     {Math.floor(displayAvailable).toLocaleString()}
                 </span>
                 <span className={`text-sm font-bold ml-1 ${
                     isFullyCommitted ? 'text-orange-400' : 'text-slate-500'
                 }`}>
                     {UNIT_LABEL}
                 </span>
                 {isFullyCommitted && (
                     <span className="text-xs text-orange-500 ml-2">
                         （すべて約束済み）
                     </span>
                 )}
             </div>
             
             {/* Capacity Gauge - 2-layer visualization */}
             <div className="w-full max-w-[140px] h-2 bg-slate-100 rounded-full mt-2 overflow-hidden relative">
                 {/* Layer 1: Committed (薄い色 - 約束中) */}
                 <div 
                    className="absolute inset-0 h-full bg-gradient-to-r from-yellow-200 to-yellow-300 transition-all duration-700 ease-out"
                    style={{ 
                        width: `${Math.min(100, availablePercent + committedPercent)}%` 
                    }} 
                 />
                 {/* Layer 2: Available (濃い色 - 使える分) */}
                 <div 
                    className="absolute inset-0 h-full bg-gradient-to-r from-yellow-400 to-yellow-500 transition-all duration-700 ease-out shadow-[0_0_8px_rgba(234,179,8,0.4)]"
                    style={{ 
                        width: `${availablePercent}%` 
                    }} 
                 />
             </div>

             {/* Sub Display + Link */}
             <div className="text-[10px] text-slate-400 mt-2 font-mono flex items-center gap-2">
                 <span>手持ち: <span className="font-bold text-slate-500">{Math.floor(displayValue).toLocaleString()} {UNIT_LABEL}</span></span>
                 {isFullyCommitted && onOpenWishHub && (
                     <button 
                         onClick={onOpenWishHub}
                         className="flex items-center gap-1 text-orange-500 hover:text-orange-600 hover:underline transition-colors"
                     >
                         <ExternalLink className="w-3 h-3" />
                         <span>約束を見直す</span>
                     </button>
                 )}
             </div>
        </header>
    );
};
