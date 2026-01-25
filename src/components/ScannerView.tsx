import React from 'react';
import { motion } from 'framer-motion';
import { X, QrCode } from 'lucide-react';
import { Scanner } from '@yudiel/react-qr-scanner';

interface ScannerViewProps {
  onClose: () => void;
  onScan: (scannedValue: string) => void;
}

interface IScanResult {
    rawValue: string;
    format?: string;
}

export const ScannerView: React.FC<ScannerViewProps> = ({ onClose, onScan }) => {
  
  const handleScanLogic = (detected: IScanResult[]) => {
      if (detected && detected.length > 0) {
          const val = detected[0].rawValue;
          if (val) onScan(val);
      }
  };

  // Mock triggers (Environment based or always subtle)
  const isDev = true; // Simulating dev check for now or always showing gently

  const handleDebugScan = (type: 'helper' | 'friend') => {
      onScan(type);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-900">
        {/* Fullscreen Cam Overlay */}
        <div className="absolute inset-0 z-0">
             <Scanner 
                onScan={(detected) => handleScanLogic(detected as IScanResult[])}
                components={{ finder: false }}
                styles={{ container: { width: '100%', height: '100%' } }}
             />
        </div>

        {/* Light Overlay (Everyday Theme) */}
        <div className="absolute inset-0 z-10 bg-slate-50/70 backdrop-blur-[2px]"></div>

        {/* Custom UI Content */}
        <div className="relative z-20 w-full h-full flex flex-col justify-between p-6 pt-safe pb-safe">
            
            {/* Header */}
            <div className="flex justify-between items-center pt-4">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-white rounded-full shadow-sm">
                        <QrCode size={20} className="text-slate-700" />
                    </div>
                    <div>
                        <h3 className="text-slate-900 font-bold text-lg leading-tight">相手を読み取る</h3>
                        <p className="text-xs text-slate-500 font-medium tracking-wide">SCANNER</p>
                    </div>
                </div>
                <button 
                    onClick={onClose} 
                    className="p-3 rounded-full bg-white shadow-sm text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-all border border-slate-100"
                >
                    <X size={20} />
                </button>
            </div>

            {/* Viewfinder Center - Clean & Institutional */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-6 w-full max-w-xs">
                <div className="relative w-64 h-64">
                    {/* Corners Frame */}
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-slate-800 rounded-tl-xl"></div>
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-slate-800 rounded-tr-xl"></div>
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-slate-800 rounded-bl-xl"></div>
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-slate-800 rounded-br-xl"></div>
                    
                    {/* Subtle Scan Line (Slow & Professional) */}
                    <motion.div 
                        className="absolute left-4 right-4 h-[1px] bg-blue-500/50 shadow-sm"
                        animate={{ top: ['10%', '90%', '10%'] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    />
                </div>
                <p className="text-slate-600 font-bold text-sm bg-white/80 px-4 py-2 rounded-full shadow-sm border border-white/50 backdrop-blur-md">
                    相手のQRコードを枠内に合わせてください
                </p>
            </div>

            {/* Debug Controls (Subtle) */}
            <div className={`pb-8 flex flex-col items-center gap-2 transition-opacity duration-300 ${isDev ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                 <div className="flex gap-2">
                     <button 
                        onClick={() => handleDebugScan('helper')}
                        className="px-3 py-1.5 rounded-md bg-slate-200/50 hover:bg-slate-300/50 text-[10px] font-mono text-slate-500 transition-colors border border-transparent hover:border-slate-300"
                     >
                        [テスト] 契約相手として検知
                     </button>
                     <button 
                         onClick={() => handleDebugScan('friend')}
                         className="px-3 py-1.5 rounded-md bg-slate-200/50 hover:bg-slate-300/50 text-[10px] font-mono text-slate-500 transition-colors border border-transparent hover:border-slate-300"
                     >
                        [テスト] 新しい相手として検知
                     </button>
                 </div>
            </div>
        </div>
    </div>
  );
};
