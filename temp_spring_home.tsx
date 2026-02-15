import React from "react";
import { motion } from "framer-motion";
import {
  Inbox,
  Megaphone,
  User,
  X
} from "lucide-react";
import { useProfile } from "../hooks/useProfile";
import { getTrustRank } from "../utils/trustRank";

interface HomeViewProps {
  onOpenFlow: () => void; // "Help" (Inflow)
  onOpenRequest: () => void; // "Request" (Outflow)
  onOpenProfileEdit: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  onOpenFlow,
  onOpenRequest,
  onOpenProfileEdit,
}) => {
  const { profile } = useProfile();
  const trustRank = getTrustRank(profile);
  const [isDismissed, setIsDismissed] = React.useState(false);

  // Pure CSS Animation for "Breathing" to offload JS thread
  // Added directly into style block for zero overhead
  const loadingStyle = `
    @keyframes breathe {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.02); }
    }
  `;

  return (
    <div className="flex-1 flex flex-col items-center w-full min-h-full p-4 relative max-w-md mx-auto overflow-hidden">
      <style>{loadingStyle}</style>



      {/* 2. CORE VESSEL: YIN-YANG INTERFACE */}
      <div className="flex-1 flex items-center justify-center w-full my-4 relative">
        {/* Simplified Background Aura - Pure CSS Opacity */}
        <div className="absolute inset-0 bg-slate-100/50 rounded-full blur-2xl opacity-30 z-0 pointer-events-none" />

        {/* CONTAINER: 288px (w-72) */}
        <div className="relative w-72 h-72 z-10">
            
            {/* A. BACKGROUND LAYER (The Breathing Shape - Pure CSS) */}
            <div
              className="absolute inset-0 rounded-full shadow-2xl shadow-slate-200/50 border-4 border-white overflow-hidden bg-white"
              style={{ animation: 'breathe 8s ease-in-out infinite' }}
            >
                 <svg viewBox="0 0 100 100" className="w-full h-full shape-rendering-geometricPrecision">
                    <defs>
                        <linearGradient id="yangGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#DBEAFE" /> {/* blue-100 */}
                        <stop offset="100%" stopColor="#BFDBFE" /> {/* blue-200 */}
                        </linearGradient>
                        <linearGradient id="yinGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#FEF3C7" /> {/* amber-100 */}
                        <stop offset="100%" stopColor="#FDE68A" /> {/* amber-200 */}
                        </linearGradient>
                    </defs>

                    {/* YANG (Heaven/Top) */}
                    <path 
                        d="M 0 50 C 30 80, 70 20, 100 50 A 50 50 0 0 0 0 50 Z" 
                        fill="url(#yangGradient)" 
                        stroke="none"
                    />

                    {/* YIN (Earth/Bottom) */}
                    <path 
                        d="M 0 50 C 30 80, 70 20, 100 50 A 50 50 0 0 1 0 50 Z" 
                        fill="url(#yinGradient)"
                        stroke="none"
                    />
                    
                     {/* Divider Line */}
                    <path 
                        d="M 0 50 C 30 80, 70 20, 100 50" 
                        fill="none" 
                        stroke="white" 
                        strokeWidth="2"
                    />
                 </svg>
            </div>

            {/* B. INTERACTIVE LAYER (Static Text, Glow Hover) */}
            
            {/* Top Content (Yang) */}
            <motion.button
                onClick={onOpenFlow}
                className="absolute top-0 left-0 w-full h-[50%] flex flex-col items-center justify-center pt-6 z-20 outline-none group"
                whileTap={{ scale: 0.98 }}
            >
                <div className="text-blue-600 flex flex-col items-center drop-shadow-sm group-hover:text-blue-500 group-hover:drop-shadow-md transition-all duration-300 transform group-hover:scale-110">
                    <Inbox size={28} strokeWidth={2.5} className="mb-1" />
                    <span className="text-xs font-bold tracking-[0.2em] opacity-80">HELP</span>
                    <span className="text-lg font-bold">手伝う</span>
                </div>
            </motion.button>
            
            {/* Bottom Content (Yin) */}
            <motion.button
                onClick={onOpenRequest}
                className="absolute bottom-0 left-0 w-full h-[50%] flex flex-col items-center justify-center pb-6 z-20 outline-none group"
                whileTap={{ scale: 0.98 }}
            >
                <div className="text-amber-700 flex flex-col items-center drop-shadow-sm group-hover:text-amber-600 group-hover:drop-shadow-md transition-all duration-300 transform group-hover:scale-110">
                    <span className="text-lg font-bold">頼む</span>
                    <span className="text-xs font-bold tracking-[0.2em] opacity-80 mt-0.5">WISH</span>
                    <Megaphone size={24} strokeWidth={2.5} className="mt-1" />
                </div>
            </motion.button>
        </div>
      </div>



      {/* 4. ONBOARDING BANNER */}
      {!trustRank.isVerified && !isDismissed && (
        <div className="w-full max-w-sm mx-auto z-20 bg-white border border-slate-100 shadow-xl shadow-slate-200/50 rounded-2xl p-4 flex flex-col gap-3 animate-fade-in-down mb-6 relative mt-12">
             <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-50 rounded-full text-slate-400 border border-slate-100 shrink-0">
                      <User size={16} />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-slate-800">
                        プロフィールを充実させて、信頼を高めましょう
                      </h3>
                      <p className="text-[11px] text-slate-500 font-medium">
                        あなたの誠実さがより伝わりやすくなります
                      </p>
                    </div>
                  </div>
                   <button
                    onClick={() => setIsDismissed(true)}
                    className="p-1 hover:bg-slate-100 rounded-full transition-colors shrink-0"
                    aria-label="閉じる"
                  >
                    <X size={14} className="text-slate-400" />
                  </button>
             </div>
          
          <button
            onClick={onOpenProfileEdit}
            className="w-full text-xs font-bold bg-slate-900 text-white px-4 py-2.5 rounded-xl hover:bg-slate-800 transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
          >
            プロフィールを編集
          </button>
        </div>
      )}
    </div>
  );
};
