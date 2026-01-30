import React from "react";
import { motion } from "framer-motion";
import {
  Inbox,
  Megaphone,
  Heart,
  ArrowRight,
  ArrowDown,
  User,
  X,
} from "lucide-react";
import { useProfile } from "../hooks/useProfile";
import { useWallet } from "../hooks/useWallet";
import { getTrustRank } from "../utils/trustRank";

interface HomeViewProps {
  onOpenFlow: () => void; // "Help" (Inflow)
  onOpenRequest: () => void; // "Request" (Outflow - Contract)
  onOpenGift: () => void; // "Gift" (Outflow - Pure)
  onOpenProfileEdit: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  onOpenFlow,
  onOpenRequest,
  onOpenGift,
  onOpenProfileEdit,
}) => {
  const { profile } = useProfile();
  const { availableLm } = useWallet();
  const hasNoSpace = availableLm <= 0;
  const trustRank = getTrustRank(profile);
  const [isDismissed, setIsDismissed] = React.useState(false);



  return (
    <div className="flex-1 flex flex-col justify-center items-center w-full min-h-full p-4 pt-6 pb-12 relative max-w-md mx-auto">
      {/* Onboarding Banner */}

      {!trustRank.isVerified && !isDismissed && (
        <div className="w-full max-w-lg mx-auto z-20 bg-white border border-slate-100 shadow-xl shadow-slate-200/50 rounded-2xl p-4 flex flex-col gap-4 animate-fade-in-down mb-6 relative">
             <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-slate-50 rounded-full text-slate-400 border border-slate-100 shrink-0">
                      <User size={18} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-800">
                        プロフィールを充実させて、信頼を高めましょう
                      </h3>
                      <p className="text-[10px] text-slate-500 font-medium">
                        あなたの誠実さがより伝わりやすくなります
                      </p>
                    </div>
                  </div>
                   <button
                    onClick={() => setIsDismissed(true)}
                    className="p-1 hover:bg-slate-100 rounded-full transition-colors shrink-0"
                    aria-label="閉じる"
                  >
                    <X size={16} className="text-slate-400" />
                  </button>
             </div>
          
          <button
            onClick={onOpenProfileEdit}
            className="w-full text-xs font-bold bg-slate-900 text-white px-4 py-3 rounded-xl hover:bg-slate-800 transition-all shadow-md hover:shadow-lg active:scale-95 flex items-center justify-center gap-2"
          >
            プロフィールを編集
          </button>
        </div>
      )}

      {/* === CENTER VISUALIZATION: ENERGY FLOW === */}
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 -z-10 flex flex-col items-center justify-center opacity-5 pointer-events-none">
        <motion.div
          animate={{ y: [0, 20, 0], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="flex flex-col items-center gap-4"
        >
          <ArrowDown size={160} className="text-slate-900" />
        </motion.div>
      </div>

      {/* === MAIN ACTION GRID === */}
      <div className="w-full max-w-lg grid grid-cols-2 gap-4 auto-rows-fr px-4">
        {/* 1. HELP (INFLOW) */}
        <button
          onClick={onOpenFlow}
          className="col-span-2 group relative bg-white/60 backdrop-blur-sm rounded-3xl p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:bg-white transition-all duration-300 border border-slate-100 flex flex-col items-center text-center gap-4 overflow-hidden active:scale-[0.98]"
        >
          <div className="shrink-0 p-4 bg-blue-50/80 rounded-2xl group-hover:bg-blue-100/80 group-hover:scale-110 transition-all duration-300">
            <Inbox size={28} className="text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-slate-800 mb-1 group-hover:text-blue-700 transition-colors">
              手伝う
            </h2>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              誰かの願いを叶える
            </p>
          </div>

          <div className="hidden absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
            <ArrowRight size={20} className="text-blue-400" />
          </div>
        </button>

        {/* 2. REQUEST (OUTFLOW) */}
        <button
          onClick={onOpenRequest}
          className="col-span-1 group relative bg-white/60 backdrop-blur-sm rounded-3xl p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:bg-white transition-all duration-300 border border-slate-100 flex flex-col items-center text-center gap-4 overflow-hidden active:scale-[0.98]"
        >
          <div className="shrink-0 p-4 bg-amber-50/80 rounded-2xl group-hover:bg-amber-100/80 group-hover:scale-110 transition-all duration-300">
            <Megaphone size={28} className="text-amber-500" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-slate-800 mb-1 group-hover:text-amber-600 transition-colors">
              頼む
            </h2>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              願いを託す
            </p>
          </div>

          <div className="hidden absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
            <ArrowRight size={20} className="text-amber-400" />
          </div>
        </button>

        {/* 3. GIFT (PURE) */}
        <button
          onClick={() => !hasNoSpace && onOpenGift()}
          disabled={hasNoSpace}
          className={`col-span-1 group relative rounded-3xl p-6 shadow-sm transition-all duration-300 border flex flex-col items-center text-center gap-4 overflow-hidden active:scale-[0.98] ${
            hasNoSpace
              ? "bg-slate-50/50 border-slate-200 cursor-not-allowed opacity-60"
              : "bg-white/60 backdrop-blur-sm border-slate-100 hover:shadow-xl hover:-translate-y-1 hover:bg-white"
          }`}
        >
          <div
            className={`shrink-0 p-4 rounded-2xl transition-all duration-300 group-hover:scale-110 ${
              hasNoSpace
                ? "bg-slate-100"
                : "bg-pink-50/80 group-hover:bg-pink-100/80"
            }`}
          >
            <Heart
              size={28}
              className={hasNoSpace ? "text-slate-400" : "text-pink-500"}
            />
          </div>
          <div className="flex-1 min-w-0">
            <h2
              className={`text-lg font-bold mb-1 transition-colors ${
                hasNoSpace
                  ? "text-slate-400"
                  : "text-slate-800 group-hover:text-pink-600"
              }`}
            >
              贈る
            </h2>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              {hasNoSpace ? "ゆとり不足" : "感謝を届ける"}
            </p>
          </div>

          {!hasNoSpace && (
            <div className="hidden absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
              <ArrowRight size={20} className="text-pink-400" />
            </div>
          )}
        </button>
      </div>
    </div>
  );
};
