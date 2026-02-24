import { Menu } from "lucide-react";
import React, { useState } from "react";
import { motion } from "framer-motion";
import { useWallet } from "../hooks/useWallet";
import { useProfile } from "../hooks/useProfile";
import { getMillis } from "../logic/worldPhysics";
import { LUNAR_CONSTANTS } from "../constants";

import { AppViewMode } from "../types";
import { SideDrawer } from "./SideDrawer";
import { NoticePanel } from "./NoticePanel";

interface HeaderProps {
  viewMode?: AppViewMode;
  onTabChange: (tab: AppViewMode) => void;
  onOpenOnboarding: () => void;
}

export const Header: React.FC<HeaderProps> = ({ viewMode, onTabChange, onOpenOnboarding }) => {
  const { availableLm, committedLm } = useWallet();
  const { profile } = useProfile();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Percentages for Water Clock (Max 2400)
  const maxCapacity = LUNAR_CONSTANTS.REBIRTH_AMOUNT;
  const committedHeight = Math.min(100, (committedLm / maxCapacity) * 100);
  const availableHeight = Math.min(100, (availableLm / maxCapacity) * 100);
  const balance = availableLm + committedLm;

  // Days left: Consistent with HomeView logic
  const cycleDays = profile?.scheduled_cycle_days || 10;
  const cycleStartedAt = getMillis(profile?.cycle_started_at || profile?.created_at);
  const nextReset = cycleStartedAt + cycleDays * 24 * 60 * 60 * 1000;
  const daysLeft = Math.max(0, Math.ceil((nextReset - Date.now()) / (1000 * 60 * 60 * 24)));

  const handleGoHome = () => {
    onTabChange("home");
  };

  return (
    <>
      <header className="relative w-full pt-safe z-40">
        <div className="relative w-full">
          <div className="relative w-full bg-transparent">
            <div className="w-full max-w-2xl mx-auto px-6 py-4 md:py-6">
              <div className="flex items-start justify-between">
                {/* Left Side: Logo (clickable → Home) */}
                <button
                  onClick={handleGoHome}
                  className="min-w-0 text-left group transition-opacity hover:opacity-70 active:scale-[0.98]"
                  aria-label="ホームへ戻る"
                >
                  <div className="flex flex-col">
                    <div className="text-xs font-light tracking-[0.4em] uppercase text-slate-500 leading-none mb-3 select-none font-sans group-hover:text-slate-600 transition-colors">
                      Existence Ticker
                    </div>
                    <h1 className="text-xl font-bold tracking-widest text-slate-900 uppercase font-sans">
                      ET
                    </h1>
                  </div>

                  {/* Supplemental: Balance info */}
                  {(!viewMode || viewMode === 'home') && (
                    <div className="flex items-center gap-1 mt-1 text-slate-500">
                      <span className="text-xs font-bold tracking-widest uppercase whitespace-nowrap">
                        手持ち：{Math.floor(balance).toLocaleString()}
                      </span>
                      <span className="text-xs text-slate-400 font-medium whitespace-nowrap">
                        (あと{daysLeft}日)
                      </span>
                    </div>
                  )}
                </button>

                {/* Right Cluster: Water Clock + Bell + Hamburger */}
                <div className="flex h-12 items-end gap-3 min-[375px]:gap-4 shrink-0">
                  {/* Water Clock Indicator (Lm Capacity) - Home only */}
                  {(!viewMode || viewMode === 'home') && (
                    <div className="relative w-8 h-10 bg-white/40 rounded-full overflow-hidden border border-slate-200/60 shadow-[inset_0_1px_4px_rgba(0,0,0,0.05)] backdrop-blur-sm shrink-0 group">
                      {/* 1. Committed Lm (Bottom Layer - Frozen/Sediment) */}
                      <motion.div
                        className="absolute bottom-0 left-0 right-0 bg-slate-400/80 saturate-[0.2]"
                        initial={{ height: 0 }}
                        animate={{ height: `${committedHeight}%` }}
                        transition={{ duration: 1.0, ease: "easeOut" }}
                      />

                      {/* 2. Available Lm (Top Layer - Liquid Light) */}
                      <motion.div
                        className="absolute left-0 right-0 bg-amber-300/60"
                        initial={{ height: 0, bottom: 0 }}
                        animate={{
                          height: `${availableHeight}%`,
                          bottom: `${committedHeight}%`,
                        }}
                        transition={{
                          duration: 1.0,
                          ease: "easeOut",
                          delay: 0.1,
                        }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/20 to-transparent animate-pulse" />
                      </motion.div>

                      {/* Glass Reflection & Inner Border */}
                      <div className="absolute inset-x-1.5 top-1 bottom-1 border-r border-white/20 rounded-full opacity-40 pointer-events-none" />
                      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/45 to-transparent opacity-60 pointer-events-none" />
                    </div>
                  )}

                  {/* Action Icons Group: Bell + Hamburger (Centered together) */}
                  <div className="flex items-center gap-3">
                    {/* Notice Bell (Home-specific) */}
                    <NoticePanel />

                    {/* Hamburger Menu → Opens Drawer */}
                    <button
                      onClick={() => setIsDrawerOpen(true)}
                      className="p-1 -mr-1 text-slate-500 hover:text-slate-800 transition-colors active:scale-95"
                      aria-label="メニューを開く"
                    >
                      <Menu size={24} strokeWidth={1.5} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Side Drawer */}
      <SideDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        currentTab={viewMode || "home"}
        onTabChange={onTabChange}
        onOpenOnboarding={onOpenOnboarding}
      />
    </>
  );
};
