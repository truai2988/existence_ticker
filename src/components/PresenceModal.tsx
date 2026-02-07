import { useState, useEffect } from "react";
import { X, MapPin, Loader2, ChevronLeft } from "lucide-react";
import { motion } from "framer-motion";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { PREFECTURES } from "../data/prefectures";
import { useLocationData } from "../hooks/useLocationData";
import { useProfile } from "../hooks/useProfile";
import { formatLocationCount } from "../utils/formatLocation";

interface PresenceModalProps {
  onClose: () => void;
}

export const PresenceModal = ({ onClose }: PresenceModalProps) => {
  const { profile } = useProfile();
  
  // Initialize with user's location if available, otherwise Tokyo (default)
  const [selectedPref, setSelectedPref] = useState(profile?.location?.prefecture || "東京都");
  const [selectedCity, setSelectedCity] = useState(profile?.location?.city || "");

  // Sync state when profile loads or updates
  useEffect(() => {
      if (profile?.location) {
          if (profile.location.prefecture) setSelectedPref(profile.location.prefecture);
          if (profile.location.city) setSelectedCity(profile.location.city);
      }
  }, [profile]);

  const { cities, loading: loadingCities } = useLocationData(selectedPref);
  
  const [count, setCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch stats when selection changes
  useEffect(() => {
    if (!selectedPref || !selectedCity) {
        setCount(null);
        return;
    }

    const fetchStats = async () => {
        setLoading(true);
        try {
            if (!db) {
                console.warn("Firestore not initialized");
                setCount(0);
                return;
            }

            const docId = `${selectedPref}_${selectedCity}`;
            const docRef = doc(db, 'location_stats', docId);
            const snap = await getDoc(docRef);

            if (snap.exists()) {
                setCount(snap.data().count || 0);
            } else {
                setCount(0);
            }
        } catch (error) {
            console.error("Failed to fetch location stats:", error);
            setCount(0);
        } finally {
            setLoading(false);
        }
    };

    fetchStats();
  }, [selectedPref, selectedCity]);

  // Handle prefecture change
  const handlePrefChange = (pref: string) => {
      setSelectedPref(pref);
      setSelectedCity(""); // Reset city when prefecture changes
  };

  // Determine display text
  const getDisplayText = () => {
      // Logic moved to shared utility
      if (loading) return "確認中...";
      if (count === null) return "地域を選択してください";
      return formatLocationCount(count);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
      />

      {/* Modal Content - White Porcelain Style */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative w-full max-w-md bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 overflow-hidden"
        style={{
            boxShadow: "0 25px 50px -12px rgba(255, 255, 255, 0.25), 0 0 0 1px rgba(255,255,255,0.5) inset"
        }}
      >
        {/* Header */}
        <div className="p-6 pb-2 flex justify-between items-start">
            <div>
                <h2 className="text-xl font-serif text-slate-800 tracking-widest flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-slate-400" />
                    <span>エリア別の登録状況</span>
                </h2>
            </div>
            <button 
                onClick={onClose}
                className="p-2 rounded-full hover:bg-slate-100/80 transition-colors text-slate-400"
            >
                <X size={20} />
            </button>
        </div>

        {/* Content */}
        <div className="p-6 pt-4 space-y-6">
            
            {/* Display Area - Calm & Compact */}
            <div className="relative h-28 rounded-xl bg-slate-50/50 border border-slate-100 flex flex-col items-center justify-center overflow-hidden">
                {/* Subtle Breathing Light */}
                {count !== null && count > 0 && (
                            <div className="absolute inset-0 pointer-events-none">
                        <motion.div 
                            animate={{ opacity: [0.2, 0.4, 0.2] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                            className="absolute inset-0"
                            style={{
                                background: "radial-gradient(circle, rgba(56, 189, 248, 0.1) 0%, rgba(255, 255, 255, 0) 60%)"
                            }}
                        />
                         {/* Floating Dots */}
                         {[...Array(5)].map((_, i) => (
                             <motion.div
                                key={i}
                                className="absolute w-1 h-1 bg-blue-300 rounded-full blur-[1px]"
                                initial={{ 
                                    x: Math.random() * 200 - 100, 
                                    y: Math.random() * 60 - 30, 
                                    opacity: 0 
                                }}
                                animate={{ 
                                    y: [null, Math.random() * -30],
                                    opacity: [0, 0.8, 0]
                                }}
                                transition={{ 
                                    duration: 3 + Math.random() * 2, 
                                    repeat: Infinity, 
                                    delay: Math.random() * 2 
                                }}
                                style={{
                                    left: "50%",
                                    top: "60%"
                                }}
                             />
                         ))}
                    </div>
                )}

                <div className="relative z-10 text-center">
                    {loading ? (
                        <div className="flex flex-col items-center gap-2 text-slate-400">
                             <Loader2 className="w-5 h-5 animate-spin" />
                             <span className="text-xs font-medium">確認中...</span>
                        </div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            key={getDisplayText()}
                            className="flex flex-col items-center"
                        >
                            <span className="font-serif text-slate-700 text-base tracking-wide">
                                {getDisplayText()}
                            </span>
                        </motion.div>
                    )}
                </div>
            </div>

            {/* Selection Controls */}
            <div className="space-y-3">
                 {/* Prefecture */}
                 <div className="relative">
                    <select 
                        value={selectedPref}
                        onChange={(e) => handlePrefChange(e.target.value)}
                        className="w-full p-3 bg-white border border-slate-200 rounded-xl text-slate-700 text-sm font-medium appearance-none focus:outline-none focus:ring-2 focus:ring-slate-200/50 shadow-sm transition-all"
                    >
                        <option value="">都道府県を選択</option>
                        {PREFECTURES.map(pref => (
                            <option key={pref} value={pref}>{pref}</option>
                        ))}
                    </select>
                    <ChevronLeft size={16} className="absolute right-3 top-1/2 -translate-y-1/2 -rotate-90 text-slate-400 pointer-events-none" />
                 </div>

                 {/* City */}
                 <div className="relative">
                    <select 
                        value={selectedCity}
                        onChange={(e) => setSelectedCity(e.target.value)}
                        disabled={!selectedPref || loadingCities}
                        className="w-full p-3 bg-white border border-slate-200 rounded-xl text-slate-700 text-sm font-medium appearance-none focus:outline-none focus:ring-2 focus:ring-slate-200/50 shadow-sm transition-all disabled:opacity-50 disabled:bg-slate-50"
                    >
                        <option value="">
                            {loadingCities ? "読み込み中..." : "市区町村を選択"}
                        </option>
                        {cities.map(city => (
                            <option key={city} value={city}>{city}</option>
                        ))}
                    </select>
                    <ChevronLeft size={16} className="absolute right-3 top-1/2 -translate-y-1/2 -rotate-90 text-slate-400 pointer-events-none" />
                 </div>
            </div>

            <p className="text-xs text-slate-400 text-center leading-relaxed">
                ※プライバシー保護のため、5名未満は一律の表示となります
            </p>

        </div>
      </motion.div>
    </div>
  );
};
