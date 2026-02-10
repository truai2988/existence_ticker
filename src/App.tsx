import React, { useState, Suspense, lazy, useEffect } from "react";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { useSeasonalEvent } from "./hooks/useSeasonalEvent";
import { motion, AnimatePresence } from "framer-motion";
import { AuthScreen } from "./components/AuthScreen";
import { GateScreen } from "./components/GateScreen";
import { Header } from "./components/Header";
import { Inbox, Megaphone, Sparkles } from "lucide-react";
import { useWallet } from "./hooks/useWallet";
import { ProfileView } from './components/ProfileView';
import { JournalView } from './components/JournalView';
import { AdminDashboard as AdminComp } from './components/AdminDashboard';
import { RadianceView } from './components/RadianceView';
import { FlowView } from './components/FlowView';
import { SeasonalRevelation } from './components/SeasonalRevelation';
import { useAuth } from "./hooks/useAuthHook";
import { AppViewMode } from "./types";

import { useProfile } from "./hooks/useProfile";

// カウントアップ演出
// カウントアップ演出
const CountingNumber: React.FC<{ value: number; duration: number }> = ({ value, duration }) => {
    const [display, setDisplay] = useState(2400);
    useEffect(() => {
        const start = 2400; const end = value; const startTime = Date.now();
        const update = () => {
            const now = Date.now();
            const progress = Math.min((now - startTime) / (duration * 1000), 1);
            const ease = 1 - Math.pow(1 - progress, 5);
            const current = Math.floor(start - (start - end) * ease);
            setDisplay(current);
            if (progress < 1) requestAnimationFrame(update);
        };
        requestAnimationFrame(update);
    }, [value, duration]);
    return <div className="text-6xl font-serif font-bold text-slate-900 tracking-tighter">{display.toLocaleString()}</div>;
};

// 1. Ritual Overlay (Global Layer)
const RitualOverlay = ({ state, targetBalance }: { state: string, targetBalance: number }) => (
  <AnimatePresence>
      {state !== 'idle' && (
          <motion.div className="fixed inset-0 z-[1000] flex items-center justify-center pointer-events-none" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1 }}>
              <motion.div className="absolute inset-0 bg-white/95 backdrop-blur-2xl" animate={{ clipPath: state === 'syncing' ? 'circle(150% at center)' : 'circle(0% at center)', opacity: state === 'syncing' ? 0 : 1 }} transition={{ duration: state === 'syncing' ? 2.5 : 1, ease: state === 'syncing' ? [0.4, 0, 0.2, 1] : "easeOut" }} />
              <div className="relative z-10 flex flex-col items-center justify-center text-slate-800">
                  {state === 'blooming' && ( <motion.div initial={{ scale: 0.8, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 1.2, opacity: 0 }} transition={{ duration: 0.8, ease: "easeOut" }} className="text-center"> <div className="text-6xl font-serif font-bold text-slate-900 tracking-tighter">2,400</div> </motion.div> )}
                  {state === 'syncing' && ( <motion.div initial={{ scale: 1, opacity: 1 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }} className="text-center"> <CountingNumber value={targetBalance} duration={2} /> </motion.div> )}
              </div>
          </motion.div>
      )}
  </AnimatePresence>
);

