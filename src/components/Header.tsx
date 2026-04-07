import { Menu } from "lucide-react";
import React, { useState } from "react";
import { useWallet } from "../hooks/useWallet";
import { useProfile } from "../hooks/useProfile";
import { getMillis } from "../logic/worldPhysics";
import { AppViewMode } from "../types";
import { SideDrawer } from "./SideDrawer";
import { NoticePanel } from "./NoticePanel";
import { useLanguage } from "../contexts/LanguageContext";

interface HeaderProps {
  viewMode?: AppViewMode;
  onTabChange: (tab: AppViewMode) => void;
  onOpenOnboarding: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  viewMode,
  onTabChange,
  onOpenOnboarding,
}) => {
  const { balance } = useWallet();
  const { profile } = useProfile();
  const { t: MESSAGES } = useLanguage();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Days left: Consistent with HomeView logic
  const cycleDays = profile?.scheduled_cycle_days || 10;
  const cycleStartedAt = getMillis(
    profile?.cycle_started_at || profile?.created_at,
  );
  const nextReset = cycleStartedAt + cycleDays * 24 * 60 * 60 * 1000;
  const daysLeft = Math.max(
    0,
    Math.ceil((nextReset - Date.now()) / (1000 * 60 * 60 * 24)),
  );

  return (
    <>
      <header className="relative w-full pt-safe z-40">
        <div className="relative w-full">
          <div className="relative w-full bg-transparent">
            <div className="w-full max-w-2xl mx-auto px-6 py-4 md:py-6">
              <div className="flex items-center justify-between">
                {/* Left Side: Logo + Text */}
                <div className="flex items-center gap-3 min-w-0">
                  {/* Square Logo */}
                  <img
                    src="/logo.png"
                    alt="Existence Ticker"
                    className="w-10 h-10 rounded-lg shadow-sm border border-slate-300/50 shrink-0 object-cover"
                  />
                  {/* Text Group */}
                  <div className="flex flex-col min-w-0">
                    <h1
                      className="text-sm sm:text-xl font-light tracking-[0.2em] sm:tracking-[0.3em] text-slate-900 uppercase leading-tight whitespace-nowrap"
                      style={{ fontFamily: "'Noto Serif JP', serif" }}
                    >
                      Existence Ticker
                    </h1>
                    {/* Supplemental: Balance info */}
                    {(!viewMode || viewMode === "home") && (
                      <div className="flex items-center gap-2 text-slate-700 mt-0.5">
                        <span className="text-xs font-medium tracking-wider uppercase whitespace-nowrap">
                          {MESSAGES.LAYOUT.HEADER_BALANCE}{Math.floor(balance).toLocaleString()}
                        </span>
                        <div className="w-[1px] h-3 bg-slate-300" />
                        <span className="text-xs font-medium tracking-wider whitespace-nowrap">
                          {MESSAGES.LAYOUT.HEADER_DAYS_LEFT_PREFIX}{daysLeft}{MESSAGES.LAYOUT.HEADER_DAYS_LEFT_SUFFIX}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Cluster: Bell + Hamburger */}
                <div className="flex h-12 items-center gap-3 shrink-0">
                  {/* Notice Bell */}
                  <NoticePanel />

                  {/* Hamburger Menu */}
                  <button
                    onClick={() => setIsDrawerOpen(true)}
                    className="p-3 -mr-3 text-slate-700 hover:text-slate-900 transition-colors active:scale-95"
                    aria-label={MESSAGES.LAYOUT.OPEN_MENU}
                  >
                    <Menu size={24} strokeWidth={1.5} />
                  </button>
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
