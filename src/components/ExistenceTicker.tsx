import React, { useState } from 'react';

import { calculateLifePoints } from '../utils/decay';
import { UNIT_LABEL, LUNAR_CONSTANTS } from '../constants';

interface ExistenceTickerProps {
    balance: number;
    lastUpdated: unknown;
    rationReceived?: boolean; // Kept for interface compatibility but can be ignored or mapped to "Full Moon" flash
}

export const ExistenceTicker: React.FC<ExistenceTickerProps> = ({ balance, lastUpdated, rationReceived }) => {
  const [displayValue, setDisplayValue] = useState(() => calculateLifePoints(balance, lastUpdated));

  React.useEffect(() => {
    setDisplayValue(calculateLifePoints(balance, lastUpdated));
    const INTERVAL_MS = 33; 
    const timer = setInterval(() => {
        setDisplayValue(calculateLifePoints(balance, lastUpdated));
    }, INTERVAL_MS);
    return () => clearInterval(timer);
  }, [balance, lastUpdated]);

  // === Moon Phase Calculation ===
  // 1.0 (Full) -> 0.0 (New)
  const ratio = Math.max(0, Math.min(1, displayValue / LUNAR_CONSTANTS.FULL_MOON_BALANCE));
  
  // Shadow Offset for simplistic Waning effect
  // Full Moon (1.0) -> No Shadow
  // New Moon (0.0) -> Full Shadow
  // We can simulate this with an SVG 'path' for the Terminator line, but a simple mask is easier.
  // 1.0 -> 0.5: Right side shrinks.
  // 0.5 -> 0.0: Left side shrinks.
  
  return (
    <div className="relative flex flex-col items-center justify-center py-6 z-30 pointer-events-none">
      
        {/* === MOON VISUALIZATION === */}
        {/* === MOON VISUALIZATION === */}
        <div className="relative w-48 h-48 mb-6">
            <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_15px_rgba(255,255,200,0.3)]">
                {/* 1. Dark Moon Base (The Void) */}
                <circle cx="50" cy="50" r="48" fill="#0f172a" stroke="#1e293b" strokeWidth="0.5" />

                {/* 2. Lit Moon (Waning Phase Logic) 
                    Waning: Light is on the LEFT side.
                    Full (1.0) -> Last Quarter (0.5) -> New (0.0)
                */}
                <path 
                    d={`
                        M 50 4 
                        A 46 46 0 0 0 50 96 
                        A ${46 * Math.abs(2 * ratio - 1)} 46 0 0 ${ratio >= 0.5 ? 0 : 1} 50 4
                    `}
                    fill="#fbbf24"
                    opacity="0.9" 
                    // Note: 
                    // M 50 4 ... A ... 50 96 : Draws Left Semicircle (Outer Edge).
                    // A ... 50 4 : Draws Terminator back to top.
                    // If ratio > 0.5 (Gibbous): Terminator bulges Right (Sweep 1).
                    // If ratio < 0.5 (Crescent): Terminator bulges Left (Sweep 0).
                />
            </svg>
            
            {/* Value Overlay (Centered or Below) */}
            <div className="absolute inset-0 flex items-center justify-center">
                 {/* Optional: Glow or Text */}
            </div>
        </div>

        {/* === VALUE DISPLAY === */}
        <div className="flex flex-col items-center">
            {/* Main Number */}
            <div className="flex items-baseline gap-1">
                <span className="text-3xl font-mono font-medium text-yellow-100 tracking-tight drop-shadow-md tabular-nums">
                {Math.floor(displayValue)}
                </span>
                <span className="text-xl font-mono text-yellow-500/60 tabular-nums">
                .{(displayValue % 1).toFixed(2).substring(2)}
                </span>
                <span className="text-xl font-serif text-yellow-500 ml-2">
                    {UNIT_LABEL}
                </span>
            </div>
            
            {/* Phase Label */}
            <div className="mt-2 text-[11px] text-slate-500 font-serif tracking-widest uppercase flex items-center gap-2">
                <span>Phase: {ratio > 0.9 ? 'FULL MOON' : ratio > 0.4 ? 'WANING' : 'NEW MOON'}</span>
                <span className="opacity-50">|</span>
                <span>{((ratio) * 100).toFixed(0)}%</span>
            </div>

            {/* Reset Indicator (Flash) */}
            {rationReceived && (
                 <div className="mt-2 text-xs text-yellow-300 animate-pulse font-serif">
                     ✦ Full Moon Reset ✦
                 </div>
            )}
        </div>
    </div>
  );
};
