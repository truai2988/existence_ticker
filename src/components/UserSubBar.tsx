import React from 'react';
import { useAuth } from '../hooks/useAuthHook';
import { useProfile } from '../hooks/useProfile';
import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { MapPin, ChevronRight } from 'lucide-react';
import { PresenceModal } from './PresenceModal';
import { AccountSettingsModal } from './AccountSettingsModal';
import { AnimatePresence } from 'framer-motion';

export const UserSubBar: React.FC = () => {
    const { user } = useAuth();
    const { profile } = useProfile();
    
    // profile.name holds the display name
    // --- Presence / Status Line Logic ---
    const [statsCount, setStatsCount] = useState<number | null>(null);
    const [showPresenceModal, setShowPresenceModal] = useState(false);
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    
    // Fetch stats for current location
    useEffect(() => {
        if (!profile?.location?.prefecture || !profile?.location?.city || !db) return;
        
        const fetchStats = async () => {
             try {
                // db exists here due to early return check
                const docId = `${profile.location!.prefecture}_${profile.location!.city}`;
                const docRef = doc(db!, 'location_stats', docId);
                const snap = await getDoc(docRef);
                if (snap.exists()) {
                    setStatsCount(snap.data().count || 0);
                } else {
                    setStatsCount(0);
                }
             } catch (e) {
                 console.error("Status fetch failed", e);
             }
        };
        fetchStats();
    }, [profile?.location]);

    const getStatusText = () => {
        if (!profile?.location) return "地域未設定";
        if (statsCount === null) return "確認中...";
        if (statsCount === 0) return "登録者はまだいません";
        if (statsCount < 5) return "5名未満";
        return `${statsCount}名`;
    };

    const currentName = profile?.name || 'User';

    if (!user) return null;

    return (
        <>
            <div className="w-full bg-slate-50 border-b border-slate-100/50">
                <div className="max-w-md mx-auto px-6 py-2 flex justify-between items-center">
                    
                    {/* Presence Status Line */}
                    <button 
                        onClick={() => setShowPresenceModal(true)}
                        className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors group"
                    >
                        <MapPin size={11} className="text-slate-300 group-hover:text-blue-400 transition-colors" />
                        <span className="font-mono tracking-wide">
                            {profile?.location?.city || "エリア"}: <span className="font-bold text-slate-500 group-hover:text-slate-700">{getStatusText()}</span>
                        </span>
                        <ChevronRight size={11} className="text-slate-300 opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                    </button>

                    {/* User Name (Settings Trigger) */}
                    <button 
                        onClick={() => setShowSettingsModal(true)}
                        className="text-xs text-slate-300 font-mono tracking-wide flex items-center gap-1 hover:text-slate-200 transition-colors"
                    >
                        <span>Signed in as:</span>
                        <span className="text-slate-400 font-bold hover:text-blue-500 hover:underline transition-all underline-offset-2">{currentName}</span>
                    </button>
                </div>
            </div>

            <AnimatePresence>
                {showPresenceModal && <PresenceModal onClose={() => setShowPresenceModal(false)} />}
                {showSettingsModal && <AccountSettingsModal onClose={() => setShowSettingsModal(false)} />}
            </AnimatePresence>
        </>
    );
};
