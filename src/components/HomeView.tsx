import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Inbox, Megaphone, AlertCircle } from "lucide-react";
import { useWallet } from "../hooks/useWallet";
import { useProfile } from "../hooks/useProfile";
import { AppMode } from "../hooks/useStartupMachine";
import { LUNAR_CONSTANTS } from "../constants";
import { useLanguage } from "../contexts/LanguageContext";

interface HomeViewProps {
  onOpenFlow: () => void;
  onOpenRequest: () => void;
  ritualState: "idle" | "breathing" | "blooming" | "syncing";
  setRitualState: (
    state: "idle" | "breathing" | "blooming" | "syncing",
  ) => void;
  setTargetBalance: (val: number) => void;
  appMode: AppMode;
}

export const HomeView: React.FC<HomeViewProps> = ({
  onOpenFlow,
  onOpenRequest,
  ritualState,
  setRitualState,
  setTargetBalance,
  appMode,
}) => {
  const { performRebirthReset, availableLm, committedLm } = useWallet();
  const { profile, updateProfile } = useProfile();
  const { t: MESSAGES } = useLanguage();
  const [notification, setNotification] = React.useState<string | null>(null);

  // Water Clock calculations
  const maxCapacity = LUNAR_CONSTANTS.REBIRTH_AMOUNT;
  const committedHeight = Math.min(100, (committedLm / maxCapacity) * 100);
  const availableHeight = Math.min(100, (availableLm / maxCapacity) * 100);

  const ritualMessage = MESSAGES.HOME.MONOTONE_MSG_1;
  const [isHoveringHelp, setIsHoveringHelp] = React.useState(false);
  const [isHoveringWish, setIsHoveringWish] = React.useState(false);

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
  const isRitualReady = appMode === "RITUAL";
  const showColor = appMode === "NORMAL" && ritualState === "idle";

  // Metamorphosis Logic driven by State Machine
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

      osc.type = "sine";
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
    if (ritualState !== "idle") return;
    try {
      setRitualState("breathing");
      playCrystalSound();
      await new Promise((r) => setTimeout(r, 1500));
      const result = await performRebirthReset({ userInitiated: true });
      if (result.success && result.newBalance !== undefined) {
        setTargetBalance(result.newBalance);
        setRitualState("blooming");
        await new Promise((r) => setTimeout(r, 1500));
        setRitualState("syncing");
        await new Promise((r) => setTimeout(r, 2000));
        setRitualState("idle");
      } else {
        setRitualState("idle");
      }
    } catch (e) {
      setRitualState("idle");
    }
  };



  return (
    <div className="flex-1 flex flex-col items-center justify-center w-full relative pt-safe pt-20 md:pt-24">
      {/* 1. Balance Display (Only when Alive/Color) */}
      {showColor && (
        <>
          {/* Lm数値 (左寄り) */}
          <div className="absolute top-[18%] left-0 right-0 flex flex-col items-center z-20 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center gap-1"
            >
              <div className="text-6xl font-serif font-medium tracking-tighter tabular-nums leading-none bg-gradient-to-b from-[#4A4A4A] via-[#6B5A4F] to-[#8B7E74] bg-clip-text text-transparent transform drop-shadow-sm pb-2">
                {Math.floor(availableLm).toLocaleString()}
              </div>
            </motion.div>
          </div>

          {/* Water Clock — ヘッダーと同じ max-w-2xl px-6 基準で右端に揃え */}
          <div className="absolute top-[18%] left-0 right-0 z-20 pointer-events-none">
            <div className="w-full max-w-2xl mx-auto px-6 flex justify-end">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1.0, delay: 0.3 }}
                className="w-10 h-14 md:w-11 md:h-16 bg-white/60 backdrop-blur-sm rounded-full overflow-hidden border border-slate-200/60 shadow-[inset_0_1px_4px_rgba(0,0,0,0.06),0_2px_8px_rgba(0,0,0,0.06)]"
              >
                {/* Committed Lm (Bottom - Sediment) */}
                <motion.div
                  className="absolute bottom-0 left-0 right-0 bg-slate-400/60 saturate-[0.2]"
                  initial={{ height: 0 }}
                  animate={{ height: `${committedHeight}%` }}
                  transition={{ duration: 1.2, ease: "easeOut" }}
                />
                {/* Available Lm (Top - Liquid Light) */}
                <motion.div
                  className="absolute left-0 right-0 bg-amber-300/70"
                  initial={{ height: 0, bottom: 0 }}
                  animate={{
                    height: `${availableHeight}%`,
                    bottom: `${committedHeight}%`,
                  }}
                  transition={{ duration: 1.2, ease: "easeOut", delay: 0.1 }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/20 to-transparent animate-pulse" />
                </motion.div>
                {/* Glass Reflection */}
                <div className="absolute inset-x-2 top-1 bottom-1 border-r border-white/30 rounded-full opacity-40 pointer-events-none" />
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/50 to-transparent opacity-60 pointer-events-none" />
              </motion.div>
            </div>
          </div>
        </>
      )}

      {/* 2. The Vessel (YinYang Coin) */}
      <div className="relative w-[80%] md:w-[70%] lg:w-[45%] max-w-[540px] lg:max-w-[480px] max-h-[70vh] aspect-square z-10">

        <motion.div
          className="absolute inset-0 rounded-full shadow-2xl shadow-slate-200/50 border-[1.5px] border-white overflow-hidden bg-white text-slate-900"
          animate={
            isRitualReady
              ? { 
                  opacity: [0.6, 1, 0.6], 
                  scale: [0.98, 1.04, 0.98],
                  filter: [
                    "drop-shadow(0px 0px 0px rgba(226,232,240,0)) brightness(0.95)", 
                    "drop-shadow(0px 10px 30px rgba(226,232,240,0.8)) brightness(1.05)", 
                    "drop-shadow(0px 0px 0px rgba(226,232,240,0)) brightness(0.95)"
                  ]
                }
              : { opacity: 1, scale: 1, filter: "none" }
          }
          transition={
            isRitualReady
              ? { duration: 4, repeat: Infinity, ease: "easeInOut" }
              : {}
          }
        >
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <defs>
              <filter id="dividerGlow">
                <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
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

              <linearGradient
                id="cocoonLight"
                x1="0%"
                y1="0%"
                x2="0%"
                y2="100%"
              >
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="100%" stopColor="#F1F5F9" />
              </linearGradient>
              <linearGradient
                id="cocoonShadow"
                x1="0%"
                y1="100%"
                x2="0%"
                y2="0%"
              >
                <stop offset="0%" stopColor="#E2E8F0" />
                <stop offset="100%" stopColor="#F8FAFC" />
              </linearGradient>
            </defs>
            <g transform="rotate(-45 50 50)">
              {/* Common Shape: The fills change based on state */}

              {/* Left Side (Yin) */}
              {/* Base: Monotone Shadow (Always there) */}
              <path
                d="M 0 50 A 25 25 0 0 1 50 50 A 25 25 0 0 0 100 50 A 50 50 0 0 1 0 50 Z"
                fill="url(#cocoonShadow)"
              />
              {/* Layer: Blue Gradient (Fade in when Color) */}
              <motion.path
                d="M 0 50 A 25 25 0 0 1 50 50 A 25 25 0 0 0 100 50 A 50 50 0 0 1 0 50 Z"
                fill="url(#yinGrad)"
                initial={{ opacity: 0 }}
                animate={{
                  opacity: showColor ? 1 : 0,
                  filter: isHoveringWish
                    ? "brightness(1.15) contrast(1.05)"
                    : "brightness(1) contrast(1)",
                }}
                transition={{
                  opacity: { duration: 1.5, ease: "easeInOut" },
                  filter: {
                    duration: 1.2,
                    repeat: isHoveringWish ? Infinity : 0,
                    repeatType: "mirror",
                    ease: "easeInOut",
                  },
                }}
              />

              {/* Right Side (Yang) */}
              {/* Base: Monotone Light (Always there) */}
              <path
                d="M 0 50 A 25 25 0 0 1 50 50 A 25 25 0 0 0 100 50 A 50 50 0 0 0 0 50 Z"
                fill="url(#cocoonLight)"
              />
              {/* Layer: Yellow Gradient (Fade in when Color) */}
              <motion.path
                d="M 0 50 A 25 25 0 0 1 50 50 A 25 25 0 0 0 100 50 A 50 50 0 0 0 0 50 Z"
                fill="url(#yangGrad)"
                initial={{ opacity: 0 }}
                animate={{
                  opacity: showColor ? 1 : 0,
                  filter: isHoveringHelp
                    ? "brightness(1.15) contrast(1.05)"
                    : "brightness(1) contrast(1)",
                }}
                transition={{
                  opacity: { duration: 1.5, ease: "easeInOut" },
                  filter: {
                    duration: 1.2,
                    repeat: isHoveringHelp ? Infinity : 0,
                    repeatType: "mirror",
                    ease: "easeInOut",
                  },
                }}
              />

              {/* Boundary Line */}
              <path
                d="M 0 50 A 25 25 0 0 1 50 50 A 25 25 0 0 0 100 50"
                fill="none"
                stroke={showColor ? "white" : "rgba(255,255,255,0.8)"}
                strokeWidth={showColor ? "1.5" : "1"}
                filter={showColor ? "url(#dividerGlow)" : ""}
                style={{ transition: "all 1.5s ease" }}
              />
            </g>
          </svg>
        </motion.div>

        {/* 3. Buttons (Swapping Content) - Now correctly anchored to the Vessel container so coordinate geometry matches exactly */}
        <AnimatePresence mode="wait">
          {isRitualReady ? (
            // Ritual Button
            <motion.button
              key="btn-ritual"
              onClick={handleRitual}
              className="absolute inset-0 flex flex-col items-center justify-center z-30 outline-none text-slate-500 hover:text-slate-600 transition-colors group"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex flex-col items-center relative">
                {/* Subtle breathing glow */}
                <motion.div 
                  className="absolute inset-0 bg-white/40 blur-2xl rounded-full scale-[2] transform -z-10 group-hover:bg-white/60 transition-colors duration-700"
                  animate={{ opacity: [0.1, 0.6, 0.1] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                />
                
                {/* Modest, sophisticated text */}
                <motion.div 
                  className="flex items-center justify-center cursor-pointer px-12 py-8"
                  animate={{ opacity: [0.6, 1, 0.6], scale: [0.98, 1.02, 0.98] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                >
                  <span className="text-xs sm:text-sm font-serif font-light tracking-[0.4em] sm:tracking-[0.6em] text-slate-500 group-hover:text-slate-800 transition-colors duration-700 uppercase drop-shadow-sm ml-[0.4em] sm:ml-[0.6em]">
                    {ritualMessage}
                  </span>
                </motion.div>
              </div>
            </motion.button>
          ) : (
            // Normal Buttons (Only show when showColor is true)
            showColor && (
              <>
                <motion.button
                  key="btn-help"
                  onClick={onOpenFlow}
                  onMouseEnter={() => setIsHoveringHelp(true)}
                  onMouseLeave={() => setIsHoveringHelp(false)}
                  className="absolute top-[32.32%] left-[67.68%] -translate-x-1/2 -translate-y-1/2 p-4 z-20 outline-none group text-amber-900/70"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1.5, delay: 0.5, ease: "easeOut" }}
                >
                  <div className="relative flex justify-center items-center transition-opacity duration-700">
                    <Inbox
                      size={36}
                      strokeWidth={1}
                      className="opacity-60 group-hover:opacity-100 transition-opacity duration-500 drop-shadow-sm"
                    />
                    <span className="absolute bottom-[100%] mb-3 text-lg font-serif font-bold tracking-[0.3em] text-amber-950/80 drop-shadow-sm whitespace-nowrap ml-[0.3em]">
                      {MESSAGES.HOME.BTN_RESPOND}
                    </span>
                  </div>
                </motion.button>

                <motion.button
                  key="btn-wish"
                  onClick={onOpenRequest}
                  onMouseEnter={() => setIsHoveringWish(true)}
                  onMouseLeave={() => setIsHoveringWish(false)}
                  className="absolute top-[67.68%] left-[32.32%] -translate-x-1/2 -translate-y-1/2 p-4 z-20 outline-none group text-indigo-900/70"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1.5, delay: 0.5, ease: "easeOut" }}
                >
                  <div className="relative flex justify-center items-center transition-opacity duration-700">
                    <Megaphone
                      size={36}
                      strokeWidth={1}
                      className="opacity-60 group-hover:opacity-100 transition-opacity duration-500 drop-shadow-sm"
                    />
                    <span className="absolute top-[100%] mt-3 text-lg font-serif font-bold tracking-[0.3em] text-indigo-950/80 drop-shadow-sm whitespace-nowrap ml-[0.3em]">
                      {MESSAGES.HOME.BTN_REQUEST}
                    </span>
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
              <p className="text-sm text-slate-800 font-medium leading-relaxed mb-6 whitespace-pre-wrap font-sans">
                {notification}
              </p>
              <button
                onClick={clearNotification}
                className="w-full py-3 bg-amber-400 hover:bg-amber-500 text-white rounded-xl text-base font-bold tracking-widest transition-colors shadow-sm active:scale-[0.98] font-sans"
              >
                {MESSAGES.HOME.BTN_UNDERSTOOD}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
