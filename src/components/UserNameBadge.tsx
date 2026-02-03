import React from 'react';
import { useProfile } from '../hooks/useProfile';

export const UserNameBadge: React.FC = () => {
    const { profile } = useProfile();

    if (!profile) return null;

    return (
        <div className="flex flex-col items-end opacity-40 hover:opacity-100 transition-opacity pointer-events-auto cursor-default">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 leading-none mb-0.5">
                Login
            </span>
            <span className="text-xs font-bold text-slate-600 leading-none">
                {profile.name}
            </span>
        </div>
    );
};
