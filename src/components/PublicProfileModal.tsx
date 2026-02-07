import React from 'react';
import { motion } from 'framer-motion';
import { X, Handshake, Megaphone, MapPin, Link as LinkIcon, Camera, ShieldCheck } from 'lucide-react';
import { useOtherProfile } from '../hooks/useOtherProfile';
import { getTrustRank } from '../utils/trustRank';

interface PublicProfileModalProps {
    userId: string;
    isMasked?: boolean;
    onClose: () => void;
}

export const PublicProfileModal: React.FC<PublicProfileModalProps> = ({ userId, isMasked, onClose }) => {
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
    
    const rank = getTrustRank(profile); 

    const hasLinks = !isMasked && profile.links && (profile.links.x || profile.links.instagram || profile.links.website);
    
    // Formatting Location
    const locationText = profile.location 
        ? `${profile.location.prefecture || ''} ${profile.location.city || ''}`.trim()
        : '';

    // Masking Logic overrides
    const displayName = isMasked ? "匿名" : profile.name;
    const displayAvatar = isMasked ? null : profile.avatarUrl;
    const displayBio = isMasked ? null : profile.bio;

    const age_group = profile.age_group;

    return (
        <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 animate-fade-in">
            {/* Backdrop Click to Close */}
            <div className="absolute inset-0" onClick={onClose} />

            <motion.div 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl relative z-10 flex flex-col max-h-[90vh]"
            >
                {/* Close Button - Fixed relative to card */}
                <button 
                     onClick={onClose}
                     className="absolute top-4 right-4 p-2 bg-white/60 hover:bg-white rounded-full transition-colors backdrop-blur-md z-50"
                >
                    <X size={20} className="text-slate-500" />
                </button>

                {/* Single Scrollable Container for Header & Content */}
                <div className="overflow-y-auto custom-scrollbar w-full">
                    {/* Header Pattern */}
                    <div className="h-24 bg-gradient-to-br from-slate-50 to-slate-100 w-full shrink-0" />

                    {/* Main Content */}
                    <div className="px-6 -mt-10 pb-8 text-center relative z-10">
                        {/* Avatar */}
                        <div className="w-24 h-24 mx-auto bg-white rounded-full p-1 shadow-sm mb-3">
                            <div className="w-full h-full bg-slate-50 rounded-full flex items-center justify-center overflow-hidden border border-slate-100">
                                {displayAvatar ? (
                                    <img src={displayAvatar} alt={displayName} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                                        <span className="text-3xl font-bold text-slate-400">
                                            {isMasked ? '?' : (profile.name?.charAt(0).toUpperCase() || '?')}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        {/* Name & Headline */}
                        <div className="flex items-center justify-center gap-1.5 mb-1">
                            <h2 className="text-xl font-bold text-slate-900 leading-snug">{displayName}</h2>
                            {rank.isVerified && (
                                <ShieldCheck size={18} className="text-blue-500 fill-blue-50" strokeWidth={2.5} />
                            )}
                        </div>
                        
                        {/* Meta Row: Rank | ID | Location */}
                        <div className="flex flex-wrap justify-center gap-2 mb-4 items-center px-4">
                            <span className={`text-xs whitespace-nowrap font-bold px-2.5 py-0.5 rounded-full ${rank.bg} ${rank.color} flex items-center gap-1 shadow-sm`}>
                                {rank.icon}
                                {rank.label}
                            </span>
                            
                            {!isMasked && (
                                <span className="text-xs text-slate-400 font-mono px-2 py-0.5 bg-slate-50/50 rounded-lg border border-slate-100/50">
                                    ID: {profile.id.slice(0,6)}
                                </span>
                            )}

                            {age_group && (
                                <span className="text-xs text-slate-500 font-bold px-2 py-0.5 bg-slate-50/50 rounded-lg border border-slate-100/50 whitespace-nowrap">
                                    {age_group}
                                    {profile.gender && profile.gender !== 'other' && ` / ${profile.gender === 'male' ? '男性' : '女性'}`}
                                </span>
                            )}
                            
                            {locationText && (
                                <span className="text-xs text-slate-500 flex items-center gap-1 px-2 py-0.5 bg-slate-50/50 rounded-lg border border-slate-100/50 whitespace-nowrap">
                                    <MapPin size={10} className="shrink-0 text-slate-400" />
                                    {locationText}
                                    {isMasked && profile.gender && profile.gender !== 'other' && ` / ${profile.gender === 'male' ? '男性' : '女性'}`}
                                </span>
                            )}
                        </div>

                        {/* Bio (Quiet Space) */}
                        {displayBio && (
                            <div className="mb-6 mx-2">
                                <p className="text-sm text-slate-600 leading-relaxed bg-slate-50/80 px-5 py-4 rounded-2xl border border-slate-100 text-left whitespace-pre-wrap">
                                    {displayBio}
                                </p>
                            </div>
                        )}

                        {/* Links */}
                        {hasLinks && (
                             <div className="flex justify-center gap-4 mb-8">
                                {profile.links?.x && (
                                    <a 
                                        href={profile.links.x.startsWith('http') ? profile.links.x : `https://x.com/${profile.links.x.replace('@','')}`} 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        className="p-3 bg-slate-900 text-white rounded-full hover:scale-110 transition-transform shadow-sm"
                                    >
                                        <span className="text-xs font-bold block w-4 h-4 text-center leading-4">𝕏</span>
                                    </a>
                                )}
                                {profile.links?.instagram && (
                                    <a 
                                        href={profile.links.instagram.startsWith('http') ? profile.links.instagram : `https://instagram.com/${profile.links.instagram.replace('@','')}`} 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        className="p-3 bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 text-white rounded-full hover:scale-110 transition-transform shadow-sm"
                                    >
                                        <Camera size={16} />
                                    </a>
                                )}
                                {profile.links?.website && (
                                    <a 
                                        href={profile.links.website} 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        className="p-3 bg-white border border-slate-200 text-slate-500 rounded-full hover:scale-110 hover:text-blue-500 hover:border-blue-200 transition-all shadow-sm"
                                    >
                                        <LinkIcon size={16} />
                                    </a>
                                )}
                            </div>
                        )}

                        {/* Stats - Subtle & Dignified */}
                        <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                            <div className="flex flex-col items-center p-3 rounded-xl hover:bg-slate-50/50 transition-colors">
                                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">手伝った回数</div>
                                <div className="flex items-baseline gap-1">
                                    <Handshake size={14} className="text-blue-400" />
                                    <span className="text-xl font-medium text-slate-700 tabular-nums">
                                        {helpCount}
                                    </span>
                                    <span className="text-xs text-slate-400 font-normal">回</span>
                                </div>
                            </div>
                            
                            <div className="flex flex-col items-center p-3 rounded-xl hover:bg-slate-50/50 transition-colors">
                                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">依頼実績</div>
                                <div className="flex items-baseline gap-1">
                                    <Megaphone size={14} className="text-slate-400" />
                                    <span className="text-xl font-medium text-slate-700 tabular-nums">
                                        {reqCount}
                                    </span>
                                    <span className="text-xs text-slate-400 font-normal">回</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};
