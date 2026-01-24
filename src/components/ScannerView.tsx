import React from 'react';
import { motion } from 'framer-motion';
import { X, Sparkles } from 'lucide-react';
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

  // Mock triggers for testing without actual QR codes
  const handleDebugScan = (type: 'helper' | 'friend') => {
      onScan(type);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black">
        {/* Fullscreen Cam Overlay */}
        <div className="absolute inset-0 z-0 opacity-50">
             {/* Actual Scanner */}
             <Scanner 
                onScan={(detected) => handleScanLogic(detected as IScanResult[])}
                components={{ finder: false }}
                styles={{ container: { width: '100%', height: '100%' } }}
             />
        </div>

        {/* Custom UI Overlay */}
        <div className="relative z-10 w-full h-full flex flex-col justify-between p-6">
            
            {/* Header */}
            <div className="flex justify-between items-start pt-8">
                <div>
                    <h3 className="text-white font-bold text-lg drop-shadow-md">魂を探しています</h3>
                    <p className="text-xs text-gray-300 drop-shadow-md animate-pulse">Scanning for Existence...</p>
                </div>
                <button onClick={onClose} className="p-2 rounded-full bg-black/40 text-white border border-white/20 backdrop-blur-md">
                    <X size={24} />
                </button>
            </div>

            {/* Viewfinder Center */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-2 border-gold-400 rounded-xl shadow-[0_0_100px_rgba(251,192,45,0.2)]">
                <div className="absolute inset-0 border-2 border-white/20 scale-110 rounded-xl animate-pulse"></div>
                
                {/* Scanning Line */}
                <motion.div 
                    className="absolute top-0 left-0 right-0 h-0.5 bg-gold-400 shadow-[0_0_10px_#fbbf24]"
                    animate={{ top: ['0%', '100%', '0%'] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                />
            </div>

            {/* Debug Controls for development */}
            <div className="pb-10 flex flex-col items-center gap-4">
                <div className="bg-black/60 backdrop-blur-md p-4 rounded-xl border border-white/10 flex gap-4">
                     <button 
                        onClick={() => handleDebugScan('helper')}
                        className="flex flex-col items-center gap-1 p-2 hover:bg-white/10 rounded-lg transition-colors"
                     >
                        <Sparkles size={20} className="text-gold-400" />
                        <span className="text-[10px] text-gray-300">Mock: 約束あり</span>
                     </button>
                     <div className="w-px h-10 bg-white/20"></div>
                     <button 
                         onClick={() => handleDebugScan('friend')}
                         className="flex flex-col items-center gap-1 p-2 hover:bg-white/10 rounded-lg transition-colors"
                     >
                        <span className="text-xl">👻</span>
                        <span className="text-[10px] text-gray-300">Mock: 初対面</span>
                     </button>
                </div>
                <p className="text-[10px] text-gray-500 text-center max-w-xs">
                    ※ 開発用: 上記ボタンでスキャン結果をシミュレートできます
                </p>
            </div>
        </div>
    </div>
  );
};
