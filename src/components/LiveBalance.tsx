import React, { useState, useEffect } from 'react';
import { calculateLifePoints } from '../utils/decay';
import { UNIT_LABEL } from '../constants';

interface LiveBalanceProps {
    usage?: 'profile' | 'plain'; // Style variant
    balance: number;
    lastUpdated: unknown; // Firestore Timestamp or Date
    addUnit?: boolean;
}

/**
 * LiveBalance Component
 * Independently calculates and renders the biological balance.
 * Prevents parent components from re-rendering every frame.
 */
export const LiveBalance: React.FC<LiveBalanceProps> = ({ 
    usage = 'plain', 
    balance, 
    lastUpdated,
    addUnit = false
}) => {
    // Initial Calc
    const [displayValue, setDisplayValue] = useState(() => 
        calculateLifePoints(balance, lastUpdated)
    );

    useEffect(() => {
        // Sync immediate on prop change
        setDisplayValue(calculateLifePoints(balance, lastUpdated));

        // Self-contained loop
        const interval = setInterval(() => {
            const current = calculateLifePoints(balance, lastUpdated);
            setDisplayValue(current);
        }, 100); // 10fps is enough for text updates

        return () => clearInterval(interval);
    }, [balance, lastUpdated]);

    // === RENDER VARIANTS ===
    
    if (usage === 'profile') {
        // High-fidelity display for Profile (Big Interger, Small Decimal)
        return (
            <div className="flex items-baseline justify-end leading-none">
                <span className="text-2xl font-mono font-bold text-yellow-400 tabular-nums">
                    {Math.floor(displayValue)}
                </span>
                <span className="text-sm text-yellow-500/60 font-mono ml-0.5">
                    .{(displayValue % 1).toFixed(2).substring(2)}
                </span>
                {addUnit && <span className="text-sm font-normal text-yellow-500 ml-1">{UNIT_LABEL}</span>}
            </div>
        );
    }

    // Default Plain Text (e.g. for small headers)
    return (
        <span className="font-mono tabular-nums">
            {displayValue.toFixed(2)}
            {addUnit && ` ${UNIT_LABEL}`}
        </span>
    );
};
