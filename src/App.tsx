import React, { useState, Suspense, lazy, useEffect } from "react";
import { ErrorBoundary } from "./components/ErrorBoundary";
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
import { AppViewMode } from "./types";
import { useProfile } from "./hooks/useProfile";
import { useStartupMachine, AppMode } from "./hooks/useStartupMachine";

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
const HomeView = ({ onOpenFlow, onOpenRequest, ritualState, setRitualState, setTargetBalance, appMode }: { 
    onOpenFlow: () => void; 
    onOpenRequest: () => void;
    ritualState: 'idle' | 'breathing' | 'blooming' | 'syncing';
    setRitualState: (state: 'idle' | 'breathing' | 'blooming' | 'syncing') => void;
    setTargetBalance: (val: number) => void;
    appMode: AppMode;
}) => {
  const { performRebirthReset, availableLm, balance } = useWallet();
  const { profile } = useProfile();

  // "Metamorphosis" Logic driven by State Machine
  // RITUAL mode = Monotone World (No Color)
  // NORMAL mode = Color World (Full Color)
  // CRITICAL: We also hide color (and balance) if a ritual animation is Playing (ritualState !== 'idle')
  // This prevents the "Double 2400" overlap during the First Birth or Rebirth animations.
  const isRitualReady = appMode === 'RITUAL'; 
  const showColor = appMode === 'NORMAL' && ritualState === 'idle'; 
  
  // Calculate Days
  const cycleDays = profile?.scheduled_cycle_days || 10;
  const cycleStartedAt = profile?.cycle_started_at?.toMillis 
      ? profile.cycle_started_at.toMillis() 
      : (profile?.created_at?.toMillis ? profile.created_at.toMillis() : Date.now());
  const nextReset = cycleStartedAt + (cycleDays * 24 * 60 * 60 * 1000);
  const daysLeft = Math.max(0, Math.ceil((nextReset - Date.now()) / (1000 * 60 * 60 * 24)));
  
  // Sound Effect: 528Hz Crystal Tone
  const playCrystalSound = () => {
      try {
          const win = window as unknown as Window & { 
            AudioContext?: typeof AudioContext;
            webkitAudioContext?: typeof AudioContext; 
          };
          const AudioContextClass = win.AudioContext || win.webkitAudioContext;
          if (!AudioContextClass) return;
          const ctx = new AudioContextClass();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          
          osc.type = 'sine';
          osc.frequency.setValueAtTime(528, ctx.currentTime); 
          
          gain.gain.setValueAtTime(0, ctx.currentTime);
          gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.5); 
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 4); 
          
          osc.connect(gain);
          gain.connect(ctx.destination);
          
          osc.start();
          osc.stop(ctx.currentTime + 4.5);
      } catch (e) {
          console.error("Audio Playback Failed", e);
      }
  };

  const handleRitual = async () => {
      if (ritualState !== 'idle') return;
      try {
          setRitualState('breathing');
          playCrystalSound(); 
          await new Promise(r => setTimeout(r, 1500));
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
        {showColor && (
          <div className="absolute top-[18%] left-0 right-0 flex flex-col items-center z-20 pointer-events-none">
            <motion.div 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }} 
              className="flex flex-col items-center gap-1"
            >
              <span className="text-xs font-bold text-slate-500 tracking-widest uppercase whitespace-nowrap opacity-80 mb-[-4px]">
                手持ち： {Math.floor(balance).toLocaleString()}
                <span className="ml-1 text-slate-400 font-medium">(あと{daysLeft}日)</span>
              </span>
              <div className="text-6xl font-serif font-bold text-slate-800 tracking-tighter tabular-nums leading-[0.8] pb-[0.3em]">
                {Math.floor(availableLm).toLocaleString()}
              </div>
            </motion.div>
          </div>
        )}

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
                // Normal Buttons (Only show when showColor is true)
                showColor && (
                 <>
                   <motion.button 
                     key="btn-help" 
                     onClick={onOpenFlow} 
                     className="absolute top-[32.32%] left-[67.68%] -translate-x-1/2 -translate-y-[14.5px] z-20 outline-none group text-amber-800"
                     initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                     transition={{ duration: 0.8, delay: 0.2 }}
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
                )
            )}
          </AnimatePresence>
        </div>
    </div>
  );
};


