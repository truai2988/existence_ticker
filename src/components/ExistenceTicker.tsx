import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

import { UNIT_LABEL, LUNAR_CONSTANTS } from '../constants';
import { calculateDecayedValue, toMilli, fromMilli, getMillis } from '../logic/worldPhysics';

interface ExistenceTickerProps {
    balance: number;
    lastUpdated: unknown;
    rationReceived?: boolean; // Kept for interface compatibility but can be ignored or mapped to "Full Moon" flash
}

export const ExistenceTicker = React.memo<ExistenceTickerProps>(({ balance, lastUpdated, rationReceived }) => {
  const { t: MESSAGES } = useLanguage();
  const [displayValue, setDisplayValue] = useState(() => {
    const startMs = getMillis(lastUpdated);
    const elapsedSec = ((Date.now() - startMs) / 1000) | 0;
    return fromMilli(calculateDecayedValue(toMilli(balance), elapsedSec));
  });

  React.useEffect(() => {
    const update = () => {
        const startMs = getMillis(lastUpdated);
        const elapsedSec = ((Date.now() - startMs) / 1000) | 0;
        setDisplayValue(fromMilli(calculateDecayedValue(toMilli(balance), elapsedSec)));
    };

    update();
    const INTERVAL_MS = 3600000; 
    const timer = setInterval(update, INTERVAL_MS);
    return () => clearInterval(timer);
  }, [balance, lastUpdated]);

  const ratio = Math.max(0, Math.min(1, displayValue / LUNAR_CONSTANTS.FULL_MOON_BALANCE));
  
  return (
    <div className="relative flex flex-col items-center justify-center py-6 z-30 pointer-events-none">
        <div className="relative w-48 h-48 mb-6">
            <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_15px_rgba(255,255,200,0.3)]">
                <circle cx="50" cy="50" r="48" fill="#0f172a" stroke="#1e293b" strokeWidth="0.5" />
                <path 
                    d={`
                        M 50 4 
                        A 46 46 0 0 0 50 96 
                        A ${46 * Math.abs(2 * ratio - 1)} 46 0 0 ${ratio >= 0.5 ? 0 : 1} 50 4
                    `}
                    fill="#fbbf24"
                    opacity="0.9" 
                />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
            </div>
        </div>

        <div className="flex flex-col items-center">
            <div className="flex items-baseline gap-1">
                <span className="text-3xl font-mono font-medium text-yellow-100 tracking-tight drop-shadow-md tabular-nums">
                {Math.floor(displayValue).toLocaleString()}
                </span>
                <span className="text-xl font-serif text-yellow-500 ml-2">
                    {UNIT_LABEL}
                </span>
            </div>
            
            <div className="mt-2 text-sm text-slate-700 font-serif tracking-widest uppercase flex items-center gap-2">
                <span>{MESSAGES.TICKER.PHASE}: {ratio > 0.9 ? MESSAGES.TICKER.PHASE_FULL : ratio > 0.4 ? MESSAGES.TICKER.PHASE_HALF : MESSAGES.TICKER.PHASE_NEW}</span>
                <span className="opacity-80">|</span>
                <span>{((ratio) * 100).toFixed(0)}%</span>
            </div>

            {rationReceived && (
                 <div className="mt-2 text-xs text-yellow-300 animate-pulse font-serif">
                     {MESSAGES.TICKER.REIGNITE}
                 </div>
            )}
        </div>
    </div>
  );
});
