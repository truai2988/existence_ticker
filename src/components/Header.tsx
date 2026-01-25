import React, { useEffect, useState } from 'react';
import { calculateLifePoints } from '../utils/decay';
import { UNIT_LABEL, LUNAR_CONSTANTS } from '../constants';

import { useProfile } from '../hooks/useProfile';

interface HeaderProps {
    balance: number;
    lastUpdated: unknown; // Optional if we fetch internally
}

export const Header: React.FC<HeaderProps> = ({ balance }) => {
    const { profile } = useProfile();
    const lastUpdated = profile?.last_updated;
    const [displayValue, setDisplayValue] = useState(() => calculateLifePoints(balance, lastUpdated));

    useEffect(() => {
        setDisplayValue(calculateLifePoints(balance, lastUpdated));
        const interval = setInterval(() => {
            setDisplayValue(calculateLifePoints(balance, lastUpdated));
        }, 100); // 10 updates per second for smooth appearance
        return () => clearInterval(interval);
    }, [balance, lastUpdated]);

    return (
        <header className="fixed top-0 left-0 right-0 bg-white/90 backdrop-blur-md pt-safe z-40 px-6 py-4 flex flex-col items-center justify-center border-b border-slate-100/50 shadow-sm">
             <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">
                 残高
             </span>
             <div className="flex items-baseline gap-1">
                 <span className="text-3xl font-mono font-bold text-slate-900 tracking-tighter tabular-nums">
                     {Math.floor(displayValue).toLocaleString()}
                 </span>
                 <span className="text-lg font-mono text-slate-400 tabular-nums">
                     .{(displayValue % 1).toFixed(2).substring(2)}
                 </span>
                 <span className="text-sm font-bold text-slate-500 ml-1">
                     {UNIT_LABEL}
                 </span>
             </div>
             
             {/* Capacity Gauge */}
             <div className="w-full max-w-[120px] h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden relative">
                 <div 
                    className="h-full bg-gradient-to-r from-yellow-300 to-yellow-500 transition-all duration-700 ease-out shadow-[0_0_8px_rgba(234,179,8,0.4)]"
                    style={{ 
                        width: `${Math.min(100, (Math.max(0, displayValue) / LUNAR_CONSTANTS.FULL_MOON_BALANCE) * 100)}%` 
                    }} 
                 />
             </div>
        </header>
    );
};
