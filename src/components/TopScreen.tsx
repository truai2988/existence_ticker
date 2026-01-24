import React, { useState } from 'react';
import { Scan, User, BookOpen } from 'lucide-react';
import { useScanProcessor } from '../hooks/useScanProcessor';
import { CompleteWishModal } from './CompleteWishModal'; 
import { DonationModal } from './DonationModal'; 
import { PendingWish } from '../types';
import { ScannerView } from './ScannerView';
import { ExistenceTicker } from './ExistenceTicker';
import { usePersistence } from '../lib/store';
import { useProfile } from '../hooks/useProfile';

import { useWallet } from '../hooks/useWallet';

// Props to handle navigation/callbacks if needed (e.g. for App.tsx context)
interface TopScreenProps {
    balance?: number;
    // onMint removed (Debug feature disabled)
    onOpenQr?: () => void; 
    onOpenWishes?: () => void; 
    onOpenProfile?: () => void;
    onOpenJournal?: () => void;
    onOpenAdmin?: () => void;
}

export const TopScreen: React.FC<TopScreenProps> = ({ 
  balance, 
  onOpenProfile, 
  onOpenJournal,
  onOpenAdmin
}) => {
  const { processScan } = useScanProcessor();
  const { profile } = useProfile(); // Use profile for last_updated
  const { points } = usePersistence();
  const { checkLunarPhase } = useWallet();
  // const { resetAccount } = useDebug(); // Removed as per production readiness

  
  // Base balance from Props > Profile > Local Store
  const baseBalance = balance !== undefined 
    ? balance 
    : (profile?.balance ?? points.reduce((acc, p) => acc + p.value, 0));

  // === Biological Lifecycle Display ===
  const [rationReceived, setRationReceived] = useState(false);

  // Lunar Phase Check on Load
  React.useEffect(() => {
      if (!profile) return;
      
      const doCheck = async () => {
          const result = await checkLunarPhase();
          if (result.reset) {
              setRationReceived(true);
              // Reset flag after a while
              setTimeout(() => setRationReceived(false), 8000); // Longer flash for Full Moon
          }
      };
      doCheck();
      // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id]); // Check once per user session (profile load)


  // View State Management
  const [viewState, setViewState] = useState<'idle' | 'scanning' | 'showing_qr'>('idle');

  // Modal State Management (for Post-Scan flow)
  const [activeModal, setActiveModal] = useState<'none' | 'settle' | 'donate'>('none');
  const [targetUser, setTargetUser] = useState<{id: string, name: string} | null>(null);
  const [targetWish, setTargetWish] = useState<PendingWish | null>(null);

  // Actions
  const startScanning = () => setViewState('scanning');
  const resetView = () => setViewState('idle');

  // Handle Scan Result
  const handleScan = async (scannedId: string) => {
      setViewState('idle'); 
      
      const result = await processScan(scannedId);
      
      setTargetUser(result.user);
      
      if (result.type === 'settle_wish' && result.wish) {
          setTargetWish(result.wish);
          setActiveModal('settle');
      } else {
          setActiveModal('donate');
      }
  };

  const closeModal = () => {
    setActiveModal('none');
    setTargetUser(null);
    setTargetWish(null);
  };



  return (
    <>
    <div className={`relative flex flex-col items-center justify-center w-full min-h-full py-10 px-6 space-y-12 animate-fade-in transition-opacity duration-300 ${viewState !== 'idle' ? 'opacity-0' : 'opacity-100'}`} style={{ pointerEvents: viewState !== 'idle' ? 'none' : 'auto' }}>
      
      {/* --- Existence Ticker (Top Center) --- */}
      <div 
        className="scale-[0.8] sm:scale-100 flex flex-col items-center gap-2 transition-transform"
      >
         <ExistenceTicker 
             balance={baseBalance} 
             lastUpdated={profile?.last_updated} 
             rationReceived={rationReceived} 
         />
      </div>

      {/* --- Main Action --- */}
      <div className="w-full max-w-xs">
        {/* 魂を探す (Main CTA) */}
        <button 
          onClick={startScanning}
          className="w-full relative group border border-slate-800 bg-slate-900/40 rounded-3xl p-10 flex flex-col items-center gap-4 hover:border-gold-500/30 hover:bg-slate-900/60 transition-all active:scale-[0.98] shadow-2xl"
        >
          <div className="p-4 rounded-full bg-slate-950 border border-slate-800 group-hover:border-gold-500/50 transition-colors shadow-[0_0_20px_rgba(0,0,0,0.5)]">
             <Scan className="w-8 h-8 text-white group-hover:text-gold-400 transition-colors" />
          </div>
          
          <div className="text-center">
            <span className="block text-xl font-bold text-white mb-1 group-hover:text-gold-100 transition-colors">魂を探す</span>
            <span className="text-xs text-slate-500 group-hover:text-slate-400 transition-colors">光を探す (贈る)</span>
          </div>
        </button>
      </div>

      {/* --- Sub Actions (Profile / History) --- */}
      <div className="flex items-center gap-8 text-slate-500">
         <button 
           onClick={onOpenProfile}
           className="flex flex-col items-center gap-2 hover:text-gold-200 transition-colors group"
         >
           <div className="p-3 rounded-full bg-slate-900/50 border border-slate-800 group-hover:border-gold-500/50 transition-colors">
              <User size={20} />
           </div>
           <span className="text-[10px] tracking-widest uppercase">Profile</span>
         </button>

         <button 
           onClick={onOpenJournal}
           className="flex flex-col items-center gap-2 hover:text-gold-200 transition-colors group"
         >
           <div className="p-3 rounded-full bg-slate-900/50 border border-slate-800 group-hover:border-gold-500/50 transition-colors">
              <BookOpen size={20} />
           </div>
           <span className="text-[10px] tracking-widest uppercase">History</span>
         </button>
      </div>

      {/* --- Debug: Reset World --- */}

      <div className="mt-8 opacity-70 hover:opacity-100 transition-opacity z-50 flex gap-4">
{/* [RESET] button removed */}
          <button 
            onClick={onOpenAdmin}
            className="text-[10px] text-slate-500 hover:text-white font-mono border border-slate-800 hover:bg-slate-800 px-3 py-2 rounded uppercase tracking-widest transition-all"
          >
              [ADMIN]
          </button>
      </div>


    </div>

    {/* --- DIRECT VIEWS --- */}
    
    {/* Scanner Overlay */}
    {viewState === 'scanning' && (
        <ScannerView onClose={resetView} onScan={handleScan} />
    )}

    {/* --- POST-SCAN MODALS --- */}
    
    {/* Route A: Wish Settlement */}
    {activeModal === 'settle' && targetUser && targetWish && (
    <CompleteWishModal
        wishTitle={targetWish.title}
        helperName={targetUser.name}
        preset={targetWish.preset}
        cost={targetWish.cost}
        onConfirm={() => {
        alert('Route A: 契約に基づき決済完了');
        closeModal();
        }}
        onCancel={closeModal}
    />
    )}

    {/* Route B: Free Donation */}
    {activeModal === 'donate' && targetUser && (
    <DonationModal
        targetUserName={targetUser.name}
        onSelectAmount={(amount) => {
        alert(`Route B: ${amount}Pt を自由に寄付しました`);
        closeModal();
        }}
        onCancel={closeModal}
    />
    )}
    </>
  );
};