import React from 'react';
import { motion } from 'framer-motion';
import { X, User, Handshake, Megaphone } from 'lucide-react';
import { useOtherProfile } from '../hooks/useOtherProfile';
import { getTrustRank } from '../utils/trustRank';

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
    const helpCount = profile.completed_contracts || 0;
    const reqCount = profile.completed_requests || 0;
    
    const rank = getTrustRank(helpCount); 

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
                <div className="px-6 -mt-10 pb-8 text-center relative z-10">
                    <div className="w-20 h-20 mx-auto bg-white rounded-full p-1 shadow-sm mb-3">
                        <div className="w-full h-full bg-slate-50 rounded-full flex items-center justify-center border border-slate-100">
                             <User size={36} className="text-slate-300" />
                        </div>
                    </div>
                    
                    <h2 className="text-xl font-bold text-slate-800 mb-1">{profile.name}</h2>
                    <div className="flex justify-center gap-2 mb-6">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${rank.bg} ${rank.color}`}>
                            {rank.label}
                        </span>
                        <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-mono">
                            ID: {profile.id.slice(0,6)}
                        </span>
                    </div>

                    {/* Count Details (Consolidated & Emphasized) */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between p-4 bg-blue-50/50 border border-blue-100 rounded-xl">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                    <Handshake size={20} />
                                </div>
                                <div className="text-left">
                                    <div className="text-xs font-bold text-blue-400">手伝った回数</div>
                                    <div className="text-[10px] text-slate-400">Helped Count</div>
                                </div>
                            </div>
                            <span className="text-2xl font-bold text-slate-800 font-mono tracking-tighter">
                                {helpCount} <span className="text-sm font-sans font-medium text-slate-400">回</span>
                            </span>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500">
                                    <Megaphone size={20} />
                                </div>
                                <div className="text-left">
                                    <div className="text-xs font-bold text-slate-500">依頼実績 (完了済)</div>
                                    <div className="text-[10px] text-slate-400">Paid Requests</div>
                                </div>
                            </div>
                            <span className="text-xl font-bold text-slate-700 font-mono tracking-tighter">
                                {reqCount} <span className="text-sm font-sans font-medium text-slate-400">回</span>
                            </span>
                        </div>
                    </div>
                </div>

                {/* Footer Decor */}
                <div className="h-2 w-full bg-slate-100"></div>
            </motion.div>
        </div>
    );
};
