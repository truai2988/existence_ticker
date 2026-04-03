import React, { useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'framer-motion';
import { useLanguage } from '../contexts/LanguageContext';

interface RitualOverlayProps {
  state: 'idle' | 'breathing' | 'blooming' | 'syncing';
  targetBalance: number;
}

const CountingNumber = ({ value, duration = 2 }: { value: number; duration?: number }) => {
  const count = useMotionValue(2400);
  const rounded = useTransform(count, (latest) => Math.floor(latest).toLocaleString());

  useEffect(() => {
    // EaseOutQuint: (1 - (1 - x)^5)
    const controls = animate(count, value, {
      duration: duration,
      ease: [0.23, 1, 0.32, 1], // EaseOutQuint approximation
    });
    return () => controls.stop();
  }, [value, duration, count]);

  return <motion.span>{rounded}</motion.span>;
};

export const RitualOverlay: React.FC<RitualOverlayProps> = ({ state, targetBalance }) => {
  const { t: MESSAGES } = useLanguage();
  if (state === 'idle') return null;

  return (
    <AnimatePresence>
      <motion.div 
        key="ritual-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.8 }}
        className="fixed inset-0 z-[1000] flex flex-col items-center justify-center bg-[#F9F8F4] overflow-hidden"
      >
        {/* Washi Texture Overlay */}
        <div 
            className="absolute inset-0 pointer-events-none opacity-[0.03] mix-blend-multiply" 
            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
        />

        {/* Ambient Light */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-amber-50/30 blur-[120px] rounded-full pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center">
            {/* Phase Label */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 0.4, y: 0 }}
              className="text-xs font-light tracking-[0.5em] text-slate-500 uppercase mb-12"
            >
                {state === 'breathing' && MESSAGES.RITUAL.BREATHING}
                {state === 'blooming' && MESSAGES.RITUAL.BLOOMING}
                {state === 'syncing' && MESSAGES.RITUAL.SYNCING}
            </motion.div>

            {/* Main Number Display */}
            <div className="h-24 flex items-center justify-center">
              <AnimatePresence mode="wait">
                {state === 'breathing' && (
                  <motion.div
                    key="breath"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: [0.2, 0.5, 0.2], scale: [0.95, 1, 0.95] }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    className="w-4 h-4 rounded-full bg-slate-200"
                  />
                )}

                {(state === 'blooming' || state === 'syncing') && (
                  <motion.div
                    key="number"
                    initial={{ opacity: 0, y: 20, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="text-7xl md:text-8xl font-serif font-medium tracking-tighter text-slate-700 tabular-nums text-shadow-sm"
                  >
                    {state === 'blooming' ? (
                        "2,400"
                    ) : (
                        <CountingNumber value={targetBalance} duration={2} />
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Subtext */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.3 }}
              className="mt-12 text-xs font-light tracking-widest text-slate-500 font-serif"
            >
                 {MESSAGES.RITUAL.SUBTEXT}
            </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
