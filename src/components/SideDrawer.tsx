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
import { useLanguage } from "../contexts/LanguageContext";

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
  const { t: MESSAGES } = useLanguage();

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
      label: MESSAGES.LAYOUT.TAB_HOME,
      icon: Home,
    },
    {
      id: "history",
      label: MESSAGES.JOURNAL.TITLE,
      icon: HistoryIcon,
    },
    {
      id: "profile",
      label: MESSAGES.LAYOUT.TAB_PROFILE,
      icon: User,
    },
    {
      id: "onboarding",
      label: MESSAGES.LAYOUT.SIDEDRAWER_ONBOARDING,
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
                <div className="text-3xl font-light tracking-tighter text-slate-900 leading-none font-['Inter']">
                  ET
                </div>
                <div className="text-xs text-slate-700 font-light tracking-[0.35em] uppercase mt-1">
                  Existence Ticker
                </div>
              </button>
              <button
                onClick={onClose}
                className="p-2 text-slate-700 hover:text-slate-800 hover:bg-slate-200/30 rounded-full transition-colors"
                aria-label={MESSAGES.MODALS.BTN_CLOSE}
              >
                <X size={20} strokeWidth={1.5} />
              </button>
            </div>

            {/* Divider */}
            <div className="mx-7 border-b border-slate-300/50" />

            {/* Install App Button (if not standalone) */}
            {!isStandalone && (
              <div className="px-5 pt-6 pb-2">
                <button
                  onClick={() => {
                    globalTriggerPWAInstall(true);
                    onClose();
                  }}
                  className="w-full px-5 py-4 text-left flex items-center gap-4 rounded-xl transition-all duration-200 bg-sky-50 hover:bg-sky-100 text-sky-700 shadow-sm border border-sky-100/50"
                  aria-label={MESSAGES.LAYOUT.SIDEDRAWER_INSTALL}
                >
                  <Download size={20} strokeWidth={2} />
                  <div className="flex flex-col">
                    <span className="text-base font-bold tracking-wide">
                      {MESSAGES.LAYOUT.SIDEDRAWER_INSTALL}
                    </span>
                  </div>
                </button>
              </div>
            )}

            {/* Menu Items */}
            <nav className={`flex-1 overflow-y-auto no-scrollbar px-5 ${!isStandalone ? 'pt-2 pb-8' : 'py-8'} space-y-2`}>
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
                          ? "bg-white/80 text-slate-900 shadow-sm"
                          : "text-slate-700 hover:bg-white/40 hover:text-slate-900"
                      }
                    `}
                  >
                    <item.icon
                      size={20}
                      strokeWidth={active ? 2 : 1.5}
                      className={active ? "text-slate-900" : ""}
                    />
                    <div className="flex flex-col">
                      <span
                        className={`text-base tracking-wide ${active ? "font-bold" : "font-light"}`}
                      >
                        {item.label}
                      </span>
                    </div>
                  </button>
                );
              })}
            </nav>

            {/* Footer */}
            <div className="px-7 pb-10 pt-6 border-t border-slate-300/50 flex flex-col items-center">
              <button
                onClick={() => {
                  window.open('/trust', '_blank');
                  onClose();
                }}
                className="text-xs font-serif text-slate-700 tracking-[0.15em] hover:text-slate-800 transition-colors duration-200"
              >
                {MESSAGES.LAYOUT.SIDEDRAWER_TRUST}
              </button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};
