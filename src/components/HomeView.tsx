import React from "react";
import { motion } from "framer-motion";
import { Inbox, Megaphone, Heart, ArrowRight, ArrowDown, User } from "lucide-react";
import { useProfile } from "../hooks/useProfile";
import { useWallet } from "../hooks/useWallet";
import { isProfileComplete } from "../utils/profileCompleteness";

interface HomeViewProps {
  onOpenFlow: () => void; // "Help" (Inflow)
  onOpenRequest: () => void; // "Request" (Outflow - Contract)
  onOpenGift: () => void; // "Gift" (Outflow - Pure)
  onOpenProfile: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  onOpenFlow,
  onOpenRequest,
  onOpenGift,
  onOpenProfile,
}) => {
  const { profile } = useProfile();
  const { availableLm } = useWallet();
  const isComplete = isProfileComplete(profile);
  const hasNoSpace = availableLm <= 0;

  const handleProtectedAction = (action: () => void) => {
    if (!isComplete) {
      if (confirm("プロフィールの器を完成させると、相手に信頼が伝わりやすくなります（あと1分で完了します）。\n\nプロフィールを編集しますか？")) {
        onOpenProfile();
        return;
      }
    }
    action();
  };

  return (
    <div className="flex-1 flex flex-col justify-center items-center w-full min-h-full p-4 pt-6 pb-12 relative">
      
      {/* Onboarding Banner */}
      {!isComplete && (
        <div className="absolute top-4 left-4 right-4 md:max-w-xl md:mx-auto z-20 bg-white border border-slate-100 shadow-xl shadow-slate-200/50 rounded-2xl p-4 flex items-center justify-between animate-fade-in-down">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-slate-50 rounded-full text-slate-400 border border-slate-100">
              <User size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">あなたの器を完成させましょう</h3>
              <p className="text-[10px] text-slate-500 font-medium">隣人に存在を知らせるために</p>
            </div>
          </div>
          <button 
            onClick={onOpenProfile}
            className="text-xs font-bold bg-slate-900 text-white px-4 py-2 rounded-full hover:bg-slate-800 transition-all shadow-md hover:shadow-lg active:scale-95"
          >
            磨く
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
          onClick={() => handleProtectedAction(onOpenFlow)}
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
          onClick={() => handleProtectedAction(onOpenRequest)}
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
               ? 'bg-slate-50/50 border-slate-200 cursor-not-allowed opacity-60' 
               : 'bg-white/60 backdrop-blur-sm border-slate-100 hover:shadow-xl hover:-translate-y-1 hover:bg-white'
          }`}
        >
          <div className={`shrink-0 p-4 rounded-2xl transition-all duration-300 group-hover:scale-110 ${
             hasNoSpace ? 'bg-slate-100' : 'bg-pink-50/80 group-hover:bg-pink-100/80'
          }`}>
            <Heart size={28} className={hasNoSpace ? 'text-slate-400' : 'text-pink-500'} />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className={`text-lg font-bold mb-1 transition-colors ${
                 hasNoSpace ? 'text-slate-400' : 'text-slate-800 group-hover:text-pink-600'
            }`}>
              贈る
            </h2>
             <p className="text-xs text-slate-500 font-medium leading-relaxed">
                {hasNoSpace ? 'ゆとり不足' : '感謝を届ける'}
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
