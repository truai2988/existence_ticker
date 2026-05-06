import { Menu, LogIn } from "lucide-react";
import React, { useState } from "react";
import { AppViewMode } from "../types";
import { SideDrawer } from "./SideDrawer";
import { NoticePanel } from "./NoticePanel";
import { InviteModal } from "./InviteModal";
import { useLanguage } from "../contexts/LanguageContext";
import { useAuthModal } from "../contexts/AuthModalContext";

interface HeaderProps {
  viewMode?: AppViewMode;
  onTabChange: (tab: AppViewMode) => void;
  onOpenOnboarding: () => void;
  isGuestMode?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  viewMode,
  onTabChange,
  onOpenOnboarding,
  isGuestMode = false,
}) => {
  const { t: MESSAGES } = useLanguage();
  const { showAuthModal } = useAuthModal();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <>
      <header className="relative w-full pt-safe z-40">
        <div className="relative w-full">
          <div className="relative w-full bg-transparent">
            <div className="w-full max-w-2xl mx-auto px-6 py-4 md:py-6 flex items-center justify-between">
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
                      className="text-xl font-serif font-medium text-slate-900 uppercase leading-tight truncate"
                      style={{ fontFamily: "'Noto Serif JP', serif" }}
                    >
                      ET
                    </h1>
                  </div>
                </div>

                {/* Right Cluster: Conditional on guest/auth state */}
                <div className="flex h-12 items-center gap-1 shrink-0">
                  {isGuestMode ? (
                    /* Guest: Show Login button */
                    <button
                      onClick={showAuthModal}
                      className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-800 bg-white/80 border border-slate-200 rounded-xl shadow-sm hover:bg-white hover:shadow-md transition-all active:scale-95"
                    >
                      <LogIn size={16} strokeWidth={2} />
                      <span>{MESSAGES.AUTH_MODAL.BTN_LOGIN}</span>
                    </button>
                  ) : (
                    /* Authenticated: Show Invite + Bell */
                    <>
                      <InviteModal />
                      <NoticePanel />
                    </>
                  )}

                  {/* Hamburger Menu (always visible) */}
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
