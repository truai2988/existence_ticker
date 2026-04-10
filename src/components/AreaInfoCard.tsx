import React from "react";
import { MapPin, Users, ChevronRight } from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";
import { useLocationStats } from "../hooks/useLocationStats";
import { useProfile } from "../hooks/useProfile";
import { formatLocationCount, mapPrefecture, mapCity } from "../utils/formatLocation";

interface AreaInfoCardProps {
  profile: ReturnType<typeof useProfile>["profile"];
  onClick: () => void;
}

export const AreaInfoCard: React.FC<AreaInfoCardProps> = ({ profile, onClick }) => {
  const { t: MESSAGES } = useLanguage();
  const { statsCount } = useLocationStats(
    profile?.location?.prefecture,
    profile?.location?.city,
  );

  const locationText = profile?.location
    ? `${mapPrefecture(profile.location.prefecture)} ${mapCity(profile.location.city)}`.trim() : MESSAGES.PROFILE.TXT_AREA_NOT_SET;

  const userCountText = statsCount === null ? MESSAGES.PROFILE.TXT_CHECKING : formatLocationCount(statsCount, MESSAGES);

  return (
    <div className="group">
      <div className="text-sm font-bold text-slate-700 ml-2 mb-2 font-sans group-hover:text-slate-800 transition-colors">
        {MESSAGES.PROFILE.TTL_AREA_INFO}
      </div>
      <button 
        onClick={onClick}
        className="w-full bg-white shadow-sm border border-slate-200 rounded-2xl overflow-hidden transition-all hover:bg-white hover:shadow-md active:scale-[0.99] text-left"
      >
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-full bg-emerald-50 group-hover:bg-emerald-100 transition-colors">
              <MapPin size={18} className="text-emerald-500" />
            </div>
            <div>
              <p className="text-base font-bold text-slate-900 font-sans">
                {locationText}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Users size={14} className="text-slate-700" />
                <span className="text-sm text-slate-800 font-mono">
                  {userCountText}
                </span>
              </div>
            </div>
          </div>
          <ChevronRight size={16} className="text-slate-700 group-hover:text-slate-700 transition-colors" />
        </div>
      </button>
    </div>
  );
};
