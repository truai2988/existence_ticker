import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Inbox, Megaphone, Sparkles } from "lucide-react";
import { useWallet } from "../hooks/useWallet";
import { useProfile } from "../hooks/useProfile";
import { AlertCircle } from "lucide-react";

interface HomeViewProps {
  onOpenFlow: () => void; // "Help" (Inflow)
  onOpenRequest: () => void; // "Request" (Outflow)
}

export const HomeView: React.FC<HomeViewProps> = ({
  onOpenFlow,
  onOpenRequest,
}) => {
  const { status, performRebirthReset, availableLm, balance } = useWallet();
  const { profile, updateProfile } = useProfile();
  const [ritualState, setRitualState] = React.useState<'idle' | 'breathing' | 'blooming' | 'syncing'>('idle');
  const [targetBalance, setTargetBalance] = React.useState(2400);
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
    // [Purification]: Clear the field from the user's profile immediately after acknowledgment
    await updateProfile({ pending_interruption_notification: null });
  };

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

  const isRitualLocked = React.useRef(false);

  const handleRitual = async () => {
      if (isRitualLocked.current || ritualState !== 'idle') return;
      isRitualLocked.current = true;
      
      try {
          setRitualState('breathing');
          playCrystalSound(); 
          
          await new Promise(r => setTimeout(r, 1500));
          
          const result = await performRebirthReset({ userInitiated: true });
          
          if (result.success && result.newBalance !== undefined) {
              setTargetBalance(result.newBalance);
              setRitualState('blooming'); 
              await new Promise(r => setTimeout(r, 1500));
              setRitualState('syncing');
              await new Promise(r => setTimeout(r, 2000));
              setRitualState('idle'); 
          } else {
              setRitualState('idle');
          }
      } catch (e) {
          console.error("Ritual Error", e);
          setRitualState('idle');
      } finally {
          isRitualLocked.current = false;
      }
  };

  const isRitualReady = status === 'RITUAL_READY' && ritualState === 'idle';
  const isEmpty = status === 'EMPTY';

  const loadingStyle = `
    @keyframes breathe {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.02); }
    }
  `;

  return (
    <div className="flex-1 flex flex-col items-center justify-center w-full min-h-full px-6 py-4 relative max-w-2xl mx-auto overflow-hidden">
      <style>{loadingStyle}</style>

      <div className="flex-1 flex items-center justify-center w-full relative">
        {/* Ripple Animation Effects (Behind everything) */}
        {!isRitualReady && !isEmpty && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                {[1, 2, 3].map((i) => (
                    <motion.div
                        key={`ripple-${i}`}
                        className="absolute rounded-full border border-slate-200/40"
                        style={{ width: '300px', height: '300px' }}
                        animate={{
                            scale: [1, 1.5 + (i * 0.2)],
                            opacity: [0.3, 0]
                        }}
                        transition={{
                            duration: 4,
                            repeat: Infinity,
                            delay: i * 1.2,
                            ease: "easeOut"
                        }}
                    />
                ))}
            </div>
        )}

        {/* Central Lm Display (Above ripples, below buttons) */}
        {!isRitualReady && !isEmpty && (
             <div className="absolute top-[10%] flex flex-col items-center z-20 pointer-events-none">
                {availableLm > 0 && (
                     <motion.div 
                        initial={{ opacity: 0, scale: 0.9, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        className="absolute bottom-[105%] flex items-center gap-2 bg-white/60 backdrop-blur-sm px-4 py-1.5 rounded-full border border-amber-100 shadow-sm"
                     >
                        <Sparkles size={12} className="text-amber-400 fill-amber-400" />
                        <span className="text-[10px] font-bold text-slate-500 tracking-widest uppercase">
                            分かち合える
                        </span>
                     </motion.div>
                )}

                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center"
                >
                    <div className="text-6xl font-serif font-bold text-slate-800 tracking-tighter tabular-nums leading-none">
                       {Math.floor(availableLm).toLocaleString()}
                    </div>
                    <div className="text-xs text-slate-400 font-bold tracking-widest uppercase mt-2">
                        手持ち: {Math.floor(balance).toLocaleString()}
                    </div>
                </motion.div>
             </div>
        )}

        <div className="absolute inset-0 bg-slate-100/50 rounded-full blur-3xl opacity-40 z-0 pointer-events-none transform scale-110" />

        <div className="relative w-[80%] max-w-[540px] aspect-square z-10">
          <div
            className="absolute inset-0 rounded-full shadow-2xl shadow-slate-200/50 border-4 border-white overflow-hidden bg-white"
            style={{ animation: "breathe 8s ease-in-out infinite" }}
          >
            <svg
              viewBox="0 0 100 100"
              className="w-full h-full shape-rendering-geometricPrecision"
            >
              <defs>
                <filter id="dividerGlow">
                  <feGaussianBlur stdDeviation="1" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
                {/* 陽: HELP (明るい黄色) */}
                <linearGradient id="yangGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#FEF3C7" />
                  <stop offset="100%" stopColor="#FDE68A" />
                </linearGradient>
                {/* 陰: WISH (落ち着いた青色) */}
                <linearGradient id="yinGradient" x1="0%" y1="100%" x2="0%" y2="0%">
                  <stop offset="0%" stopColor="#BFDBFE" />
                  <stop offset="100%" stopColor="#DBEAFE" />
                </linearGradient>
                <linearGradient id="porcelainGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                   <stop offset="0%" stopColor="#F8FAFC" />
                   <stop offset="100%" stopColor="#E2E8F0" />
                </linearGradient>
              </defs>

              <g transform="rotate(-45 50 50)">
                  {/* 下半分: WISH (青) */}
                  <path
                     d="M 0 50 A 25 25 0 0 0 50 50 A 25 25 0 0 1 100 50 A 50 50 0 0 1 0 50 Z"
                     fill={(isRitualReady || isEmpty) ? "url(#porcelainGradient)" : "url(#yinGradient)"}
                     stroke="none"
                     className="transition-all duration-1000"
                  />
                  {/* 上半分: HELP (黄) */}
                  <path
                     d="M 0 50 A 25 25 0 0 0 50 50 A 25 25 0 0 1 100 50 A 50 50 0 0 0 0 50 Z"
                     fill={(isRitualReady || isEmpty) ? "url(#porcelainGradient)" : "url(#yangGradient)"}
                     stroke="none"
                     className="transition-all duration-1000"
                  />
                  <path 
                     d="M 0 50 A 25 25 0 0 0 50 50 A 25 25 0 0 1 100 50"
                     fill="none" 
                     stroke={(isRitualReady || isEmpty) ? "#94A3B8" : "white"} 
                     strokeWidth="2.5"
                     filter="url(#dividerGlow)"
                     opacity="0.9"
                     strokeLinecap="round"
                     className="transition-colors duration-1000"
                  />
              </g>
            </svg>
          </div>

          <AnimatePresence>
            {!isRitualReady && (
             <>
              <motion.button
                key="btn-help"
                onClick={onOpenFlow}
                className="absolute top-[25%] right-[24%] flex flex-col items-end z-20 outline-none group"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                whileHover="hover"
                whileTap="tap"
              >
                <motion.div
                  className="text-amber-800 flex flex-col items-center group-hover:text-amber-700"
                  variants={{
                    initial: { y: 0, scale: 1 },
                    hover: {
                      y: -5,
                      scale: 1.03,
                      transition: { type: "spring", stiffness: 300, damping: 20 },
                    },
                    tap: { scale: 0.98 },
                  }}
                >
                  <Inbox size={52} strokeWidth={2.5} className="mb-1" />
                  <span className="text-3xl font-extrabold tracking-tight">応える</span>
                </motion.div>
              </motion.button>

              <motion.button
                key="btn-wish"
                onClick={onOpenRequest}
                className="absolute bottom-[25%] left-[24%] flex flex-col items-start z-20 outline-none group"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                whileHover="hover"
                whileTap="tap"
              >
                <motion.div
                  className="text-blue-800 flex flex-col items-center group-hover:text-blue-700"
                  variants={{
                    initial: { y: 0, scale: 1 },
                    hover: {
                      y: -5,
                      scale: 1.03,
                      transition: { type: "spring", stiffness: 300, damping: 20 },
                    },
                    tap: { scale: 0.98 },
                  }}
                >
                  <span className="text-3xl font-extrabold tracking-tight">お願い</span>
                  <Megaphone size={48} strokeWidth={2.5} className="mt-1" />
                </motion.div>
              </motion.button>
             </>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {isRitualReady && (
                <motion.button
                    key="btn-ritual"
                    onClick={handleRitual}
                    className="absolute inset-0 flex flex-col items-center justify-center z-30 outline-none text-slate-400 hover:text-slate-500 transition-colors"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <Sparkles size={32} strokeWidth={1} className="mb-2 opacity-50" />
                    <span className="text-2xl font-serif tracking-widest font-bold">ここにいます</span>
                </motion.button>
            )}
          </AnimatePresence>

        </div>
      </div>

      <AnimatePresence>
          {ritualState !== 'idle' && (
              <motion.div
                  className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1 }}
              >
                  <motion.div 
                    className="absolute inset-0 bg-white/95 backdrop-blur-2xl"
                    animate={{
                        clipPath: ritualState === 'syncing' 
                            ? 'circle(150% at center)' 
                            : 'circle(0% at center)',
                        opacity: ritualState === 'syncing' ? 0 : 1
                    }}
                    transition={{ 
                        duration: ritualState === 'syncing' ? 2.5 : 1, 
                        ease: ritualState === 'syncing' ? [0.4, 0, 0.2, 1] : "easeOut"
                    }}
                  />
                  
                  <div className="relative z-10 flex flex-col items-center justify-center text-slate-800">
                      {ritualState === 'blooming' && (
                          <motion.div
                             initial={{ scale: 0.8, opacity: 0, y: 20 }}
                             animate={{ scale: 1, opacity: 1, y: 0 }}
                             exit={{ scale: 1.2, opacity: 0 }}
                             transition={{ duration: 0.8, ease: "easeOut" }}
                             className="text-center"
                          >
                              <div className="text-6xl font-serif font-bold text-slate-900 tracking-tighter">
                                  2,400
                              </div>
                          </motion.div>
                      )}

                       {ritualState === 'syncing' && (
                           <motion.div
                           initial={{ scale: 1, opacity: 1 }}
                           animate={{ scale: 1, opacity: 1 }}
                           exit={{ opacity: 0 }}
                           className="text-center"
                        >
                            <CountingNumber value={targetBalance} duration={2} />
                        </motion.div>
                      )}
                  </div>
              </motion.div>
          )}
      </AnimatePresence>

      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="fixed inset-x-6 top-10 z-[60] flex justify-center pointer-events-none"
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

const CountingNumber: React.FC<{ value: number, duration: number }> = ({ value, duration }) => {
    const [display, setDisplay] = React.useState(2400);

    React.useEffect(() => {
        const start = 2400;
        const end = value;
        const startTime = Date.now();
        
        const update = () => {
            const now = Date.now();
            const progress = Math.min((now - startTime) / (duration * 1000), 1);
            // easeOutQuint: 1 - (1 - x)^5
            const ease = 1 - Math.pow(1 - progress, 5);
            const current = Math.floor(start - (start - end) * ease);
            setDisplay(current);
            if (progress < 1) {
                requestAnimationFrame(update);
            }
        };
        requestAnimationFrame(update);
    }, [value, duration]);

    return (
        <div className="text-6xl font-serif font-bold text-slate-900 tracking-tighter">
            {display.toLocaleString()}
        </div>
    );
};
