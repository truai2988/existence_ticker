import { Menu, Download } from "lucide-react";
import React, { useState } from "react";
import { useWallet } from "../hooks/useWallet";
import { useProfile } from "../hooks/useProfile";
import { getMillis } from "../logic/worldPhysics";
import { AppViewMode } from "../types";
import { SideDrawer } from "./SideDrawer";
import { NoticePanel } from "./NoticePanel";
import { usePWAInstall } from "../hooks/usePWAInstall";
import { globalTriggerPWAInstall } from "../utils/pwaEvent";

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
  const { availableLm, committedLm } = useWallet();
  const { profile } = useProfile();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { isStandalone } = usePWAInstall();

  const balance = availableLm + committedLm;

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
                    className="w-10 h-10 rounded-lg shadow-sm border border-slate-200/50 shrink-0 object-cover"
                  />
                  {/* Text Group */}
                  <div className="flex flex-col min-w-0">
                    <h1
                      className="text-sm sm:text-xl font-semibold tracking-[0.08em] sm:tracking-[0.15em] text-slate-800 uppercase leading-tight whitespace-nowrap"
                      style={{ fontFamily: "'Cormorant Garamond', serif" }}
                    >
                      Existence Ticker
                    </h1>
                    {/* Supplemental: Balance info */}
                    {(!viewMode || viewMode === "home") && (
                      <div className="flex items-center gap-1 text-slate-500">
                        <span className="text-xs font-bold tracking-widest uppercase whitespace-nowrap">
                          手持ち：{Math.floor(balance).toLocaleString()}
                        </span>
                        <span className="text-xs text-slate-400 font-medium whitespace-nowrap">
                          (あと{daysLeft}日)
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Cluster: Bell + Hamburger */}
                <div className="flex h-12 items-center gap-3 shrink-0">
                  {/* PWA Install Icon */}
                  {!isStandalone && (
                    <button
                      onClick={() => globalTriggerPWAInstall(true)}
                      className="p-2 -mr-1 text-sky-500 hover:text-sky-600 bg-sky-50/50 hover:bg-sky-50 rounded-full transition-all active:scale-95"
                      aria-label="アプリをインストール"
                    >
                      <Download size={20} strokeWidth={2} />
                    </button>
                  )}

                  {/* Notice Bell */}
                  <NoticePanel />

                  {/* Hamburger Menu */}
                  <button
                    onClick={() => setIsDrawerOpen(true)}
                    className="p-3 -mr-3 text-slate-500 hover:text-slate-800 transition-colors active:scale-95"
                    aria-label="メニューを開く"
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
