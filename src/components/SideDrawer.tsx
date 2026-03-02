import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Home,
  History as HistoryIcon,
  User,
  Sprout,
  Download,
} from "lucide-react";
import { AppViewMode } from "../types";
import { usePWAInstall } from "../hooks/usePWAInstall";
import { globalTriggerPWAInstall } from "../utils/pwaEvent";

interface SideDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentTab: AppViewMode;
  onTabChange: (tab: AppViewMode) => void;
  onOpenOnboarding?: () => void;
}

export const SideDrawer: React.FC<SideDrawerProps> = ({
  isOpen,
  onClose,
  currentTab,
  onTabChange,
  onOpenOnboarding,
}) => {
  const { isStandalone } = usePWAInstall();

  const handleNavigate = (tab: AppViewMode) => {
    onTabChange(tab);
    onClose();
  };

  const isActive = (id: string) => {
    if (id === "profile")
      return currentTab === "profile" || currentTab === "profile_edit";
    return currentTab === id;
  };

  const menuItems = [
    {
      id: "home",
      label: "ホーム",
      sub: "HOME",
      icon: Home,
    },
    {
      id: "history",
      label: "巡りの足跡",
      sub: "JOURNAL",
      icon: HistoryIcon,
    },
    {
      id: "profile",
      label: "自分",
      sub: "PROFILE",
      icon: User,
    },
    {
      id: "onboarding",
      label: "このインフラについて",
      sub: "GUIDE",
      icon: Sprout,
    },
  ] as const;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-slate-900/10 backdrop-blur-[2px] z-[998]"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 bottom-0 w-72 z-[999] flex flex-col shadow-2xl"
            style={{ backgroundColor: "#F9F8F4" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-7 pt-8 pb-6">
              <button
                onClick={() => handleNavigate("home")}
                className="text-left group transition-opacity hover:opacity-70 active:scale-[0.98]"
              >
                <div className="text-3xl font-light tracking-tighter text-slate-800 leading-none font-['Inter']">
                  ET
                </div>
                <div className="text-[10px] text-slate-400 font-light tracking-[0.35em] uppercase mt-1">
                  Existence Ticker
                </div>
              </button>
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/30 rounded-full transition-colors"
                aria-label="閉じる"
              >
                <X size={20} strokeWidth={1.5} />
              </button>
            </div>

            {/* Divider */}
            <div className="mx-7 border-b border-slate-200/50" />

            {/* Install App Button (if not standalone) */}
            {!isStandalone && (
              <div className="px-5 pt-6 pb-2">
                <button
                  onClick={() => {
                    globalTriggerPWAInstall(true);
                    onClose();
                  }}
                  className="w-full px-5 py-4 text-left flex items-center gap-4 rounded-xl transition-all duration-200 bg-sky-50 hover:bg-sky-100 text-sky-700 shadow-sm border border-sky-100/50"
                  aria-label="アプリをインストール"
                >
                  <Download size={20} strokeWidth={2} />
                  <div className="flex flex-col">
                    <span className="text-base font-bold tracking-wide">
                      アプリとして追加
                    </span>
                    <span className="text-[9px] text-sky-500/80 tracking-[0.3em] uppercase font-mono mt-0.5">
                      INSTALL
                    </span>
                  </div>
                </button>
              </div>
            )}

            {/* Menu Items */}
            <nav className={`flex-1 px-5 ${!isStandalone ? 'pt-2 pb-8' : 'py-8'} space-y-2`}>
              {menuItems.map((item) => {
                const isOnboarding = item.id === "onboarding";
                const active = !isOnboarding && isActive(item.id);

                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      if (isOnboarding) {
                        onOpenOnboarding?.();
                        onClose();
                      } else {
                        handleNavigate(item.id as AppViewMode);
                      }
                    }}
                    className={`
                      w-full px-5 py-4 text-left flex items-center gap-4 rounded-xl transition-all duration-200
                      ${
                        active
                          ? "bg-white/80 text-slate-800 shadow-sm"
                          : "text-slate-500 hover:bg-white/40 hover:text-slate-700"
                      }
                    `}
                  >
                    <item.icon
                      size={20}
                      strokeWidth={active ? 2 : 1.5}
                      className={active ? "text-slate-700" : ""}
                    />
                    <div className="flex flex-col">
                      <span
                        className={`text-base tracking-wide ${active ? "font-bold" : "font-light"}`}
                      >
                        {item.label}
                      </span>
                      <span className="text-[9px] text-slate-400 tracking-[0.3em] uppercase font-mono mt-0.5">
                        {item.sub}
                      </span>
                    </div>
                  </button>
                );
              })}
            </nav>

            {/* Footer */}
            <div className="px-7 pb-10 pt-4 border-t border-slate-200/50 flex flex-col items-center gap-3">
              <button
                onClick={() => {
                  window.open('/trust', '_blank');
                  onClose();
                }}
                className="text-xs font-serif text-slate-400 tracking-[0.15em] hover:text-slate-600 transition-colors duration-200"
              >
                約束と庭師について
              </button>
              <div className="text-[10px] text-slate-300 tracking-[0.2em] uppercase font-mono">
                万年筆の引き出し
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};
