import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Inbox, Megaphone, Sparkles, AlertCircle } from "lucide-react";
import { useWallet } from "../hooks/useWallet";
import { useProfile } from "../hooks/useProfile";
import { getMillis } from "../logic/worldPhysics";
import { AppMode } from "../hooks/useStartupMachine";

interface HomeViewProps {
    onOpenFlow: () => void; 
    onOpenRequest: () => void;
    ritualState: 'idle' | 'breathing' | 'blooming' | 'syncing';
    setRitualState: (state: 'idle' | 'breathing' | 'blooming' | 'syncing') => void;
    setTargetBalance: (val: number) => void;
    appMode: AppMode;
}

export const HomeView: React.FC<HomeViewProps> = ({ 
    onOpenFlow, 
    onOpenRequest, 
    ritualState, 
    setRitualState, 
    setTargetBalance, 
    appMode 
}) => {
  const { performRebirthReset, availableLm, balance } = useWallet();
  const { profile, updateProfile } = useProfile();
  const [notification, setNotification] = React.useState<string | null>(null);

  // Monitor for interruption notifications
  React.useEffect(() => {
    if (profile?.pending_interruption_notification) {
      setNotification(profile.pending_interruption_notification);
    }
  }, [profile?.pending_interruption_notification]);

  const clearNotification = async () => {
    if (!profile) return;
    setNotification(null);
    await updateProfile({ pending_interruption_notification: null });
  };

  // "Metamorphosis" Logic driven by State Machine
  // RITUAL mode = Monotone World (No Color)
  // NORMAL mode = Color World (Full Color)
  // CRITICAL: We also hide color (and balance) if a ritual animation is Playing (ritualState !== 'idle')
  // This prevents the "Double 2400" overlap during the First Birth or Rebirth animations.
  const isRitualReady = appMode === 'RITUAL'; 
  const showColor = appMode === 'NORMAL' && ritualState === 'idle'; 
  
  // Calculate Days
  const cycleDays = profile?.scheduled_cycle_days || 10;
  const cycleStartedAt = getMillis(profile?.cycle_started_at || profile?.created_at);
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
          const result = await performRebirthReset({ userInitiated: true });
          if (result.success && result.newBalance !== undefined) {
              setTargetBalance(result.newBalance); setRitualState('blooming'); 
              await new Promise(r => setTimeout(r, 1500)); setRitualState('syncing');
              await new Promise(r => setTimeout(r, 2000)); setRitualState('idle'); 
          } else { setRitualState('idle'); }
      } catch (e) { setRitualState('idle'); }
  };

  // Move randomized message logic outside of the conditional button render to follow Hooks rules
  const ritualMessage = React.useMemo(() => Math.random() > 0.5 ? "私は、私。" : "ETの世界へ", []);

  return (
    <div className="flex-1 flex flex-col items-center justify-center w-full relative pt-safe pt-20 md:pt-24">
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
<div className="text-6xl font-serif font-medium tracking-tighter tabular-nums leading-tight pb-2 bg-gradient-to-b from-[#4A4A4A] via-[#6B5A4F] to-[#8B7E74] bg-clip-text text-transparent transform drop-shadow-sm">
                {Math.floor(availableLm).toLocaleString()}
              </div>
            </motion.div>
          </div>
        )}

        {/* 2. The Vessel (YinYang Coin) */}
        <div className="relative w-[80%] md:w-[70%] lg:w-[45%] max-w-[540px] lg:max-w-[480px] max-h-[70vh] aspect-square z-10">
          <motion.div 
            className="absolute inset-0 rounded-full shadow-2xl shadow-slate-200/50 border-4 border-white overflow-hidden bg-white text-slate-900"
            // Breathing animation only when waiting for ritual
            animate={isRitualReady ? { opacity: [0.7, 1, 0.7], scale: [0.98, 1, 0.98] } : { opacity: 1, scale: 1 }}
            transition={isRitualReady ? { duration: 6, repeat: Infinity, ease: "easeInOut" } : {}}
          >
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <defs>
                <filter id="dividerGlow">
                  <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>

                {/* Visual Assets */}
                {/* 陽: HELP (琥珀 - Amber) */}
                <linearGradient id="yangGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#FFFBEB" /> {/* Amber 50 */}
                  <stop offset="100%" stopColor="#FCD34D" /> {/* Amber 300 */}
                </linearGradient>
                {/* 陰: WISH (淡藍 - Pale Indigo) */}
                <linearGradient id="yinGrad" x1="0%" y1="100%" x2="0%" y2="0%">
                  <stop offset="0%" stopColor="#EEF2FF" /> {/* Indigo 50 */}
                  <stop offset="100%" stopColor="#A5B4FC" /> {/* Indigo 300 */}
                </linearGradient>
                
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
                    strokeWidth={showColor ? "1.5" : "1"} 
                    filter={showColor ? "url(#dividerGlow)" : ""}
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
                        <span className="text-2xl font-light tracking-[0.2em] text-slate-600 mb-1 drop-shadow-sm pl-[0.8em]">
                            {ritualMessage}
                        </span>
                        <span className="text-[10px] font-light tracking-[0.3em] text-slate-400 opacity-60 pl-[0.3em] uppercase">
                            I am who I am / Into the World of ET
                        </span>
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
                      className="absolute top-[28%] right-[24%] -translate-y-1/2 z-20 outline-none group text-amber-800"
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      transition={{ duration: 0.8, delay: 0.2 }}
                    >
                        <div className="flex flex-col items-center origin-center">
                          <motion.div className="flex flex-col items-center">
                            <Inbox size={52} strokeWidth={2.5} className="mb-2 opacity-90" />
                            <span className="text-3xl font-extrabold tracking-tight text-shadow-sm">応える</span>
                          </motion.div>
                        </div>
                    </motion.button>
                    <motion.button 
                      key="btn-wish" 
                      onClick={onOpenRequest} 
                      className="absolute bottom-[28%] left-[24%] translate-y-1/2 z-20 outline-none group text-blue-800"
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      transition={{ duration: 0.8, delay: 0.2 }}
                    >
                        <div className="flex flex-col items-center origin-center">
                          <motion.div className="flex flex-col-reverse items-center">
                            <Megaphone size={48} strokeWidth={2.5} className="mt-2 opacity-90" />
                            <span className="text-3xl font-extrabold tracking-tight text-shadow-sm">お願い</span>
                          </motion.div>
                        </div>
                    </motion.button>
                 </>
                )
            )}
          </AnimatePresence>
        </div>

        <AnimatePresence>
            {notification && (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="fixed inset-x-6 top-10 z-[100] flex justify-center pointer-events-none"
            >
                <div className="bg-white/90 backdrop-blur-md border border-amber-100 p-6 rounded-2xl shadow-xl max-w-sm w-full pointer-events-auto flex flex-col items-center text-center">
                    <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center mb-4">
                        <AlertCircle className="text-amber-500" size={24} />
                    </div>
                    <p className="text-sm text-slate-700 font-medium leading-relaxed mb-6 whitespace-pre-wrap">
                        {notification}
                    </p>
                    <button
                        onClick={clearNotification}
                        className="w-full py-3 bg-amber-400 hover:bg-amber-500 text-white rounded-xl text-sm font-bold tracking-widest transition-colors shadow-sm active:scale-[0.98]"
                    >
                        了解しました
                    </button>
                </div>
            </motion.div>
            )}
        </AnimatePresence>
    </div>
  );
};
