import React from 'react'; // Deploy Force Update 2026/01/27 (火) 18:40:03
import { createPortal } from 'react-dom';
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

  const isDev = true; 

  const handleDebugScan = (type: 'helper' | 'friend') => {
      onScan(type);
  };

  // Final Layout:
  // 1. Portal + Solid Black BG (No transparency)
  // 2. Camera strictly in Viewfinder
  return createPortal(
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black animate-fade-in">
        
        {/* Main Layout Container */}
        <div className="relative w-full h-full flex flex-col justify-between p-6 pt-safe pb-safe z-10">
            
            {/* Header */}
            <div className="flex justify-between items-center pt-8">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-white rounded-full shadow-sm">
                        <QrCode size={20} className="text-slate-700" />
                    </div>
                    <div>
                        <h3 className="text-white font-bold text-lg leading-tight drop-shadow-md">相手を読み取る</h3>
                        <p className="text-xs text-white/90 font-medium tracking-wide drop-shadow-md">SCANNER</p>
                    </div>
                </div>
                <button 
                    onClick={onClose} 
                    className="p-3 rounded-full bg-white shadow-md text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition-all cursor-pointer"
                >
                    <X size={24} />
                </button>
            </div>

            {/* Center Area with Viewfinder & Camera */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-6 w-full max-w-xs pointer-events-none">
                
                {/* 
                   THE VIEWFINDER BOX 
                   Camera is contained HERE.
                */}
                <div className="relative w-64 h-64 rounded-3xl overflow-hidden bg-black shadow-2xl border-2 border-white/10">
                    
                    {/* Camera Feed - Sited inside this relative box */}
                    <div className="absolute inset-0 z-0">
                        <Scanner 
                            onScan={(detected) => handleScanLogic(detected as IScanResult[])}
                            onError={(error) => console.error("Scanner Error:", error)}
                            components={{ finder: false }}
                            styles={{ 
                                container: { width: '100%', height: '100%' },
                                video: { objectFit: 'cover' } 
                            }}
                        />
                    </div>

                    {/* Overlays (Corners & Scan Line) - On top of Camera */}
                    <div className="absolute inset-0 z-10 pointer-events-none">
                        {/* Corners Frame - White/Clear */}
                         <div className="absolute top-4 left-4 w-6 h-6 border-t-4 border-l-4 border-white rounded-tl-lg drop-shadow-md"></div>
                         <div className="absolute top-4 right-4 w-6 h-6 border-t-4 border-r-4 border-white rounded-tr-lg drop-shadow-md"></div>
                         <div className="absolute bottom-4 left-4 w-6 h-6 border-b-4 border-l-4 border-white rounded-bl-lg drop-shadow-md"></div>
                         <div className="absolute bottom-4 right-4 w-6 h-6 border-b-4 border-r-4 border-white rounded-br-lg drop-shadow-md"></div>

                        {/* Scan Line */}
                        <motion.div 
                            className="absolute left-6 right-6 h-[2px] bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]"
                            animate={{ top: ['15%', '85%', '15%'] }}
                            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                        />
                    </div>
                </div>

                {/* Instruction Pill */}
                <p className="text-slate-800 font-bold text-sm bg-white/90 px-6 py-3 rounded-full shadow-lg border border-white/20 backdrop-blur-md">
                    相手のQRコードを枠内に合わせてください
                </p>
            </div>

            {/* Debug Controls */}
            <div className={`pb-12 flex flex-col items-center gap-2 transition-opacity duration-300 ${isDev ? 'opacity-100' : 'opacity-0 pointer-events-auto'}`}>
                 <div className="flex gap-2">
                     <button 
                        onClick={() => handleDebugScan('helper')}
                        className="px-4 py-2 rounded-lg bg-white/90 hover:bg-white text-[10px] font-bold text-slate-700 transition-colors shadow-sm backdrop-blur-sm cursor-pointer pointer-events-auto"
                     >
                        [テスト] 契約相手
                     </button>
                     <button 
                         onClick={() => handleDebugScan('friend')}
                         className="px-4 py-2 rounded-lg bg-white/90 hover:bg-white text-[10px] font-bold text-slate-700 transition-colors shadow-sm backdrop-blur-sm cursor-pointer pointer-events-auto"
                     >
                        [テスト] 新規相手
                     </button>
                 </div>
            </div>
        </div>
    </div>,
    document.body
  );
};
