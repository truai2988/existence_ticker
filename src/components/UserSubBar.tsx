import React from 'react';
import { useAuth } from '../hooks/useAuthHook';
import { useProfile } from '../hooks/useProfile';

export const UserSubBar: React.FC = () => {
    const { user } = useAuth();
    const { profile } = useProfile();
    
    // profile.name holds the display name
    const currentName = profile?.name || 'User';

    if (!user) return null;

    return (
        <div className="w-full bg-slate-50">
            <div className="max-w-md mx-auto px-6 py-3 flex justify-end items-center">
                <span className="text-[10px] text-slate-400 font-mono tracking-wide">
                    Signed in as: <span className="text-slate-500 font-bold">{currentName}</span>
                </span>
            </div>
        </div>
    );
};
