import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Inbox, Megaphone, AlertCircle } from "lucide-react";
import { useWallet } from "../hooks/useWallet";
import { useProfile } from "../hooks/useProfile";
import { AppMode } from "../hooks/useStartupMachine";
import { LUNAR_CONSTANTS } from "../constants";
import { useLanguage } from "../contexts/LanguageContext";
import { getMillis } from "../logic/worldPhysics";

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
  const { performRebirthReset, availableLm, committedLm, balance } = useWallet();
  const { profile, updateProfile } = useProfile();
  const { t: MESSAGES } = useLanguage();
  const [notification, setNotification] = React.useState<string | null>(null);

  const cycleDays = profile?.scheduled_cycle_days || 10;
  const cycleStartedAt = getMillis(
    profile?.cycle_started_at || profile?.created_at,
  );
  const nextReset = cycleStartedAt + cycleDays * 24 * 60 * 60 * 1000;
  const daysLeft = Math.max(
    0,
    Math.ceil((nextReset - Date.now()) / (1000 * 60 * 60 * 24)),
  );

  // Water Clock calculations
  const maxCapacity = LUNAR_CONSTANTS.REBIRTH_AMOUNT;
  const committedHeight = Math.min(100, (committedLm / maxCapacity) * 100);
  const availableHeight = Math.min(100, (availableLm / maxCapacity) * 100);

  const ritualMessage = MESSAGES.HOME.MONOTONE_MSG_1;
  const [isWishAnimating, setIsWishAnimating] = React.useState(false);
  const [isHelpAnimating, setIsHelpAnimating] = React.useState(false);

  const handleWishClick = async () => {
    setIsWishAnimating(true);
    await new Promise((r) => setTimeout(r, 800)); // アニメーションが完了するまで待つ
    onOpenRequest();
    setIsWishAnimating(false);
  };

  const handleHelpClick = async () => {
    setIsHelpAnimating(true);
    await new Promise((r) => setTimeout(r, 800));
    onOpenFlow();
    setIsHelpAnimating(false);
  };

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
    <div className="flex flex-col items-center justify-start w-full relative min-h-full pb-6">
      {/* 1. Backdrop Glow (Dynamic but Subtle) */}
      <div className="absolute inset-0 bg-gradient-radial from-amber-50/10 via-transparent to-transparent pointer-events-none" />

      {/* FLEX LAYOUT CONTAINER FOR CONTENT */}
      <div className="flex-1 flex flex-col w-full h-full justify-between z-10 relative">
        
        {/* TOP AREA: Balance & Water Clock */}
        <div className="w-full flex-none pt-2 md:pt-4 min-h-[100px] relative">
          <div className="w-full max-w-2xl mx-auto px-6 relative flex justify-center">
            {/* Balance Display (Centered) */}
            {showColor && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="flex flex-col items-center gap-2 pointer-events-none"
              >
                {/* Moved from Header */}
                <div className="flex items-center gap-2 text-slate-700 mb-2 mt-[-0.5rem] font-serif text-xs font-medium tracking-[0.15em]">
                  <span className="uppercase">
                    {MESSAGES.LAYOUT.HEADER_BALANCE}{Math.floor(balance).toLocaleString()}
                  </span>
                  <div className="w-[1px] h-2.5 bg-slate-400" />
                  <span>
                    {MESSAGES.LAYOUT.HEADER_DAYS_LEFT_PREFIX}{daysLeft}{MESSAGES.LAYOUT.HEADER_DAYS_LEFT_SUFFIX}
                  </span>
                </div>
                <div className="text-xs font-serif font-medium tracking-[0.15em] text-slate-700 mr-[0.15em]">
                  {MESSAGES.HOME.AVAILABLE_LM}
                </div>
                <div className="text-4xl md:text-5xl font-serif font-extralight tracking-[-0.02em] tabular-nums leading-none text-slate-700 transition-all duration-1000">
                  {Math.floor(availableLm).toLocaleString()}
                </div>
              </motion.div>
            )}

            {/* Water Clock (Absolute to Top Right of Container, aligned with contents) */}
            {showColor && (
              <div className="absolute right-6 top-5 md:top-6 pointer-events-none">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 1.0, delay: 0.3 }}
                  className="w-10 h-14 md:w-11 md:h-16 bg-white border border-cyan-100/50 rounded-full overflow-hidden shadow-[inset_0_1px_6px_rgba(6,182,212,0.1),0_4px_12px_rgba(6,182,212,0.05)] relative"
                >
                  {/* Committed Lm (Bottom - Heavy Deep Water / Sediment) */}
                  <motion.div
                    className="absolute bottom-0 left-0 right-0 bg-cyan-900/30 saturate-[0.5]"
                    initial={{ height: 0 }}
                    animate={{ height: `${committedHeight}%` }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                  />
                  {/* Available Lm (Top - Noctiluca Bioluminescent Liquid) */}
                  <motion.div
                    className="absolute left-0 right-0 bg-cyan-400/60"
                    initial={{ height: 0, bottom: 0 }}
                    animate={{
                      height: `${availableHeight}%`,
                      bottom: `${committedHeight}%`,
                    }}
                    transition={{ duration: 1.2, ease: "easeOut", delay: 0.1 }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/40 to-transparent animate-pulse" />
                  </motion.div>
                  {/* Glass Reflection */}
                  <div className="absolute inset-x-2 top-1 bottom-1 border-r border-white/50 rounded-full opacity-80 pointer-events-none" />
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/60 to-transparent opacity-70 pointer-events-none" />
                </motion.div>
              </div>
            )}
          </div>
        </div>

        {/* MIDDLE AREA: The Vessel */}
        <div className="flex-1 flex items-center justify-center w-full min-h-[220px]">
          <div className="relative w-[45%] md:w-[35%] lg:w-[25%] max-w-[280px] aspect-square">
            <motion.div
              className="absolute inset-0 rounded-full backdrop-blur-3xl overflow-hidden bg-white/20 text-slate-900 border-[0.5px] border-white/10"
              animate={
                isRitualReady
                  ? { 
                      opacity: [0.6, 1, 0.6], 
                      scale: [0.98, 1.04, 0.98],
                      filter: [
                        "drop-shadow(0px 0px 0px rgba(226,232,240,0)) brightness(0.95)", 
                        "drop-shadow(0px 10px 40px rgba(226,232,240,0.4)) brightness(1.05)", 
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
                    <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
                    <feMerge>
                      <feMergeNode in="coloredBlur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                  <linearGradient id="yangGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#FFFBEB" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#FCD34D" stopOpacity="0.5" />
                  </linearGradient>
                  <linearGradient id="yinGrad" x1="0%" y1="100%" x2="0%" y2="0%">
                    <stop offset="0%" stopColor="#EEF2FF" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#A5B4FC" stopOpacity="0.5" />
                  </linearGradient>
                </defs>
                <g transform="rotate(-45 50 50)">
                  {/* Left Side (Yin) */}
                  <motion.path
                    d="M 0 50 A 25 25 0 0 1 50 50 A 25 25 0 0 0 100 50 A 50 50 0 0 1 0 50 Z"
                    fill="url(#yinGrad)"
                    animate={{
                      opacity: showColor ? 1 : 0.2,
                    }}
                    transition={{ duration: 0.8 }}
                  />
                  {/* Yin Click Glow Overlay (Mobile Safe) */}
                  <motion.path
                    d="M 0 50 A 25 25 0 0 1 50 50 A 25 25 0 0 0 100 50 A 50 50 0 0 1 0 50 Z"
                    fill="#FFFFFF"
                    style={{ mixBlendMode: 'overlay' }}
                    animate={{
                      opacity: isWishAnimating ? 0.7 : 0,
                    }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                  />
                  {/* Right Side (Yang) */}
                  <motion.path
                    d="M 0 50 A 25 25 0 0 1 50 50 A 25 25 0 0 0 100 50 A 50 50 0 0 0 0 50 Z"
                    fill="url(#yangGrad)"
                    animate={{
                      opacity: showColor ? 1 : 0.2,
                    }}
                    transition={{ duration: 0.8 }}
                  />
                  {/* Yang Click Glow Overlay (Mobile Safe) */}
                  <motion.path
                    d="M 0 50 A 25 25 0 0 1 50 50 A 25 25 0 0 0 100 50 A 50 50 0 0 0 0 50 Z"
                    fill="#FFFFFF"
                    style={{ mixBlendMode: 'overlay' }}
                    animate={{
                      opacity: isHelpAnimating ? 0.7 : 0,
                    }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                  />
                  {/* Boundary Line (Faint) */}
                  <path
                    d="M 0 50 A 25 25 0 0 1 50 50 A 25 25 0 0 0 100 50"
                    fill="none"
                    stroke="white"
                    strokeWidth="0.8"
                    strokeOpacity="0.4"
                    filter="url(#dividerGlow)"
                  />
                </g>
              </svg>
            </motion.div>

            {/* Ritual Overlay Button */}
            <AnimatePresence>
              {isRitualReady && (
                <motion.button
                  key="btn-ritual"
                  onClick={handleRitual}
                  className="absolute inset-0 flex flex-col items-center justify-center z-30 outline-none text-slate-700 group"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span className="text-xs font-serif font-medium tracking-widest text-slate-700 group-hover:text-slate-800 transition-colors uppercase ml-[0.1em]">
                    {ritualMessage}
                  </span>
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* BOTTOM AREA: Interaction Buttons */}
        <div className="w-full flex-none pb-[5vh] max-h-[25vh]">
          <div className="w-full max-w-2xl mx-auto flex justify-center items-center gap-12 md:gap-24 px-4">
            <AnimatePresence>
              {showColor && (
                <>
                  {/* Request / お願い */}
                  <motion.button
                    key="btn-wish"
                    onClick={handleWishClick}
                    className="flex flex-col items-center group outline-none"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 1.0, delay: 0.8 }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <div className={`w-16 h-16 rounded-full bg-white border border-slate-200 flex items-center justify-center transition-all duration-500
                      ${isWishAnimating ? "shadow-[0_0_20px_rgba(165,180,252,0.4)] bg-indigo-50" : "shadow-sm group-hover:shadow-[0_0_15px_rgba(165,180,252,0.2)] group-hover:bg-indigo-50/50"}`}>
                      <Megaphone size={28} strokeWidth={1} className={`transition-colors duration-500 ${isWishAnimating ? "text-indigo-900" : "text-indigo-900/60 group-hover:text-indigo-900"}`} />
                    </div>
                    <span className="mt-4 text-xs font-serif font-medium tracking-widest text-slate-700 uppercase ml-[0.1em]">
                      {MESSAGES.HOME.BTN_REQUEST}
                    </span>
                  </motion.button>

                  {/* Respond / お返事 */}
                  <motion.button
                    key="btn-help"
                    onClick={handleHelpClick}
                    className="flex flex-col items-center group outline-none"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 1.0, delay: 1.0 }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <div className={`w-16 h-16 rounded-full bg-white border border-slate-200 flex items-center justify-center transition-all duration-500
                      ${isHelpAnimating ? "shadow-[0_0_20px_rgba(252,211,77,0.4)] bg-amber-50" : "shadow-sm group-hover:shadow-[0_0_15px_rgba(252,211,77,0.2)] group-hover:bg-amber-50/50"}`}>
                      <Inbox size={28} strokeWidth={1} className={`transition-colors duration-500 ${isHelpAnimating ? "text-amber-900" : "text-amber-900/60 group-hover:text-amber-900"}`} />
                    </div>
                    <span className="mt-4 text-xs font-serif font-medium tracking-widest text-slate-700 uppercase ml-[0.1em]">
                      {MESSAGES.HOME.BTN_RESPOND}
                    </span>
                  </motion.button>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* 6. System Notifications (Logic Preserved) */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/10 backdrop-blur-sm"
          >
            <div className="bg-white border text-center border-white/40 p-8 rounded-3xl shadow-2xl max-w-sm w-full flex flex-col items-center">
              <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center mb-6">
                <AlertCircle className="text-amber-500" size={24} strokeWidth={1.5} />
              </div>
              <p className="text-sm text-slate-900 font-light leading-relaxed mb-8 whitespace-pre-wrap font-serif">
                {notification}
              </p>
              <button
                onClick={clearNotification}
                className="w-full py-4 bg-slate-900 text-white rounded-2xl text-xs font-serif font-light tracking-[0.4em] uppercase transition-all hover:bg-slate-800 active:scale-95 shadow-lg"
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
