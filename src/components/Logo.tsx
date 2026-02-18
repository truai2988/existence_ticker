import React from 'react';

interface LogoProps {
    className?: string;
}

export const Logo: React.FC<LogoProps> = ({ className = "text-slate-300" }) => {
    return (
        <div className={`text-xs font-bold tracking-[0.4em] uppercase select-none ${className}`}>
            Existence Ticker
        </div>
    );
};
