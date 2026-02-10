import { useState, Suspense, lazy, useEffect } from "react";
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
import { useAuth } from "./hooks/useAuthHook";
import { AppViewMode } from "./types";

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

// ホーム（Yin-Yang）ビュー
const HomeView: React.FC<{ onOpenFlow: () => void; onOpenRequest: () => void }> = ({ onOpenFlow, onOpenRequest }) => {
  const { status, performRebirthReset, availableLm, balance } = useWallet();
  const [ritualState, setRitualState] = useState<'idle' | 'breathing' | 'blooming' | 'syncing'>('idle');
  const [targetBalance, setTargetBalance] = useState(2400);
  
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

  const isRitualReady = status === 'RITUAL_READY' && ritualState === 'idle';
  const isEmpty = status === 'EMPTY';

  return (
    <div className="flex-1 flex flex-col items-center justify-center w-full min-h-full px-6 py-4 relative max-w-md mx-auto overflow-hidden">
      <div className="flex-1 flex items-center justify-center w-full relative">
        {/* 透明な背景に浮かぶ「手持ち」残高 */}
        {!isRitualReady && !isEmpty && (
             <div className="absolute top-[8%] left-0 right-0 flex flex-col items-center z-20 pointer-events-none">
                <motion.div initial={{ opacity: 0, scale: 0.9, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} className="absolute bottom-[105%]">
                    <span className="text-xs font-bold text-slate-400 tracking-widest uppercase whitespace-nowrap text-shadow-sm">手持ち： {Math.floor(balance).toLocaleString()}</span>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-center">
                    <div className="text-6xl font-serif font-bold text-slate-800 tracking-tighter tabular-nums leading-none">{Math.floor(availableLm).toLocaleString()}</div>
                </motion.div>
             </div>
        )}

        {/* Yin-Yang サークル本体 */}
        <div className="relative w-[90%] max-w-[360px] aspect-square z-10">
          <div className="absolute inset-0 rounded-full shadow-2xl shadow-slate-200/50 border-4 border-white overflow-hidden bg-white text-slate-900">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <defs>
                <linearGradient id="yangGrad" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#FEF3C7" /><stop offset="100%" stopColor="#FDE68A" /></linearGradient>
                <linearGradient id="yinGrad" x1="0%" y1="100%" x2="0%" y2="0%"><stop offset="0%" stopColor="#BFDBFE" /><stop offset="100%" stopColor="#DBEAFE" /></linearGradient>
                <linearGradient id="porcGrad" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#F8FAFC" /><stop offset="100%" stopColor="#E2E8F0" /></linearGradient>
              </defs>
              <g transform="rotate(-45 50 50)">
                  <path d="M 0 50 A 25 25 0 0 1 50 50 A 25 25 0 0 0 100 50 A 50 50 0 0 1 0 50 Z" fill={(isRitualReady || isEmpty) ? 'url(#porcGrad)' : 'url(#yinGrad)'} />
                  <path d="M 0 50 A 25 25 0 0 1 50 50 A 25 25 0 0 0 100 50 A 50 50 0 0 0 0 50 Z" fill={(isRitualReady || isEmpty) ? 'url(#porcGrad)' : 'url(#yangGrad)'} />
                  <path d="M 0 50 A 25 25 0 0 1 50 50 A 25 25 0 0 0 100 50" fill="none" stroke={(isRitualReady || isEmpty) ? '#94A3B8' : 'white'} strokeWidth="2.5" />
              </g>
            </svg>
          </div>

          <AnimatePresence>
            {!isRitualReady && (
             <>
              <motion.button key="btn-help" onClick={onOpenFlow} className="absolute top-[32.32%] left-[67.68%] -translate-x-1/2 -translate-y-[14.5px] z-20 outline-none group text-amber-800" whileTap={{ scale: 0.98 }}>
                  <div className="flex flex-col items-center origin-center">
                    <motion.div className="flex flex-col items-center" whileHover={{ y: -5 }}>
                      <Inbox size={29} strokeWidth={2} className="mb-2 opacity-90" />
                      <span className="text-lg font-medium tracking-widest uppercase text-shadow-sm">応える</span>
                    </motion.div>
                  </div>
              </motion.button>
              <motion.button key="btn-wish" onClick={onOpenRequest} className="absolute top-[67.68%] left-[32.32%] -translate-x-1/2 -translate-y-[calc(100%-12.5px)] z-20 outline-none group text-blue-800" whileTap={{ scale: 0.98 }}>
                  <div className="flex flex-col items-center origin-center">
                    <motion.div className="flex flex-col-reverse items-center" whileHover={{ y: -5 }}>
                      <Megaphone size={25} strokeWidth={2} className="mt-2 opacity-90" />
                      <span className="text-lg font-medium tracking-widest uppercase text-shadow-sm">お願い</span>
                    </motion.div>
                  </div>
              </motion.button>
             </>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {isRitualReady && (
                <motion.button key="btn-ritual" onClick={handleRitual} className="absolute inset-0 flex flex-col items-center justify-center z-30 outline-none text-slate-400 hover:text-slate-500 transition-colors" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <div className="flex flex-col items-center">
                      <Sparkles size={32} strokeWidth={1} className="mb-2 opacity-50" />
                      <span className="text-2xl font-serif tracking-widest font-bold text-shadow-sm">ここにいます</span>
                    </div>
                </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* 儀式アニメーション（Overlay） */}
      <AnimatePresence>
          {ritualState !== 'idle' && (
              <motion.div className="fixed inset-0 z-[1000] flex items-center justify-center pointer-events-none" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1 }}>
                  <motion.div className="absolute inset-0 bg-white/95 backdrop-blur-2xl" animate={{ clipPath: ritualState === 'syncing' ? 'circle(150% at center)' : 'circle(0% at center)', opacity: ritualState === 'syncing' ? 0 : 1 }} transition={{ duration: ritualState === 'syncing' ? 2.5 : 1, ease: ritualState === 'syncing' ? [0.4, 0, 0.2, 1] : "easeOut" }} />
                  <div className="relative z-10 flex flex-col items-center justify-center text-slate-800">
                      {ritualState === 'blooming' && ( <motion.div initial={{ scale: 0.8, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 1.2, opacity: 0 }} transition={{ duration: 0.8, ease: "easeOut" }} className="text-center"> <div className="text-6xl font-serif font-bold text-slate-900 tracking-tighter">2,400</div> </motion.div> )}
                      {ritualState === 'syncing' && ( <motion.div initial={{ scale: 1, opacity: 1 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }} className="text-center"> <CountingNumber value={targetBalance} duration={2} /> </motion.div> )}
                  </div>
              </motion.div>
          )}
      </AnimatePresence>
    </div>
  );
};

// メインコンテンツの切り替えレイヤー
const MainContent: React.FC<{ viewMode: AppViewMode; setViewMode: (mode: AppViewMode) => void; currentUserId: string; onGoHome: () => void }> = ({ viewMode, setViewMode, currentUserId, onGoHome }) => {
    const withTransition = (component: React.ReactNode, key: string) => (
        <motion.div key={key} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2, ease: "easeInOut" }} className="w-full h-full">
            {component}
        </motion.div>
    );
    const renderContent = () => {
        switch (viewMode) {
            case 'home': return withTransition(<HomeView onOpenFlow={() => setViewMode('flow')} onOpenRequest={() => setViewMode('give')} />, 'home');
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
            <SeasonalRevelation />
            <div className="flex-1 w-full relative">
                <AnimatePresence mode="wait">{renderContent()}</AnimatePresence>
            </div>
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
  const { user, loading: authLoading } = useAuth();
  const [viewMode, setViewMode] = useState<AppViewMode>("home");
  const [showAdmin, setShowAdmin] = useState(false);
  const [gateOpened, setGateOpened] = useState(() => sessionStorage.getItem('gateOpened') === 'true');
  
  const handleGateOpen = () => {
    setGateOpened(true);
    sessionStorage.setItem('gateOpened', 'true');
  };
  
  const handleTabChange = (tab: AppViewMode) => setViewMode(tab);
  const handleGoHome = () => setViewMode("home");

  if (authLoading) return <ScreenLoader />;
  if (!user) {
    if (!gateOpened) return <GateScreen onOpen={handleGateOpen} />;
    return (
        <ErrorBoundary>
            <AuthScreen onSuccess={() => setViewMode("home")} />
        </ErrorBoundary>
    );
  }

  return (
    <div className="bg-[#F9F8F4] h-screen font-sans selection:bg-orange-100/30 overflow-hidden flex flex-col relative text-[#2D2D2D]">
      {viewMode === 'home' && (
        <Header viewMode={viewMode} onTabChange={handleTabChange} />
      )}
      <main className={`flex-1 relative overflow-y-auto no-scrollbar scroll-smooth flex flex-col`}>
        <Suspense fallback={<ScreenLoader />}>
          <MainContent
            viewMode={viewMode}
            setViewMode={setViewMode}
            currentUserId={user.uid}
            onGoHome={handleGoHome}
          />
        </Suspense>
      </main>
      {showAdmin && (
        <Suspense fallback={null}>
          <AdminDashboard onClose={() => setShowAdmin(false)} />
        </Suspense>
      )}
    </div>
  );
}
export default App;
