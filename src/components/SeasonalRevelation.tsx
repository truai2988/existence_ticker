import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Sun, CloudSnow, Scale } from 'lucide-react';
import { SeasonalEventData } from '../hooks/useSeasonalEvent';

interface SeasonalRevelationProps {
    eventData: SeasonalEventData | null;
    onComplete: () => void;
}

export const SeasonalRevelation: React.FC<SeasonalRevelationProps> = ({ eventData, onComplete }) => {
    useEffect(() => {
        if (eventData) {
            // Hide after 4 seconds (was 8s - too long)
            const timer = setTimeout(() => {
                onComplete();
            }, 4000);
            return () => clearTimeout(timer);
        }
    }, [eventData, onComplete]);

    if (!eventData) return null;

    return (
        <AnimatePresence>
            <div 
                onClick={onComplete}
                className="fixed inset-0 z-[9999] cursor-pointer flex items-center justify-center bg-[#F9F8F4] overflow-hidden"
            >
                {/* Washi Texture Overlay */}
                <div 
                    className="absolute inset-0 pointer-events-none opacity-[0.03] mix-blend-multiply" 
                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
                />
                
                <motion.div 
                    initial={{ opacity: 0, scale: 0.8, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="relative z-10 bg-white/90 backdrop-blur-xl p-8 rounded-2xl shadow-2xl max-w-sm text-center border overflow-hidden"
                >
                     <div className={`absolute top-0 left-0 w-full h-1 ${eventData.color}`} />
                     
                     <div className="text-xs font-mono uppercase tracking-widest text-slate-400 mb-2">
                         Divine Revelation
                     </div>
                     
                     <h2 className={`text-3xl font-bold mb-1 ${
                         eventData.season === 'Spring' ? 'text-green-600' :
                         eventData.season === 'Winter' ? 'text-slate-700' : 'text-yellow-600'
                     }`}>
                         {eventData.season}
                     </h2>
                     
                     <p className="text-sm text-slate-500 mb-4 font-mono">
                         Cycle Duration: {eventData.days} Days
                     </p>

                     <div className="flex justify-center mb-4 text-slate-400">
                         {eventData.season === 'Spring' && <Sun size={48} className="text-green-500 animate-pulse" />}
                         {eventData.season === 'Winter' && <CloudSnow size={48} className="text-slate-500" />}
                         {eventData.season === 'Equinox' && <Scale size={48} className="text-yellow-500" />}
                     </div>

                     <p className="text-slate-800 font-serif leading-relaxed">
                         {eventData.message}
                     </p>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
