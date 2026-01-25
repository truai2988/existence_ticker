import React from 'react';
import React from 'react';
import { motion } from 'framer-motion';
import { X, User, Star, Heart } from 'lucide-react';
import { useOtherProfile } from '../hooks/useOtherProfile';

interface PublicProfileModalProps {
    userId: string;
    onClose: () => void;
}

export const PublicProfileModal: React.FC<PublicProfileModalProps> = ({ userId, onClose }) => {
    const { profile, loading } = useOtherProfile(userId);

    // If loading or null, show skeleton or something
    if (loading && !profile) {
        return (
            <div className="fixed inset-0 z-[70] bg-black/50 backdrop-blur-sm flex items-center justify-center p-6 animate-fade-in">
                <div className="bg-white p-6 rounded-2xl w-full max-w-sm flex justify-center">
                    <div className="animate-spin w-8 h-8 border-4 border-slate-200 border-t-slate-500 rounded-full"></div>
                </div>
            </div>
        );
    }
    
    if (!profile) return null; // Should not happen usually

    // Stats
    const xp = profile.xp || 0;         // Trust
    const warmth = profile.warmth || 0; // Gifts Given
    const helpCount = profile.completed_contracts || 0;
    const reqCount = profile.created_contracts || 0;
    
    // Determine Rank/Badge
    const getRank = (score: number) => {
        if (score >= 1000) return { label: 'Legend', color: 'text-amber-500', bg: 'bg-amber-100' };
        if (score >= 100) return { label: 'Veteran', color: 'text-purple-500', bg: 'bg-purple-100' };
        if (score >= 10) return { label: 'Regular', color: 'text-blue-500', bg: 'bg-blue-100' };
        return { label: 'Newcomer', color: 'text-slate-500', bg: 'bg-slate-100' };
    };
    const rank = getRank(helpCount); // Or based on XP?

    return (
        <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 animate-fade-in">
            <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white w-full max-w-xs rounded-3xl overflow-hidden shadow-2xl relative"
            >
                {/* Header Pattern */}
                <div className="h-24 bg-gradient-to-br from-slate-100 to-slate-200 relative">
                    <button 
                         onClick={onClose}
                         className="absolute top-4 right-4 p-2 bg-white/50 hover:bg-white rounded-full transition-colors backdrop-blur-sm"
                    >
                        <X size={18} className="text-slate-600" />
                    </button>
                </div>

                {/* Avatar & Name */}
                <div className="px-6 -mt-10 pb-6 text-center">
                    <div className="w-20 h-20 mx-auto bg-white rounded-full p-1 shadow-sm mb-3">
                        <div className="w-full h-full bg-slate-50 rounded-full flex items-center justify-center border border-slate-100">
                             <User size={36} className="text-slate-300" />
                        </div>
                    </div>
                    
                    <h2 className="text-xl font-bold text-slate-800 mb-1">{profile.name}</h2>
                    <div className="flex justify-center gap-2 mb-4">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${rank.bg} ${rank.color}`}>
                            {rank.label}
                        </span>
                        <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-mono">
                            ID: {profile.id.slice(0,6)}
                        </span>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-3 mb-6">
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                            <div className="flex items-center justify-center gap-1.5 mb-1">
                                <Star size={14} className="text-blue-400" />
                                <span className="text-xs font-bold text-slate-400">実績 (XP)</span>
                            </div>
                            <div className="text-lg font-bold text-slate-700">{xp.toLocaleString()}</div>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                             <div className="flex items-center justify-center gap-1.5 mb-1">
                                <Heart size={14} className="text-pink-400" />
                                <span className="text-xs font-bold text-slate-400">贈与 (Warmth)</span>
                            </div>
                            <div className="text-lg font-bold text-slate-700">{warmth.toLocaleString()}</div>
                        </div>
                    </div>

                    {/* Count Details */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-center p-3 bg-white border border-slate-100 rounded-lg shadow-sm">
                            <span className="text-xs font-bold text-slate-500">誰かを手伝った回数</span>
                            <span className="text-sm font-bold text-slate-800">{helpCount}回</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-white border border-slate-100 rounded-lg shadow-sm">
                            <span className="text-xs font-bold text-slate-500">依頼した回数</span>
                            <span className="text-sm font-bold text-slate-800">{reqCount}回</span>
                        </div>
                    </div>
                </div>

                {/* Footer Decor */}
                <div className="h-2 w-full bg-slate-100"></div>
            </motion.div>
        </div>
    );
};
