import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface GateScreenProps {
  onOpen: () => void;
}

export const GateScreen = ({ onOpen }: GateScreenProps) => {
  const [isOpening, setIsOpening] = useState(false);

  const handleOpenDoor = () => {
    setIsOpening(true);
    // Let the animation finish before calling onOpen
    setTimeout(onOpen, 1200);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#F9F8F4] overflow-hidden">
      {/* Washi Texture Overlay */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.03] mix-blend-multiply" 
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
      />

      <AnimatePresence>
        {!isOpening && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.1, filter: 'blur(10px)' }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
            className="relative z-10 flex flex-col items-center text-center px-6"
          >
            {/* Breathing Message */}
            <motion.p
              animate={{ 
                scale: [0.98, 1.0, 0.98],
                opacity: [0.8, 1, 0.8]
              }}
              transition={{ 
                duration: 6, 
                repeat: Infinity, 
                ease: "easeInOut" 
              }}
              className="text-lg md:text-xl font-serif text-[#4A4A4A] tracking-[0.1em] leading-loose mb-16"
            >
              「あなたの光（Lm）を、大切に守るための場所へ。」
            </motion.p>

            {/* Door Button */}
            <button
              onClick={handleOpenDoor}
              className="group relative px-12 py-5 bg-transparent border border-[#E5E5E5] rounded-xl tracking-[0.3em] text-[11px] uppercase text-[#777777] hover:text-[#2D2D2D] transition-all duration-700 overflow-hidden"
            >
              <span className="relative z-10 transition-transform group-hover:tracking-[0.4em] duration-700">扉を開く</span>
              
              {/* Subtle hover background */}
              <div className="absolute inset-0 bg-white/40 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Light Expansion Effect */}
      <AnimatePresence>
        {isOpening && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 10, opacity: 1 }}
            transition={{ duration: 1.2, ease: [0.4, 0, 0.2, 1] }}
            className="absolute z-20 w-64 h-64 bg-white rounded-full blur-[100px]"
          />
        )}
      </AnimatePresence>
    </div>
  );
};