// 2. Unified HomeView (The Vessel)
const HomeView = ({ onOpenFlow, onOpenRequest, ritualState, setRitualState, setTargetBalance }: { 
    onOpenFlow: () => void; 
    onOpenRequest: () => void;
    ritualState: 'idle' | 'breathing' | 'blooming' | 'syncing';
    setRitualState: (state: 'idle' | 'breathing' | 'blooming' | 'syncing') => void;
    setTargetBalance: (val: number) => void;
}) => {
  const { status, performRebirthReset, availableLm, balance } = useWallet();
  const { profile } = useProfile();

  // "Metamorphosis" Logic
  // RITUAL_READY = Monotone World (No Color)
  // ALIVE = Color World (Full Color)
  const isRitualReady = status === 'RITUAL_READY'; 
  const showColor = !isRitualReady; // The "Lights" are on if we are NOT waiting for ritual
  
  // Calculate Days
  const cycleDays = profile?.scheduled_cycle_days || 10;
  const cycleStartedAt = profile?.cycle_started_at?.toMillis 
      ? profile.cycle_started_at.toMillis() 
      : (profile?.created_at?.toMillis ? profile.created_at.toMillis() : Date.now());
  const nextReset = cycleStartedAt + (cycleDays * 24 * 60 * 60 * 1000);
  const daysLeft = Math.max(0, Math.ceil((nextReset - Date.now()) / (1000 * 60 * 60 * 24)));
  
  const handleRitual = async () => {
      if (ritualState !== 'idle') return;
      try {
          setRitualState('breathing'); await new Promise(r => setTimeout(r, 1500));
          const result = await performRebirthReset();
          if (result.success && result.newBalance !== undefined) {
              setTargetBalance(result.newBalance); setRitualState('blooming'); 
              await new Promise(r => setTimeout(r, 1500)); setRitualState('syncing');
              await new Promise(r => setTimeout(r, 2000)); setRitualState('idle'); 
          } else { setRitualState('idle'); }
      } catch (e) { setRitualState('idle'); }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center w-full relative">
        {/* 1. Balance Display (Only when Alive/Color) */}
        <AnimatePresence>
            {showColor && (
                 <div className="absolute top-[8%] left-0 right-0 flex flex-col items-center z-20 pointer-events-none">
                    <motion.div initial={{ opacity: 0, scale: 0.9, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute bottom-[105%]">
                        <span className="text-xs font-bold text-slate-600 tracking-widest uppercase whitespace-nowrap text-shadow-sm">
                            手持ち： {Math.floor(balance).toLocaleString()}
                            <span className="ml-2 text-slate-500 font-medium">(あと{daysLeft}日)</span>
                        </span>
                    </motion.div>
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-center">
                        <div className="text-6xl font-serif font-bold text-slate-800 tracking-tighter tabular-nums leading-none">{Math.floor(availableLm).toLocaleString()}</div>
                    </motion.div>
                 </div>
            )}
        </AnimatePresence>

        {/* 2. The Vessel (YinYang Coin) */}
        <div className="relative w-[90%] max-w-[360px] aspect-square z-10">
          <motion.div 
            className="absolute inset-0 rounded-full shadow-2xl shadow-slate-200/50 border-4 border-white overflow-hidden bg-white text-slate-900"
            // Breathing animation only when waiting for ritual
            animate={isRitualReady ? { opacity: [0.7, 1, 0.7], scale: [0.98, 1, 0.98] } : { opacity: 1, scale: 1 }}
            transition={isRitualReady ? { duration: 6, repeat: Infinity, ease: "easeInOut" } : {}}
          >
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <defs>
                {/* Visual Assets */}
                <linearGradient id="yangGrad" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#FEF3C7" /><stop offset="100%" stopColor="#FDE68A" /></linearGradient>
                <linearGradient id="yinGrad" x1="0%" y1="100%" x2="0%" y2="0%"><stop offset="0%" stopColor="#BFDBFE" /><stop offset="100%" stopColor="#DBEAFE" /></linearGradient>
                <linearGradient id="cocoonLight" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#FFFFFF" /><stop offset="100%" stopColor="#F1F5F9" /></linearGradient>
                <linearGradient id="cocoonShadow" x1="0%" y1="100%" x2="0%" y2="0%"><stop offset="0%" stopColor="#E2E8F0" /><stop offset="100%" stopColor="#F8FAFC" /></linearGradient>
              </defs>
              <g transform="rotate(-45 50 50)">
                  {/* Common Shape: The fills change based on state */}
                  
                  {/* Left Side (Yin) */}
                  {/* Base: Monotone Shadow (Always there) */}
                  <path d="M 0 50 A 25 25 0 0 1 50 50 A 25 25 0 0 0 100 50 A 50 50 0 0 1 0 50 Z" fill="url(#cocoonShadow)" />
                  {/* Layer: Blue Gradient (Fade in when Color) */}
                  <motion.path d="M 0 50 A 25 25 0 0 1 50 50 A 25 25 0 0 0 100 50 A 50 50 0 0 1 0 50 Z" 
                    fill="url(#yinGrad)"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: showColor ? 1 : 0 }}
                    transition={{ duration: 1.5, ease: "easeInOut" }}
                  />

                  {/* Right Side (Yang) */}
                  {/* Base: Monotone Light (Always there) */}
                  <path d="M 0 50 A 25 25 0 0 1 50 50 A 25 25 0 0 0 100 50 A 50 50 0 0 0 0 50 Z" fill="url(#cocoonLight)" />
                  {/* Layer: Yellow Gradient (Fade in when Color) */}
                  <motion.path d="M 0 50 A 25 25 0 0 1 50 50 A 25 25 0 0 0 100 50 A 50 50 0 0 0 0 50 Z" 
                    fill="url(#yangGrad)"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: showColor ? 1 : 0 }}
                    transition={{ duration: 1.5, ease: "easeInOut" }}
                  />

                  {/* Boundary Line */}
                  <path d="M 0 50 A 25 25 0 0 1 50 50 A 25 25 0 0 0 100 50" 
                    fill="none" 
                    stroke={showColor ? "white" : "rgba(255,255,255,0.8)"}
                    strokeWidth={showColor ? "2.5" : "1"} 
                    style={{ transition: 'all 1.5s ease' }}
                  />
              </g>
            </svg>
          </motion.div>

          {/* 3. Buttons (Swapping Content) */}
          <AnimatePresence mode="wait">
            {isRitualReady ? (
                // Ritual Button
                <motion.button key="btn-ritual" onClick={handleRitual} 
                    className="absolute inset-0 flex flex-col items-center justify-center z-30 outline-none text-slate-500 hover:text-slate-600 transition-colors" 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                >
                    <div className="flex flex-col items-center relative">
                      <div className="absolute inset-0 bg-white/60 blur-xl rounded-full scale-150 transform -z-10" />
                      <Sparkles size={24} strokeWidth={1} className="mb-4 opacity-30 animate-pulse text-slate-400" />
                      <div className="flex flex-col items-center">
                        <span className="text-2xl font-serif tracking-[0.2em] font-light text-slate-600 mb-1 drop-shadow-sm pl-[0.8em]">私は、私。</span>
                        <span className="text-xs font-serif tracking-[0.3em] font-light text-slate-400 opacity-40 pl-[0.3em]">I AM WHO I AM</span>
                      </div>
                    </div>
                </motion.button>
            ) : (
                // Normal Buttons (Wrapper for grouping)
                // Note: Using a fragment or div to group them for AnimatePresence might be tricky with absolute positioning if we want them to fade together.
                // Let's use a fragment but applied to each button. 
                // Actually, if we use mode="wait", they will wait for Ritual Button to leave before entering.
                // The "Metamorphosis" asks for continuous existence.
                // "Lights turn on".
                // So maybe they shouldn't "wait" but just appear?
                // User said: "フェードイン演出と共に表示" (Display with fade-in effect).
                <>
                   <motion.button 
                     key="btn-help" 
                     onClick={onOpenFlow} 
                     className="absolute top-[32.32%] left-[67.68%] -translate-x-1/2 -translate-y-[14.5px] z-20 outline-none group text-amber-800"
                     initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                     transition={{ duration: 0.8, delay: 0.2 }} // Slight delay to let color fill start first
                   >
                       <div className="flex flex-col items-center origin-center">
                         <motion.div className="flex flex-col items-center">
                           <Inbox size={29} strokeWidth={2} className="mb-2 opacity-90" />
                           <span className="text-lg font-medium tracking-widest uppercase text-shadow-sm">応える</span>
                         </motion.div>
                       </div>
                   </motion.button>
                   <motion.button 
                     key="btn-wish" 
                     onClick={onOpenRequest} 
                     className="absolute top-[67.68%] left-[32.32%] -translate-x-1/2 -translate-y-[calc(100%-12.5px)] z-20 outline-none group text-blue-800"
                     initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                     transition={{ duration: 0.8, delay: 0.2 }}
                   >
                       <div className="flex flex-col items-center origin-center">
                         <motion.div className="flex flex-col-reverse items-center">
                           <Megaphone size={25} strokeWidth={2} className="mt-2 opacity-90" />
                           <span className="text-lg font-medium tracking-widest uppercase text-shadow-sm">お願い</span>
                         </motion.div>
                       </div>
                   </motion.button>
                </>
            )}
          </AnimatePresence>
        </div>
    </div>
  );
};


