import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Inbox, Megaphone, Sparkles, Hand } from "lucide-react";
import { useWallet } from "../hooks/useWallet";

interface HomeViewProps {
  onOpenFlow: () => void; // "Help" (Inflow)
  onOpenRequest: () => void; // "Request" (Outflow)
}

export const HomeView: React.FC<HomeViewProps> = ({
  onOpenFlow,
  onOpenRequest,
}) => {
  const { cycleStatus, performRebirthReset } = useWallet();
  const [ritualState, setRitualState] = React.useState<'idle' | 'breathing' | 'blooming' | 'syncing'>('idle');
  const [targetBalance, setTargetBalance] = React.useState(2400);

  // Sound Effect: 528Hz Crystal Tone
  const playCrystalSound = () => {
      try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
          if (!AudioContext) return;
          const ctx = new AudioContext();
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

  // Ref to prevent double-execution (Idempotency Lock)
  const isRitualLocked = React.useRef(false);

  const handleRitual = async () => {
      // 1. Strict UI Lock
      if (isRitualLocked.current || ritualState !== 'idle') return;
      isRitualLocked.current = true;
      
      try {
          // 2. Whiteout & Breath
          setRitualState('breathing');
          playCrystalSound(); 
          
          await new Promise(r => setTimeout(r, 1500));
          
          // 3. Data Reset
          const result = await performRebirthReset();
          
          if (result.success && result.newBalance !== undefined) {
              setTargetBalance(result.newBalance);
              setRitualState('blooming'); 
              
              await new Promise(r => setTimeout(r, 1500));
              
              setRitualState('syncing');
              
              await new Promise(r => setTimeout(r, 2000));
              
              setRitualState('idle'); 
          } else {
              setRitualState('idle'); // Failed
          }
      } catch (e) {
          console.error("Ritual Error", e);
          setRitualState('idle');
      } finally {
          // Release lock after completion (though user might be in new cycle)
          isRitualLocked.current = false;
      }
  };

  const isExpired = (cycleStatus.isExpired || cycleStatus.isUnborn) && ritualState === 'idle';





  // Pure CSS Animation for "Breathing" to offload JS thread
  // Added directly into style block for zero overhead
  const loadingStyle = `
    @keyframes breathe {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.02); }
    }
  `;

  return (
    <div className="flex-1 flex flex-col items-center justify-center w-full min-h-full p-4 relative max-w-md mx-auto overflow-hidden">
      <style>{loadingStyle}</style>

      {/* 2. CORE VESSEL: YIN-YANG INTERFACE */}
      <div className="flex-1 flex items-center justify-center w-full relative">
        {/* Simplified Background Aura - Pure CSS Opacity */}
        <div className="absolute inset-0 bg-slate-100/50 rounded-full blur-2xl opacity-30 z-0 pointer-events-none" />

        {/* CONTAINER: 288px (w-72) */}
        <div className="relative w-72 h-72 z-10">
          {/* A. BACKGROUND LAYER (The Breathing Shape - Pure CSS) */}
          <div
            className="absolute inset-0 rounded-full shadow-2xl shadow-slate-200/50 border-4 border-white overflow-hidden bg-white"
            style={{ animation: "breathe 8s ease-in-out infinite" }}
          >
            <svg
              viewBox="0 0 100 100"
              className="w-full h-full shape-rendering-geometricPrecision"
            >
              <defs>
                {/* 境界線等のフィルタ */}
                <filter id="dividerGlow">
                  <feGaussianBlur stdDeviation="1" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>

                {/* グラデーション定義 */}
                {/* Yang (Blue): Top Area */}
                <linearGradient id="yangGradient" x1="0%" y1="100%" x2="0%" y2="0%">
                  <stop offset="0%" stopColor="#BFDBFE" /> {/* blue-200 */}
                  <stop offset="100%" stopColor="#DBEAFE" /> {/* blue-100 */}
                </linearGradient>
                
                {/* Yin (Yellow): Bottom Area */}
                <linearGradient id="yinGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#FEF3C7" /> {/* amber-100 */}
                  <stop offset="100%" stopColor="#FDE68A" /> {/* amber-200 */}
                </linearGradient>

                {/* Porcelain (White/Mono): For Empty Vessel */}
                <linearGradient id="porcelainGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                   <stop offset="0%" stopColor="#F8FAFC" /> {/* slate-50 */}
                   <stop offset="100%" stopColor="#E2E8F0" /> {/* slate-200 */}
                </linearGradient>
              </defs>

              {/* GROUP ROTATION: -45 degrees (Counter-Clockwise) */}
              {/* Rotates horizontal layout (Left=Start, Right=End) to Diagonal (Left-Bottom to Right-Top) */}
              {/* Creates a POSITIVE slope (/) */}
              <g transform="rotate(-45 50 50)">
                  
                  {/* YIN (Bottom) */}
                  <path
                     d="M 0 50 A 25 25 0 0 0 50 50 A 25 25 0 0 1 100 50 A 50 50 0 0 1 0 50 Z"
                     fill={isExpired ? "url(#porcelainGradient)" : "url(#yinGradient)"}
                     stroke="none"
                     className="transition-all duration-1000"
                  />

                  {/* YANG (Top) */}
                  <path
                     d="M 0 50 A 25 25 0 0 0 50 50 A 25 25 0 0 1 100 50 A 50 50 0 0 0 0 50 Z"
                     fill={isExpired ? "url(#porcelainGradient)" : "url(#yangGradient)"}
                     stroke="none"
                     className="transition-all duration-1000"
                  />
                  
                  {/* Divider Line (S-curve) */}
                  <path 
                     d="M 0 50 A 25 25 0 0 0 50 50 A 25 25 0 0 1 100 50"
                     fill="none" 
                     stroke={isExpired ? "#94A3B8" : "white"} 
                     strokeWidth="2.5"
                     filter="url(#dividerGlow)"
                     opacity="0.9"
                     strokeLinecap="round"
                     className="transition-colors duration-1000"
                  />
              </g>
            </svg>
          </div>

          {/* B. INTERACTIVE LAYER */}

          {/* Standard Mode: Show Yang/Yin Buttons */}
          <AnimatePresence>
            {!isExpired && (
             <>
              {/* Right-Top Content (Yang) - 手伝う / HELP */}
              <motion.button
                key="btn-help"
                onClick={onOpenFlow}
                className="absolute top-[22%] right-[22%] flex flex-col items-end z-20 outline-none group"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                whileHover="hover"
                whileTap="tap"
              >
                <motion.div
                  className="text-blue-700 flex flex-col items-end group-hover:text-blue-600"
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
                  <Inbox size={32} strokeWidth={2.5} className="mb-1" />
                  <span className="text-xs font-extrabold tracking-[0.2em] opacity-90">
                    HELP
                  </span>
                  <span className="text-xl font-extrabold">手伝う</span>
                </motion.div>
              </motion.button>

              {/* Left-Bottom Content (Yin) - 頼む / WISH */}
              <motion.button
                key="btn-wish"
                onClick={onOpenRequest}
                className="absolute bottom-[22%] left-[22%] flex flex-col items-start z-20 outline-none group"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                whileHover="hover"
                whileTap="tap"
              >
                <motion.div
                  className="text-amber-800 flex flex-col items-start group-hover:text-amber-700"
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
                  <span className="text-xl font-extrabold">頼む</span>
                  <span className="text-xs font-extrabold tracking-[0.2em] opacity-90 mt-0.5">
                    WISH
                  </span>
                  <Megaphone size={28} strokeWidth={2.5} className="mt-1" />
                </motion.div>
              </motion.button>
             </>
            )}
          </AnimatePresence>

          {/* Ritual Mode: Central Button */}
          <AnimatePresence>
            {isExpired && (
                <motion.button
                    key="btn-ritual"
                    onClick={handleRitual}
                    className="absolute inset-0 flex flex-col items-center justify-center z-30 outline-none text-slate-400 hover:text-slate-500 transition-colors"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    {cycleStatus.isUnborn ? (
                        <>
                           <Hand size={32} strokeWidth={1} className="mb-2 opacity-50" />
                           <span className="text-xl font-serif tracking-widest font-bold">命を受け入れる</span>
                           <span className="text-xs tracking-[0.3em] uppercase mt-2 opacity-70">Accept Existence</span>
                        </>
                    ) : (
                        <>
                           <Sparkles size={32} strokeWidth={1} className="mb-2 opacity-50" />
                           <span className="text-2xl font-serif tracking-widest font-bold">ここにいます</span>
                           <span className="text-xs tracking-[0.3em] uppercase mt-2 opacity-70">I am here</span>
                        </>
                    )}
                </motion.button>
            )}
          </AnimatePresence>

        </div>
      </div>



      {/* RITUAL OVERLAY */}
      <AnimatePresence>
          {ritualState !== 'idle' && (
              <motion.div
                  className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1 }}
              >
                  {/* Backdrop Blur & Brightness */}
                  <div className={`absolute inset-0 bg-white/90 backdrop-blur-xl transition-all duration-1000 ${ritualState === 'syncing' ? 'opacity-0' : 'opacity-100'}`} />
                  
                  {/* Content Container */}
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
                              <div className="text-sm tracking-[0.5em] mt-2 text-slate-500 uppercase">
                                  Light Restored
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
                            <CountingNumber value={targetBalance} duration={1.5} />
                            <div className="text-sm tracking-[0.5em] mt-2 text-slate-500 uppercase">
                                Time Synced
                            </div>
                        </motion.div>
                      )}
                  </div>
              </motion.div>
          )}
      </AnimatePresence>
    </div>
  );
};

// Helper Component for Counting Animation
const CountingNumber: React.FC<{ value: number, duration: number }> = ({ value, duration }) => {
    const [display, setDisplay] = React.useState(2400);

    React.useEffect(() => {
        const start = 2400;
        const end = value;
        const startTime = Date.now();
        
        const update = () => {
            const now = Date.now();
            const progress = Math.min((now - startTime) / (duration * 1000), 1);
            // Ease out quart
            const ease = 1 - Math.pow(1 - progress, 4);
            
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
