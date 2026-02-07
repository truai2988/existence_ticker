import { motion, AnimatePresence } from "framer-motion";
import { Inbox, Megaphone } from "lucide-react";
import { useWallet } from "../hooks/useWallet";

export const HomeView: React.FC<{
  onOpenFlow: () => void;
  onOpenRequest: () => void;
}> = ({ onOpenFlow, onOpenRequest }) => {
  const { status } = useWallet();

  const isRitualReady = status === "RITUAL_READY";
  const isEmpty = status === "EMPTY";

  return (
    <div className="flex-1 flex flex-col items-center justify-center w-full min-h-full px-6 py-4 relative max-w-md mx-auto overflow-hidden">
      <div className="flex-1 flex items-center justify-center w-full relative">
        <div className="absolute inset-0 bg-slate-100/50 rounded-full blur-3xl opacity-40 z-0 pointer-events-none transform scale-110" />

        <div className="relative w-[90%] max-w-[360px] aspect-square z-10 rotate-45">
          <div className="absolute inset-0 rounded-full shadow-2xl shadow-slate-200/50 border-4 border-white overflow-hidden bg-white">
            <svg
              viewBox="0 0 100 100"
              className="w-full h-full shape-rendering-geometricPrecision"
            >
              <defs>
                <filter id="dividerGlow">
                  <feGaussianBlur stdDeviation="1" />
                  <feMerge>
                    <feMergeNode />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                {/* HELP (Yellow) */}
                <linearGradient id="helpGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#FEF3C7" />
                  <stop offset="100%" stopColor="#FDE68A" />
                </linearGradient>
                {/* WISH (Blue) */}
                <linearGradient id="wishGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#BFDBFE" />
                  <stop offset="100%" stopColor="#DBEAFE" />
                </linearGradient>
                <linearGradient
                  id="porcelain"
                  x1="0%"
                  y1="0%"
                  x2="0%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor="#F8FAFC" />
                  <stop offset="100%" stopColor="#E2E8F0" />
                </linearGradient>
              </defs>

              <g>
                {/* Top Lobe (HELP - Yellow) */}
                <path
                  d="M 50 0 A 25 25 0 0 1 50 50 A 25 25 0 0 0 50 100 A 50 50 0 0 1 50 0 Z"
                  fill={
                    isRitualReady || isEmpty
                      ? "url(#porcelain)"
                      : "url(#helpGrad)"
                  }
                  className="transition-all duration-1000"
                />
                {/* Bottom Lobe (WISH - Blue) */}
                <path
                  d="M 50 0 A 25 25 0 0 1 50 50 A 25 25 0 0 0 50 100 A 50 50 0 0 0 50 0 Z"
                  fill={
                    isRitualReady || isEmpty
                      ? "url(#porcelain)"
                      : "url(#wishGrad)"
                  }
                  className="transition-all duration-1000"
                />
                {/* Vertical S Divider */}
                <path
                  d="M 50 0 A 25 25 0 0 1 50 50 A 25 25 0 0 0 50 100"
                  fill="none"
                  stroke={isRitualReady || isEmpty ? "#94A3B8" : "white"}
                  strokeWidth="2.5"
                  filter="url(#dividerGlow)"
                  strokeLinecap="round"
                  className="transition-colors duration-1000"
                />
              </g>
            </svg>
          </div>

          <AnimatePresence>
            {!isRitualReady && (
              <>
                <motion.button
                  key="btn-help"
                  onClick={onOpenFlow}
                  className="absolute top-[25%] left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-20 outline-none group -rotate-45"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <motion.div
                    className="text-amber-800 flex flex-col items-center group-hover:text-amber-700"
                    whileHover={{ y: -5, scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  >
                    <Inbox size={32} strokeWidth={2.5} className="mb-0.5" />
                    <span className="text-[10px] font-extrabold tracking-[0.2em] opacity-90 leading-none">
                      HELP
                    </span>
                    <span className="text-xl font-extrabold">応える</span>
                  </motion.div>
                </motion.button>

                <motion.button
                  key="btn-wish"
                  onClick={onOpenRequest}
                  className="absolute top-[75%] left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-20 outline-none group -rotate-45"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <motion.div
                    className="text-blue-800 flex flex-col items-center group-hover:text-blue-700"
                    whileHover={{ y: -5, scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  >
                    <span className="text-xl font-extrabold">願う</span>
                    <span className="text-[10px] font-extrabold tracking-[0.2em] opacity-90 mt-0.5 leading-none">
                      WISH
                    </span>
                    <Megaphone size={28} strokeWidth={2.5} className="mt-0.5" />
                  </motion.div>
                </motion.button>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