// メインコンテンツの切り替えレイヤー
const MainContent = ({ viewMode, setViewMode, currentUserId, onGoHome, ritualState, setRitualState, setTargetBalance }: { 
    viewMode: AppViewMode; 
    setViewMode: (mode: AppViewMode) => void; 
    currentUserId: string; 
    onGoHome: () => void;
    ritualState: 'idle' | 'breathing' | 'blooming' | 'syncing';
    setRitualState: (state: 'idle' | 'breathing' | 'blooming' | 'syncing') => void;
    setTargetBalance: (val: number) => void;
}) => {
    // 3. Normal Mode: Fade in the main content (HomeView, etc.)
    const withTransition = (component: React.ReactNode, key: string) => (
        <motion.div key={key} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2, ease: "easeInOut" }} className="w-full h-full flex flex-col flex-1">
            {component}
        </motion.div>
    );

    const renderContent = () => {
        switch (viewMode) {
            case 'home': return withTransition(
                <HomeView 
                    onOpenFlow={() => setViewMode('flow')} 
                    onOpenRequest={() => setViewMode('give')} 
                    ritualState={ritualState}
                    setRitualState={setRitualState}
                    setTargetBalance={setTargetBalance}
                />, 'home');
            case 'profile': return withTransition(<ProfileView onOpenAdmin={() => setViewMode('admin')} onTabChange={setViewMode} />, 'profile');
            case 'profile_edit': return withTransition(<ProfileView onOpenAdmin={() => setViewMode('admin')} initialEditMode={true} onTabChange={setViewMode} />, 'profile_edit');
            case 'history': return withTransition(<JournalView onTabChange={setViewMode} />, 'history');
            case 'flow': return withTransition(<FlowView currentUserId={currentUserId} onOpenProfile={() => setViewMode('profile_edit')} onTabChange={setViewMode} />, 'flow');
            case 'give': return withTransition(<RadianceView currentUserId={currentUserId} onTabChange={setViewMode} />, 'give');
            case 'admin': return withTransition(<AdminComp onClose={onGoHome} />, 'admin');
            default: return null;
        }
    };

    return (
        <div className="flex flex-col w-full min-h-full">
            <motion.div 
                className="flex-1 w-full relative flex flex-col"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
            >
                <AnimatePresence mode="wait">{renderContent()}</AnimatePresence>
            </motion.div>
        </div>
    );
};