// メインコンテンツの切り替えレイヤー
const MainContent = ({ viewMode, setViewMode, currentUserId, onGoHome, ritualState, setRitualState, setTargetBalance, appMode }: { 
    viewMode: AppViewMode; 
    setViewMode: (mode: AppViewMode) => void; 
    currentUserId: string; 
    onGoHome: () => void;
    ritualState: 'idle' | 'breathing' | 'blooming' | 'syncing';
    setRitualState: (state: 'idle' | 'breathing' | 'blooming' | 'syncing') => void;
    setTargetBalance: (val: number) => void;
    appMode: AppMode;
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
                    appMode={appMode}
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
const ScreenLoader = ({ message }: { message?: string }) => (
    <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#F9F8F4] min-h-screen relative overflow-hidden">
        {/* Washi Texture Overlay */}
        <div
            className="absolute inset-0 pointer-events-none opacity-[0.03] mix-blend-multiply"
            style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
            }}
        />
        {/* Ambient Blooms */}
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-orange-100/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-100/10 blur-[120px] rounded-full pointer-events-none" />

         <div className="relative flex flex-col items-center justify-center z-10">
            <div className="relative flex items-center justify-center mb-8">
                <div className="absolute w-12 h-12 bg-slate-200 rounded-full animate-ping opacity-20"></div>
                <div className="w-3 h-3 bg-white border border-slate-100 rounded-full shadow-sm animate-pulse z-10"></div>
            </div>
            {message && (
                <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-slate-400 font-serif tracking-[0.2em] text-sm animate-pulse"
                >
                    {message}
                </motion.div>
            )}
         </div>
    </div>
);

function App() {
  // THE MACHINE (Single Source of Truth)
  const { view, appMode, data, actions } = useStartupMachine();



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

  // --- THE DETERMINISTIC SWITCH ---
  switch(view) {
      case 'LOADING':
          return <ScreenLoader message={data.message} />;
      
      case 'GATE':
          if (!gateOpened) return <GateScreen onOpen={handleGateOpen} />;
          return (
            <ErrorBoundary>
                <AuthScreen onSuccess={() => setViewMode("home")} />
            </ErrorBoundary>
          );
      
      
      case 'EVENT':
          return <SeasonalRevelation eventData={data.eventData!} onComplete={actions.completeEvent} />;

      case 'APP': {
        // The World is Open.
        // We render the Header and MainContent based on internal routing (viewMode), 
        // passing down the machine's "Mood" (appMode) to influence visuals.
        
        const isRitual = appMode === 'RITUAL';
        return (
            <div className="bg-[#F9F8F4] h-screen font-sans selection:bg-orange-100/30 overflow-hidden flex flex-col relative text-[#2D2D2D]">
            {/* Washi Texture Overlay for App */}
            <div
                className="absolute inset-0 pointer-events-none opacity-[0.03] mix-blend-multiply z-0"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                }}
            />
            {/* Ambient Blooms */}
            <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-orange-100/10 blur-[120px] rounded-full pointer-events-none z-0" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-100/10 blur-[120px] rounded-full pointer-events-none z-0" />

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
                <motion.div 
                    className="w-full h-full flex flex-col flex-1"
                    animate={{ opacity: 1 }} 
                >
                    <MainContent
                        viewMode={viewMode}
                        setViewMode={setViewMode}
                        currentUserId={data.user!.uid}
                        onGoHome={handleGoHome}
                        ritualState={ritualState}
                        setRitualState={setRitualState}
                        setTargetBalance={setTargetBalance}
                        appMode={appMode}
                    />
                </motion.div>
                </Suspense>
            </main>
            
            {/* Ritual Animation Overlay */}
            <RitualOverlay state={ritualState} targetBalance={targetBalance} />

            {showAdmin && (
                <Suspense fallback={null}>
                <AdminDashboard onClose={() => setShowAdmin(false)} />
                </Suspense>
            )}
            </div>
        );
      }
  }
}
export default App;
