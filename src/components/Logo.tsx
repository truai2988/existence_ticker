import React from 'react';

interface LogoProps {
    className?: string;
}

export const Logo: React.FC<LogoProps> = ({ className = "text-slate-500" }) => {
    return (
        <span className={`inline-block font-serif tracking-[0.3em] uppercase select-none ${className}`}>
            Existence Ticker
        </span>
    );
};