const AdminDashboard = lazy(() =>
  import("./components/AdminDashboard").then((module) => ({
    default: module.AdminDashboard as React.ComponentType<{ onClose: () => void }>,
  })),
);

// ローダー（白磁の美学）
const ScreenLoader = () => (
    <div className="flex-1 flex items-center justify-center p-8 bg-slate-50 min-h-screen">
         <div className="relative flex items-center justify-center">
            <div className="absolute w-12 h-12 bg-slate-200 rounded-full animate-ping opacity-20"></div>
            <div className="w-3 h-3 bg-white border border-slate-100 rounded-full shadow-sm animate-pulse z-10"></div>
         </div>
    </div>
);

function App() {
  const { user, loading: authLoading, signOut } = useAuth();
  const { status } = useWallet(); // WalletStatus now handles initialization state ('INITIALIZING')
  const { isChecking, eventData, completeEvent } = useSeasonalEvent(); // Strict Gatekeeper Check
  
  // Lifted Ritual State to control Global UI (Header/Background)
  const [ritualState, setRitualState] = useState<'idle' | 'breathing' | 'blooming' | 'syncing'>('idle');
  const [targetBalance, setTargetBalance] = useState(2400); // Lifted for Overlay

  const [viewMode, setViewMode] = useState<AppViewMode>("home");
  const [showAdmin, setShowAdmin] = useState(false);
  const [gateOpened, setGateOpened] = useState(() => sessionStorage.getItem('gateOpened') === 'true');
  
  const handleGateOpen = () => {
    setGateOpened(true);
    sessionStorage.setItem('gateOpened', 'true');
  };
  
  const handleTabChange = (tab: AppViewMode) => setViewMode(tab);
  const handleGoHome = () => setViewMode("home");

  // 1. Loading Phase (Simplified)
  // "Wait until we are truly ready."
  // status === 'INITIALIZING' covers the initial data fetch.
  if (authLoading || status === 'INITIALIZING' || isChecking) return <ScreenLoader />;

  // 1.5 Ghost Protocol (Exception Handling)
  // Profile was missing after loading completed. Force re-registration.
  if (status === 'GHOST') {
      return (
          <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#F9F8F4] min-h-screen text-slate-800">
             <h2 className="text-2xl font-serif font-bold mb-4">魂の不在</h2>
             <p className="mb-8 text-slate-600 text-center text-sm leading-relaxed max-w-xs">
                 認証は確認できましたが、<br/>存在の記録が見つかりません。<br/>
                 (Ghost Profile Detected)
             </p>
             <button 
                onClick={() => signOut()}
                className="px-8 py-3 bg-slate-900 text-white font-serif text-sm tracking-widest hover:bg-slate-800 transition-colors"
             >
                 無に還る
             </button>
          </div>
      );
  }

  // 2. Auth Gate
  if (!user) {
    if (!gateOpened) return <GateScreen onOpen={handleGateOpen} />;
    return (
        <ErrorBoundary>
            <AuthScreen onSuccess={() => setViewMode("home")} />
        </ErrorBoundary>
    );
  }

  // 3. Seasonal Event (Strict Gatekeeper)
  // If event data exists, render ONLY the event. The main app is NOT rendered.
  if (eventData) {
      return <SeasonalRevelation eventData={eventData} onComplete={completeEvent} />;
  }

  // 4. Main App (Rendered only when check is complete AND no event exists)
  const isRitual = status === 'RITUAL_READY';

  return (
    <div className="bg-[#F9F8F4] h-screen font-sans selection:bg-orange-100/30 overflow-hidden flex flex-col relative text-[#2D2D2D]">
      {/* Header: Only show if NOT in Ritual Mode AND Ritual Animation is idle */}
      <AnimatePresence>
        {viewMode === 'home' && !isRitual && ritualState === 'idle' && (
            <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }} 
                transition={{ duration: 0.8, ease: "easeOut" }} 
                className="absolute top-0 left-0 right-0 z-50"
            >
                <Header viewMode={viewMode} onTabChange={handleTabChange} />
            </motion.div>
        )}
      </AnimatePresence>

      <main className={`flex-1 relative overflow-y-auto no-scrollbar scroll-smooth flex flex-col`}>
        <Suspense fallback={<ScreenLoader />}>
          {/* Main Content: Fade In when Ritual is Complete (Alive) */}
          <motion.div 
            className="w-full h-full flex flex-col flex-1"
            animate={isRitual ? { opacity: 1 } : { opacity: 1 }} 
          >
              <MainContent
                viewMode={viewMode}
                setViewMode={setViewMode}
                currentUserId={user.uid}
                onGoHome={handleGoHome}
                ritualState={ritualState}
                setRitualState={setRitualState}
                setTargetBalance={setTargetBalance}
              />
          </motion.div>
        </Suspense>
      </main>
      
      {/* Ritual Animation Overlay (Global via Portal Logic but physically here) */}
      <RitualOverlay state={ritualState} targetBalance={targetBalance} />

      {showAdmin && (
        <Suspense fallback={null}>
          <AdminDashboard onClose={() => setShowAdmin(false)} />
        </Suspense>
      )}
    </div>
  );
}
export default App;
