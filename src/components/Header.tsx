import { MapPin, Users } from "lucide-react";
import React, { useState } from "react";
import { motion } from "framer-motion";
import { useWallet } from "../hooks/useWallet";
import { useProfile } from "../hooks/useProfile";
import { formatLocationCount } from "../utils/formatLocation";
import { LUNAR_CONSTANTS } from "../constants";

import { HeaderNavigation } from "./HeaderNavigation";
import { AppViewMode } from "../types";
import { PresenceModal } from "./PresenceModal";
import { AnimatePresence } from "framer-motion";
import { useLocationStats } from "../hooks/useLocationStats";
import { HeaderStatusDisplay } from "./HeaderStatusDisplay";

interface HeaderProps {
  viewMode?: AppViewMode;
  onTabChange: (tab: AppViewMode) => void;
  onOpenOnboarding: () => void;
}

export const Header: React.FC<HeaderProps> = ({ viewMode, onTabChange, onOpenOnboarding }) => {
  const { availableLm, committedLm } = useWallet();
  const { profile } = useProfile();
  const [showPresenceModal, setShowPresenceModal] = useState(false);
  
  // Use custom hook for stats
  const { statsCount } = useLocationStats(
    profile?.location?.prefecture,
    profile?.location?.city
  );

  const getLocationText = () => {
    if (!profile?.location) return "エリア未設定";
    return `${profile.location.prefecture}${profile.location.city}`;
  };

  const getUserCountText = () => {
    if (statsCount === null) return "確認中...";
    return formatLocationCount(statsCount);
  };

  // Percentages for Water Clock (Max 2400)
  const maxCapacity = LUNAR_CONSTANTS.REBIRTH_AMOUNT;
  const committedHeight = Math.min(100, (committedLm / maxCapacity) * 100);
  const availableHeight = Math.min(100, (availableLm / maxCapacity) * 100);

  return (
    <>
      <header className="relative w-full pt-safe z-40">
        <div className="relative w-full">
          <div className="relative w-full bg-transparent">
            <div className="w-full max-w-2xl mx-auto px-6 py-3 md:py-6">
              <div className="flex items-center justify-between">
                {/* Left Side: Title & Location (Extracted) */}
                <div className="flex flex-col">
                  <HeaderStatusDisplay 
                    viewMode={viewMode}
                    locationText={getLocationText()}
                    onOpenLocation={() => setShowPresenceModal(true)}
                  />

                  {/* Supplemental Info for Home View */}
                  {(!viewMode || viewMode === 'home') && (
                    <button
                      onClick={() => setShowPresenceModal(true)}
                      className="flex items-center gap-1.5 text-left hover:opacity-70 transition-opacity group"
                    >
                      <MapPin
                        size={16}
                        className="text-slate-500 group-hover:text-slate-700 transition-colors"
                      />
                      <span className="text-sm min-[375px]:text-base text-slate-600 font-mono tracking-wider uppercase group-hover:text-slate-900 transition-colors truncate max-w-[100px] min-[375px]:max-w-[160px]">
                        {getLocationText()}
                      </span>
                      <span className="text-xs text-slate-400 mx-1">|</span>
                      <Users
                        size={16}
                        className="text-slate-500 group-hover:text-slate-700 transition-colors"
                      />
                      <span className="text-sm min-[375px]:text-base text-slate-600 font-mono tracking-wider group-hover:text-slate-900 transition-colors whitespace-nowrap">
                        {getUserCountText()}
                      </span>
                    </button>
                  )}
                </div>

                {/* Right Cluster: Clock & Navigation - Aligned to Bottom Baseline */}
                <div className="flex items-center gap-3 min-[375px]:gap-4 h-full">
                  {/* Water Clock Indicator (Lm Capacity) - Compact Visual Only */}
                  <div className="relative w-8 h-10 bg-white/40 rounded-full overflow-hidden border border-slate-200/60 shadow-[inset_0_1px_4px_rgba(0,0,0,0.05)] backdrop-blur-sm shrink-0 group">
                    {/* 1. Committed Lm (Bottom Layer - Frozen/Sediment) */}
                    <motion.div
                      className="absolute bottom-0 left-0 right-0 bg-slate-300/40 saturate-0"
                      initial={{ height: 0 }}
                      animate={{ height: `${committedHeight}%` }}
                      transition={{ duration: 1.0, ease: "easeOut" }}
                    />

                    {/* 2. Available Lm (Top Layer - Liquid Light) */}
                    <motion.div
                      className="absolute bottom-0 left-0 right-0 bg-amber-300/60"
                      initial={{ height: 0, bottom: 0 }}
                      animate={{
                        height: `${availableHeight}%`,
                        bottom: `${committedHeight}%`,
                      }}
                      transition={{
                        duration: 1.0,
                        ease: "easeOut",
                        delay: 0.2,
                      }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/20 to-transparent animate-pulse" />
                    </motion.div>

                    {/* Glass Reflection & Inner Border */}
                    <div className="absolute inset-x-1.5 top-1 bottom-1 border-r border-white/20 rounded-full opacity-40 pointer-events-none" />
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/45 to-transparent opacity-60 pointer-events-none" />
                  </div>

                  {/* Navigation - No longer needs margin-top, aligned by items-end */}
                  <HeaderNavigation
                    currentTab={viewMode || "home"}
                    onTabChange={onTabChange}
                    onOpenOnboarding={onOpenOnboarding}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {showPresenceModal && (
          <PresenceModal onClose={() => setShowPresenceModal(false)} />
        )}
      </AnimatePresence>
    </>
  );
};
