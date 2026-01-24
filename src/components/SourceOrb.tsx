import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SourceOrbProps {
  onMint: () => void;
  totalEnergy: number;
}

export const SourceOrb: React.FC<SourceOrbProps> = ({ onMint, totalEnergy }) => {
  const [ripples, setRipples] = useState<{id: number}[]>([]);

  
  const handleInteraction = () => {
    // Generate shockwave/ripple
    const newRipple = { id: Date.now() };
    setRipples(prev => [...prev, newRipple]);
    
    // Cleanup ripple after animation
    setTimeout(() => {
        setRipples(prev => prev.filter(r => r.id !== newRipple.id));
    }, 1000);

    onMint();
  };

  return (
    <div className="relative flex items-center justify-center w-64 h-64">
      {/* Expanding Shockwaves */}
      <AnimatePresence>
        {ripples.map(r => (
           <motion.div
             key={r.id}
             className="absolute inset-0 rounded-full border-2 border-gold-100/80 z-0 bg-gold-400/20"
             initial={{ scale: 0.8, opacity: 1 }}
             animate={{ scale: 2.5, opacity: 0 }}
             exit={{ opacity: 0 }}
             transition={{ duration: 0.8, ease: "easeOut" }}
           />
        ))}
      </AnimatePresence>
      
      {/* Core Orb - Abstract "Living Star" */}
      <motion.button
        className="w-32 h-32 rounded-full relative z-10 focus:outline-none"
        onClick={handleInteraction}
        whileTap={{ scale: 0.9 }}
        animate={{ 
            scale: [1, 1.05, 1],
            boxShadow: [
                "0 0 20px rgba(251,192,45,0.3)",
                "0 0 40px rgba(251,192,45,0.6)",
                "0 0 20px rgba(251,192,45,0.3)"
            ]
        }}
        transition={{ 
            duration: 3, 
            repeat: Infinity, 
            ease: "easeInOut" 
        }}
      >
        {/* Inner Gradient - Depth */}
        <div className="absolute inset-0 rounded-full bg-gradient-radial from-gold-100 via-gold-400 to-gold-600 shadow-inner"></div>
        
        {/* Surface Activity - Subtle spinning texture or glow */}
        <motion.div 
            className="absolute inset-0 rounded-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-30 mix-blend-overlay"
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        />
        
        {/* Core Glow */}
        <div className="absolute inset-0 rounded-full bg-gold-300 blur-xl opacity-50 animate-pulse-slow"></div>
      </motion.button>

      {/* Ambient Halo - Linked to Energy */}
      <motion.div 
        className="absolute inset-0 pointer-events-none rounded-full border border-gold-400/10"
        animate={{ 
            scale: Math.min(1.2 + (totalEnergy / 1000), 2.5), // Expands with energy
            opacity: Math.min(0.2 + (totalEnergy / 500), 0.8) // Brightens with energy
        }}
        transition={{ duration: 1 }}
      />
      <motion.div 
        className="absolute inset-0 pointer-events-none rounded-full border border-gold-400/5"
        animate={{ 
            scale: Math.min(1.5 + (totalEnergy / 1000), 3.0),
            opacity: Math.min(0.1 + (totalEnergy / 500), 0.5)
        }}
        transition={{ duration: 1.5 }}
      />
    </div>
  );
};

