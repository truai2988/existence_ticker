import { Menu } from "lucide-react";
import React, { useState } from "react";
import { AppViewMode } from "../types";
import { SideDrawer } from "./SideDrawer";
import { NoticePanel } from "./NoticePanel";
import { InviteModal } from "./InviteModal";
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
  const { t: MESSAGES } = useLanguage();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

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
                  <div className="flex flex-col min-w-0 justify-center">
                    <h1
                      className="text-xl sm:text-2xl font-bold tracking-[0.3em] text-slate-900 uppercase leading-tight truncate"
                      style={{ fontFamily: "'Noto Serif JP', serif" }}
                    >
                      ET
                    </h1>
                  </div>
                </div>

                {/* Right Cluster: Invite + Bell + Hamburger */}
                <div className="flex h-12 items-center gap-1 shrink-0">
                  {/* 招待ボタン */}
                  <InviteModal />

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
