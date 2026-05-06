import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useAuthModal } from "../contexts/AuthModalContext";
import { AuthScreen } from "./AuthScreen";
import { useLanguage } from "../contexts/LanguageContext";

/**
 * AuthModal — Full-screen overlay for deferred login.
 * Renders the existing AuthScreen inside a modal with a close button
 * and gentle microcopy encouraging the user to authenticate.
 */
export const AuthModal: React.FC = () => {
  const { isOpen, closeAuthModal, onAuthSuccess } = useAuthModal();
  const { t: MESSAGES } = useLanguage();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="fixed inset-0 z-[900] flex flex-col overflow-hidden"
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-[#F9F8F4]/95 backdrop-blur-md" />

          {/* Content Layer */}
          <div className="relative z-10 flex flex-col w-full h-full overflow-y-auto no-scrollbar">
            {/* Top Bar: Close button */}
            <div className="w-full max-w-2xl mx-auto px-4 pt-4 flex justify-end shrink-0">
              <motion.button
                onClick={closeAuthModal}
                className="p-2.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200/40 rounded-full transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-label={MESSAGES.AUTH_MODAL.BTN_CLOSE}
              >
                <X size={22} strokeWidth={1.5} />
              </motion.button>
            </div>

            {/* Microcopy Header */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.5 }}
              className="w-full max-w-2xl mx-auto px-6 pb-4 text-center shrink-0"
            >
              <p className="text-sm font-serif text-slate-700 leading-relaxed whitespace-pre-wrap tracking-wide">
                {MESSAGES.AUTH_MODAL.HEADER_COPY}
              </p>
            </motion.div>

            {/* AuthScreen (existing component) */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="flex-1"
            >
              <AuthScreen onSuccess={onAuthSuccess} isModal={true} />
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
