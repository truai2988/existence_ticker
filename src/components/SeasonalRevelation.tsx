import React, { useEffect, useState } from 'react';
import { db } from '../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { AnimatePresence, motion } from 'framer-motion';
import { Sun, CloudSnow, Scale } from 'lucide-react';

export const SeasonalRevelation: React.FC = () => {
    const [notification, setNotification] = useState<{
        season: string;
        days: number;
        message: string;
        color: string;
    } | null>(null);

    const [prevDays, setPrevDays] = useState<number | null>(null);

    useEffect(() => {
        if (!db) return;
        const unsub = onSnapshot(doc(db, "system_settings", "global"), (doc) => {
            if (doc.exists()) {
                const data = doc.data();
                const newDays = data.cycleDays || 10;

                // Only show if it CHANGED (and not first load)
                if (prevDays !== null && prevDays !== newDays) {
                    let season = "Equinox";
                    let message = "世界が調和を取り戻しました。";
                    let color = "bg-yellow-500";

                    if (newDays < 10) {
                        season = "Spring";
                        message = "豊穣の季節が訪れました。恵みが増幅します。";
                        color = "bg-green-500";
                    } else if (newDays > 10) {
                        season = "Winter";
                        message = "試練の季節が始まりました。備えなさい。";
                        color = "bg-slate-600";
                    }

                    setNotification({
                        season,
                        days: newDays,
                        message,
                        color,
                    });

                    // Hide after 8 seconds
                    setTimeout(() => setNotification(null), 8000);
                }
                setPrevDays(newDays);
            }
        });

        return () => unsub();
    }, [prevDays]);

    if (!notification) return null;

    return (
        <AnimatePresence>
            {notification && (
                <div className="fixed inset-0 z-[9999] pointer-events-none flex items-center justify-center bg-black/20 backdrop-blur-sm">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.8, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="bg-white/90 backdrop-blur-xl p-8 rounded-2xl shadow-2xl max-w-sm text-center border overflow-hidden relative"
                    >
                         <div className={`absolute top-0 left-0 w-full h-1 ${notification.color}`} />
                         
                         <div className="text-xs font-mono uppercase tracking-widest text-slate-400 mb-2">
                             Divine Revelation
                         </div>
                         
                         <h2 className={`text-3xl font-bold mb-1 ${
                             notification.season === 'Spring' ? 'text-green-600' :
                             notification.season === 'Winter' ? 'text-slate-700' : 'text-yellow-600'
                         }`}>
                             {notification.season}
                         </h2>
                         
                         <p className="text-sm text-slate-500 mb-4 font-mono">
                             Cycle Duration: {notification.days} Days
                         </p>

                         <div className="flex justify-center mb-4 text-slate-400">
                             {notification.season === 'Spring' && <Sun size={48} className="text-green-500 animate-pulse" />}
                             {notification.season === 'Winter' && <CloudSnow size={48} className="text-slate-500" />}
                             {notification.season === 'Equinox' && <Scale size={48} className="text-yellow-500" />}
                         </div>

                         <p className="text-slate-800 font-serif leading-relaxed">
                             {notification.message}
                         </p>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
